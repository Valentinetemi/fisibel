'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { FileUpload } from '@/components/FileUpload'
import { QualityAnalysisResults } from '@/components/QualityAnalysisResults'
import { Skeleton } from '@/components/ui/skeleton'
import { QualityAnalysisResult } from '@/lib/services/data-quality'
import { arrayToJSON, downloadFile } from '@/lib/utils/csv-export'
import { ShieldCheck, Microscope, Fingerprint, BarChart3, Sparkles, ArrowRight } from 'lucide-react'

const FEATURES = [
  { icon: Microscope, label: 'Missing & duplicates', desc: 'Per-column missing value rates and duplicate row detection' },
  { icon: Fingerprint, label: 'PII detection', desc: 'Flags personally identifiable columns before training' },
  { icon: BarChart3, label: 'Model readiness score', desc: 'Composite 0–100 score with penalty breakdown' },
  { icon: Sparkles, label: 'AI recommendations', desc: 'Gemini-powered fix suggestions tailored to your data' },
]

const FORMAT_BADGES = ['CSV', 'JSON', 'XLSX', '≤ 50 MB']

export default function DataQualityPage() {
  const [analysis, setAnalysis] = useState<QualityAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = async (file: File) => {
    setError(null)
    setAnalysis(null)
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/analyze', { method: 'POST', body: formData })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Analysis failed')
      }
      const data = await response.json()
      setAnalysis(data.analysis)
    } catch (err) {
      setError((err as Error).message || 'Failed to analyze file')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = () => {
    if (!analysis) return
    const report = {
      timestamp: new Date().toISOString(),
      fileMetrics: { totalRows: analysis.totalRows, totalColumns: analysis.totalColumns, fileSize: analysis.fileSize, detectedDomain: analysis.detectedDomain },
      qualityMetrics: { overallCompleteness: analysis.overallCompleteness, duplicateRows: analysis.duplicateRows, duplicatePercentage: analysis.duplicatePercentage, piiColumnsCount: analysis.piiColumnsCount },
      modelReadiness: { score: analysis.modelReadinessScore, breakdown: analysis.scoreBreakdown },
      columns: analysis.columns.map((c) => ({ name: c.name, dataType: c.dataType, missingPercentage: c.missingPercentage, uniqueCount: c.uniqueCount, isPII: c.isPII, ...(c.mean !== undefined && { statistics: { mean: c.mean, median: c.median, stdDev: c.stdDev, min: c.min, max: c.max, outliers: c.outlierCount } }) })),
    }
    const json = arrayToJSON(report as any)
    downloadFile(json, `data-quality-report-${Date.now()}.json`, 'application/json')
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />

      <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-8 sm:py-12">
        <AnimatePresence mode="wait">

          {/* ── Upload view ── */}
          {!analysis && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col gap-8"
            >
              {/* Page header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-100 mb-3">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-xs font-semibold text-green-700">Training Readiness Analysis</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Data Quality</h1>
                  <p className="text-sm text-gray-500 mt-1.5 max-w-lg">
                    Upload your dataset and get an instant quality report - PII detection, completeness scores, and an AI-powered model readiness verdict.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {FORMAT_BADGES.map(f => (
                    <span key={f} className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-[11px] font-semibold text-gray-500">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Main grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left: upload */}
                <div className="flex flex-col gap-4">
                  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 sm:p-8 flex-1">
                    <FileUpload onFileSelect={handleFileSelect} isLoading={loading} />

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 overflow-hidden"
                        >
                          <p className="text-sm text-red-700">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {loading && (
                      <div className="mt-6 space-y-3">
                        <div className="flex items-center gap-2 mb-4">
                          <motion.div
                            className="w-2 h-2 rounded-full bg-green-500"
                            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                          />
                          <span className="text-xs text-gray-500 font-medium">Analyzing your dataset…</span>
                        </div>
                        {[1, 0.85, 0.7, 0.55].map((w, i) => (
                          <Skeleton key={i} className="h-3 rounded-full" style={{ width: `${w * 100}%` }} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: feature list + what we check */}
                <div className="flex flex-col gap-4">
                  {/* Features */}
                  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 sm:p-8">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-5">What we analyse</h3>
                    <div className="flex flex-col gap-4">
                      {FEATURES.map((f, i) => (
                        <motion.div
                          key={f.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className="flex items-start gap-4"
                        >
                          <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                            <f.icon className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{f.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{f.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Tip card */}
                  <div className="rounded-2xl border border-green-100 bg-green-50 p-5 flex items-start gap-3">
                    <ArrowRight className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-green-700 leading-relaxed">
                      <span className="font-bold">Tip:</span> Generate a clean dataset first on the{' '}
                      <a href="/generate" className="underline font-semibold hover:text-green-900">Generate page</a>,
                      then upload it here to validate before training your model.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Results view ── */}
          {analysis && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              {/* Results header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quality Report</h1>
                  <p className="text-sm text-gray-400 mt-0.5">Analysis complete · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <button
                  onClick={() => setAnalysis(null)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors"
                >
                  ← Analyse another file
                </button>
              </div>

              <QualityAnalysisResults analysis={analysis} onDownloadReport={handleDownloadReport} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}