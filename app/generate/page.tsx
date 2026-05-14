"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { GenerateInput } from "@/components/GenerateInput";
import { GenerationStreamPanel } from "@/components/GenerationStreamPanel";
import { DataTable } from "@/components/DataTable";
import { ExportToggle } from "@/components/ExportToggle";
import { Button } from "@/components/ui/button";
import { csvToJSON } from "@/lib/utils/csv-export";
import { splitGenerationStream } from "@/lib/utils/split-generation-stream";
import {
  clearPersistedGenerateResult,
  persistGenerateResult,
  loadPersistedGenerateResult,
  GENERATE_SESSION,
} from "@/lib/utils/generate-session";
import { buildGeneratedDatasetBasename } from "@/lib/utils/dataset-export-name";
import type { UploadedVisualContext } from "@/lib/utils/multimodal-context";
import { ChevronRight, Upload, CheckCircle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

export default function GeneratePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [userPrompt, setUserPrompt] = useState("");
  const [streamContent, setStreamContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [streamKey, setStreamKey] = useState(0);
  const [bootInsight, setBootInsight] = useState("");
  const [downloadBasename, setDownloadBasename] = useState("");
  const [visualContext, setVisualContext] =
    useState<UploadedVisualContext | null>(null);
  const hasStarted =
    isStreaming ||
    streamContent.length > 0 ||
    (hasCompleted && generatedData.length > 0);

  const { reasoning, csv } = useMemo(
    () => splitGenerationStream(streamContent),
    [streamContent]
  );

  const rowCountLive = useMemo(() => {
    const lines = csv.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length < 2) return 0;
    return lines.length - 1;
  }, [csv]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedPrompt = sessionStorage.getItem("userPrompt");
    if (savedPrompt) setUserPrompt(savedPrompt);

    const savedContent = sessionStorage.getItem(GENERATE_SESSION.stream);
    if (savedContent) setStreamContent(savedContent);

    const { rows, headers: hdrs, downloadBasename: savedBase } =
      loadPersistedGenerateResult();
    if (rows && hdrs) {
      setGeneratedData(rows);
      setHeaders(hdrs);
      setHasCompleted(true);
      if (savedBase) setDownloadBasename(savedBase);
    }
  }, []);

  useEffect(() => {
    if (streamContent.length > 0 && bootInsight) setBootInsight("");
  }, [streamContent, bootInsight]);

  const handlePromptChange = (val: string) => {
    setUserPrompt(val);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("userPrompt", val);
    }
  };

  const handleGenerate = async (
    prompt: string,
    uploadedVisualContext?: UploadedVisualContext | null
  ) => {
    setVisualContext(uploadedVisualContext ?? null);
    setBootInsight(
      uploadedVisualContext
        ? `Analyzing uploaded document...\nExtracting clinical parameters for ${uploadedVisualContext.detectedRegion}...\nBinding visual document context to the synthetic data specification.`
        : "We have your request and are opening the model stream. The system is reasoning about your specification—columns, geography, and safety rules—before any row data is emitted. Reasoning will appear in this panel first; CSV will flow into Live Dataset shortly. Please wait."
    );
    setStreamContent("");
    setGeneratedData([]);
    setHeaders([]);
    setDownloadBasename("");
    setHasCompleted(false);
    setIsStreaming(true);
    setStreamKey((k) => k + 1);
    clearPersistedGenerateResult();
    if (typeof window !== "undefined") {
      sessionStorage.setItem(GENERATE_SESSION.stream, "");
    }

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) throw new Error("Generation failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        setStreamContent((prev) => {
          const updated = prev + chunk;
          if (typeof window !== "undefined") {
            sessionStorage.setItem(GENERATE_SESSION.stream, updated);
          }
          return updated;
        });
      }

      const finalChunk = decoder.decode();
      if (finalChunk) {
        buffer += finalChunk;
        setStreamContent((prev) => {
          const updated = prev + finalChunk;
          if (typeof window !== "undefined") {
            sessionStorage.setItem(GENERATE_SESSION.stream, updated);
          }
          return updated;
        });
      }

      const { csv: csvRaw } = splitGenerationStream(buffer);
      const csvClean = postProcessCSV(csvRaw);
      const jsonData = csvToJSON(csvClean);
      const parsedHeaders =
        jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
      const domain = extractDomain(prompt);
      const country = extractCountry(prompt);

      const fidelityRes = await fetch("/api/fidelity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvData: csvClean,
          prompt,
          domain,
          country,
        }),
      });

      const { score } = await fidelityRes.json();

      setHeaders(parsedHeaders);
      setGeneratedData(jsonData);

      if (jsonData.length > 0) {
        const exportBase = buildGeneratedDatasetBasename(prompt);
        setDownloadBasename(exportBase);
        persistGenerateResult(jsonData, parsedHeaders, exportBase);
        try {
          await fetch("/api/catalog", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              csvData: csvClean,
              name: `Generated: ${domain} - ${country}`,
              domain,
              country,
            }),
          });

          await fetch("/api/metadata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: `${domain} Dataset - ${country}`,
              domain,
              country,
              rowCount: jsonData.length,
              columns: parsedHeaders,
              fidelityScore: score,
              prompt,
            }),
          });

          toast({
            title: "Dataset Generated Successfully! 🎉",
            description: `Registered in OpenMetadata with a fidelity score of ${score}%.`,
            action: (
              <ToastAction
                altText="View in Catalog"
                onClick={() => router.push("/catalog")}
              >
                View Catalog
              </ToastAction>
            ),
          });
        } catch (err) {
          console.error("External API error:", err);
          toast({
            title: "Metadata Sync Failed",
            description:
              "The dataset was generated but failed to sync with OpenMetadata.",
            variant: "destructive",
          });
        }
      } else {
        clearPersistedGenerateResult();
      }
    } catch (error) {
      console.error("Generation error:", error);
      setBootInsight("");
      const errMsg = "Error: Failed to generate data. Please try again.";
      setStreamContent(errMsg);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(GENERATE_SESSION.stream, errMsg);
      }
      clearPersistedGenerateResult();
      setVisualContext(null);
    } finally {
      setIsStreaming(false);
      setHasCompleted(true);
      setBootInsight("");
    }
  };

  const glassCard =
    "rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)] backdrop-blur-md sm:p-8";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_20%_50%,#1a3a6b_0%,transparent_50%),radial-gradient(ellipse_at_80%_20%,#0d2d5e_0%,transparent_50%),radial-gradient(ellipse_at_60%_80%,#162952_0%,transparent_40%),#060d1f]">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_90%_60%_at_100%_0%,rgba(59,130,246,0.18),transparent_48%),radial-gradient(ellipse_80%_55%_at_0%_100%,rgba(96,165,250,0.08),transparent_52%)] blur-2xl"
        aria-hidden
      />
      <div
        className="premium-mesh-noise pointer-events-none fixed inset-0 opacity-[0.2] mix-blend-screen"
        aria-hidden
      />
      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-10 sm:py-12">
          <AnimatePresence mode="wait">
            {!hasStarted && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col items-center"
              >
                <div className="mb-10 text-center">
                  <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-400">
                    Synthetic data · Clinical infra
                  </p>
                  <h1 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl sm:leading-[1.12] lg:text-[2.35rem] lg:leading-[1.1]">
                    Generate African health datasets
                  </h1>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300 sm:text-[15px]">
                    PII-safe defaults, streaming CSV, and catalog hooks - built
                    for ML teams shipping on real-world African cohorts.
                  </p>
                </div>

                <div className="w-full max-w-xl">
                  <div className={glassCard}>
                    <GenerateInput
                      onSubmit={handleGenerate}
                      isLoading={isStreaming}
                      initialPrompt={userPrompt}
                      onPromptChange={handlePromptChange}
                    />

                    <div className="mt-8 flex items-start gap-2.5 border-t border-white/[0.08] pt-6">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#60a5fa]" />
                      <p className="text-[10px] font-medium leading-relaxed text-slate-300">
                        <span className="text-slate-200">Ops note:</span> name
                        states, LGAs, or counties not only the country for
                        distribution fidelity.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2.5">
                    {[
                      { k: "geo", label: "18 regions", sub: "Geo-grounded" },
                      { k: "stream", label: "SSE pipeline", sub: "Live CSV" },
                      { k: "qa", label: "Fidelity API", sub: "Scored export" },
                    ].map((f) => (
                      <div
                        key={f.k}
                        className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-2 py-3 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-lg"
                      >
                        <span className="block text-[10px] font-semibold uppercase tracking-wide text-white">
                          {f.label}
                        </span>
                        <span className="mt-0.5 block text-[9px] font-medium uppercase tracking-wider text-slate-400">
                          {f.sub}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {hasStarted && (
              <motion.div
                key="split"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28 }}
                className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(280px,400px)_1fr]"
              >
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="lg:sticky lg:top-8"
                >
                  <div className={glassCard}>
                    <div className="mb-6 flex items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
                      <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                        Control plane
                      </span>
                      <span className="rounded border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-300 backdrop-blur-sm">
                        v1
                      </span>
                    </div>
                    <GenerateInput
                      onSubmit={handleGenerate}
                      isLoading={isStreaming}
                      initialPrompt={userPrompt}
                      onPromptChange={handlePromptChange}
                    />
                    <div className="mt-8 flex items-start gap-2.5 border-t border-white/[0.08] pt-6">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#60a5fa]" />
                      <p className="text-[10px] font-medium leading-relaxed text-slate-300">
                        <span className="text-slate-200">Ops note:</span>{" "}
                        Regenerate while the stream stays hot - no session reset.
                      </p>
                    </div>
                  </div>
                </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.05,
                }}
                className="flex min-w-0 flex-col gap-6"
              >
                <GenerationStreamPanel
                  rawStream={streamContent}
                  reasoning={reasoning}
                  csv={csv}
                  isStreaming={isStreaming}
                  rowCount={rowCountLive}
                  streamKey={streamKey}
                  userPrompt={userPrompt}
                  bootInsight={bootInsight}
                  visualContext={visualContext}
                />

                <AnimatePresence>
                  {hasCompleted && generatedData.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="flex flex-col gap-6"
                    >
                      <ExportToggle
                        data={generatedData}
                        headers={headers}
                        fileBasename={
                          downloadBasename ||
                          buildGeneratedDatasetBasename(userPrompt)
                        }
                      />
                      <DataTable data={generatedData} headers={headers} />

                      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)] backdrop-blur-md">
                        <div className="mb-4 flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10">
                            <CheckCircle className="h-3.5 w-3.5 text-[#60a5fa]" />
                          </div>
                          <h3 className="text-sm font-medium text-white">
                            Dataset ready
                          </h3>
                        </div>
                        <ul className="mb-5 space-y-2">
                          {[
                            { text: "Your dataset is ready for download" },
                            {
                              text: "View all datasets in the",
                              link: "Catalog",
                              href: "/catalog",
                            },
                            {
                              text: "Validate model readiness on",
                              link: "Data Quality",
                              href: "/data-quality",
                            },
                          ].map((item, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -4 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.06 }}
                              className="flex items-center gap-2 text-xs text-slate-300"
                            >
                              <ChevronRight className="h-3 w-3 shrink-0 text-[#60a5fa]" />
                              <span>
                                {item.text}{" "}
                                {"href" in item && item.href && (
                                  <Link
                                    href={item.href}
                                    className="font-medium text-slate-100 hover:underline"
                                  >
                                    {item.link}
                                  </Link>
                                )}
                              </span>
                            </motion.li>
                          ))}
                        </ul>
                        <div className="border-t border-white/[0.08] pt-5">
                          <p className="mb-3 text-xs font-medium text-slate-300">
                            Ready to check training quality?
                          </p>
                          <Link href="/data-quality">
                            <Button className="h-9 gap-2 rounded-xl bg-[#3b82f6] px-4 text-xs text-white hover:bg-[#2563eb] sm:w-auto">
                              <Upload className="h-3.5 w-3.5" />
                              Check Data Quality
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      </div>
    </div>
  );
}

function extractDomain(prompt: string): string {
  const map: Record<string, string> = {
    healthcare: "Healthcare",
    health: "Healthcare",
    malaria: "Healthcare",
    fintech: "FinTech",
    finance: "FinTech",
    transaction: "FinTech",
    agriculture: "Agriculture",
    crop: "Agriculture",
    education: "Education",
    school: "Education",
    energy: "Energy",
    labor: "Labor",
  };
  const lower = prompt.toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (lower.includes(k)) return v;
  }
  return "General";
}

function extractCountry(prompt: string): string {
  const map: Record<string, string> = {
    nigeria: "Nigeria",
    nigerian: "Nigeria",
    kenya: "Kenya",
    kenyan: "Kenya",
    ghana: "Ghana",
    ghanaian: "Ghana",
    "south africa": "South Africa",
    uganda: "Uganda",
    senegal: "Senegal",
    ethiopia: "Ethiopia",
    tanzania: "Tanzania",
  };
  const lower = prompt.toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (lower.includes(k)) return v;
  }
  return "Africa";
}
