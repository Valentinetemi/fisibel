"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { GenerateInput } from "@/components/GenerateInput";
import { StreamingTerminal } from "@/components/StreamingTerminal";
import { DataTable } from "@/components/DataTable";
import { ExportToggle } from "@/components/ExportToggle";
import { Button } from "@/components/ui/button";
import { csvToJSON } from "@/lib/utils/csv-export";
import { ChevronRight, Upload, CheckCircle, Sparkles } from "lucide-react";
import { calculateFidelityScore } from "@/lib/services/gemini";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

// ── Live row counter bar ───────────────────────────────────────────────────────
function StreamingHeader({
  rowCount,
  isStreaming,
}: {
  rowCount: number;
  isStreaming: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <motion.div
          className="w-2.5 h-2.5 rounded-full bg-green-500"
          animate={
            isStreaming
              ? { scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }
              : { scale: 1, opacity: 1 }
          }
          transition={{ duration: 1, repeat: isStreaming ? Infinity : 0 }}
        />
        <span className="text-sm font-semibold text-gray-800">
          {isStreaming ? "Generating…" : "Complete"}
        </span>
        <AnimatePresence>
          {rowCount > 0 && (
            <motion.span
              key={rowCount}
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
            >
              {rowCount} rows
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {isStreaming && (
        <div className="w-28 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <motion.div
            className="h-full bg-green-500 rounded-full"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: "50%" }}
          />
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GeneratePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [userPrompt, setUserPrompt] = useState("");
  const [streamContent, setStreamContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const hasStarted = isStreaming || streamContent.length > 0;

  // On page load, restore from session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPrompt = sessionStorage.getItem("userPrompt");
      if (savedPrompt) setUserPrompt(savedPrompt);

      const savedContent = sessionStorage.getItem("streamContent");
      if (savedContent) setStreamContent(savedContent);
    }
  }, []);

  const handlePromptChange = (val: string) => {
    setUserPrompt(val);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("userPrompt", val);
    }
  };

  const handleGenerate = async (prompt: string) => {
    setStreamContent("");
    setGeneratedData([]);
    setHeaders([]);
    setHasCompleted(false);
    setIsStreaming(true);
    setRowCount(0);

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
      let lineCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        setStreamContent((prev) => {
          const updated = prev + chunk; 
          if (typeof window !== "undefined") {
            sessionStorage.setItem("streamContent", updated);
          }
          return updated;
        });
        const newLines = chunk.split("\n").filter((l) => l.trim()).length;
        lineCount += newLines;
        setRowCount(Math.max(0, lineCount - 1));
      }

      const finalChunk = decoder.decode();
      if (finalChunk) {
        buffer += finalChunk;
        setStreamContent((prev) => {
          const updated = prev + finalChunk;
          if (typeof window !== "undefined") {
            sessionStorage.setItem("streamContent", updated);
          }
          return updated;
        });
      }

      const jsonData = csvToJSON(buffer);
      const parsedHeaders = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
      const domain = extractDomain(prompt);
      const country = extractCountry(prompt);

      // Calculate real fidelity score
      const fidelityRes = await fetch("/api/fidelity",
         {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvData: buffer, prompt, domain, country }),
      });

      const { score, justification } = await fidelityRes.json();

      setHeaders(parsedHeaders);
      setGeneratedData(jsonData);
      setRowCount(jsonData.length);

      if (jsonData.length > 0) {
        try {
          // Register in Catalog
          await fetch("/api/catalog", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              csvData: buffer,
              name: `Generated: ${domain} - ${country}`,
              domain,
              country,
            }),
          });

          // Register in OpenMetadata
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
            description: "The dataset was generated but failed to sync with OpenMetadata.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Generation error:", error);
      setStreamContent("Error: Failed to generate data. Please try again.");
    } finally {
      setIsStreaming(false);
      setHasCompleted(true);
    }
  };
  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />

      <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-8 sm:py-12">
        <AnimatePresence mode="wait">
          {/* ── IDLE: single centered column ── */}
          {!hasStarted && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center"
            >
              {/* Page title */}
              <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                  Generate African Datasets
                </h1>
                <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto leading-relaxed">
                  Describe what you need. Get clean, culturally grounded
                  synthetic data ready for model training.
                </p>
              </div>

              {/* Form card */}
              <div className="w-full max-w-2xl">
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 sm:p-8">
                  <GenerateInput
                    onSubmit={handleGenerate}
                    isLoading={isStreaming}
                    initialPrompt={userPrompt}
                    onPromptChange={handlePromptChange}
                  />

                  <div className="mt-6 pt-5 border-t border-gray-100 flex items-start gap-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      <span className="font-semibold text-gray-500">
                        Pro tip:
                      </span>{" "}
                      Specify real African states, counties, or LGAs, not just
                      country names for the most authentic data distributions.
                    </p>
                  </div>
                </div>

                {/* Feature hints */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { emoji: "🌍", label: "18 African countries" },
                    { emoji: "⚡", label: "Real-time streaming" },
                    { emoji: "🔬", label: "Quality scored" },
                  ].map((f) => (
                    <div
                      key={f.label}
                      className="flex flex-col items-center gap-1.5 rounded-xl bg-white border border-gray-200 py-3 px-2 text-center"
                    >
                      <span className="text-lg">{f.emoji}</span>
                      <span className="text-[11px] text-gray-500 font-medium leading-tight">
                        {f.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── ACTIVE: 50/50 split ── */}
          {hasStarted && (
            <motion.div
              key="split"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
            >
              {/* Left: input (sticky) */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white shadow-sm p-6 sm:p-8">
                  <GenerateInput
                    onSubmit={handleGenerate}
                    isLoading={isStreaming}
                    initialPrompt={userPrompt}
                    onPromptChange={handlePromptChange}
                  />
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      <span className="font-semibold text-gray-500">
                        Pro tip:
                      </span>{" "}
                      You can regenerate with a refined prompt while reviewing
                      the output on the right.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Right: live output */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}
                className="flex flex-col gap-5"
              >
                {/* Terminal card */}
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
                  <StreamingHeader
                    rowCount={rowCount}
                    isStreaming={isStreaming}
                  />
                  <StreamingTerminal
                    content={streamContent}
                    isStreaming={isStreaming}
                    onComplete={() => setHasCompleted(true)}
                  />
                </div>

                {/* Post-completion */}
                <AnimatePresence>
                  {hasCompleted && generatedData.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="flex flex-col gap-5"
                    >
                      <ExportToggle data={generatedData} headers={headers} />
                      <DataTable data={generatedData} headers={headers} />

                      {/* Next steps */}
                      <div className="rounded-2xl border border-gray-200 bg-white p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          </div>
                          <h3 className="text-sm font-semibold text-gray-800">
                            Dataset ready
                          </h3>
                        </div>
                        <ul className="space-y-2 mb-5">
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
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.07 }}
                              className="flex items-center gap-2 text-xs text-gray-500"
                            >
                              <ChevronRight className="w-3 h-3 text-green-500 shrink-0" />
                              <span>
                                {item.text}{" "}
                                {item.href && (
                                  <Link
                                    href={item.href}
                                    className="text-green-600 font-semibold hover:underline"
                                  >
                                    {item.link}
                                  </Link>
                                )}
                              </span>
                            </motion.li>
                          ))}
                        </ul>
                        <div className="pt-4 border-t border-gray-100">
                          <p className="text-xs text-gray-500 font-medium mb-3">
                            Ready to check training quality?
                          </p>
                          <Link href="/data-quality">
                            <Button className="w-full sm:w-auto gap-2 bg-green-600 hover:bg-green-700 text-white text-xs h-9 rounded-xl">
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
