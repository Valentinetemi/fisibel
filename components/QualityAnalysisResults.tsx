'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QualityAnalysisResult } from '@/lib/services/data-quality'
import {
  AlertCircle, CheckCircle, AlertTriangle, Download,
  AlertOctagon, TrendingUp, Rows, Columns, HardDrive, Percent
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface QualityAnalysisResultsProps {
  analysis: QualityAnalysisResult
  onDownloadReport?: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getScoreColor(score: number) {
  if (score >= 80) return { text: 'text-emerald-600', stroke: '#10b981', bar: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' }
  if (score >= 50) return { text: 'text-amber-600', stroke: '#f59e0b', bar: 'bg-amber-500', light: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' }
  return { text: 'text-red-600', stroke: '#ef4444', bar: 'bg-red-500', light: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' }
}

function getReadinessLabel(score: number) {
  if (score >= 80) return { label: 'Ready for Training', icon: CheckCircle }
  if (score >= 50) return { label: 'Needs Attention', icon: AlertTriangle }
  return { label: 'Not Ready', icon: AlertOctagon }
}

// ── Animated score ring ───────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const color = getScoreColor(score)
  const r = 52
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  return (
    <div className="relative w-36 h-36 sm:w-44 sm:h-44 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <motion.circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke={color.stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={`text-4xl font-bold leading-none ${color.text}`}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
        >
          {Math.round(score)}
        </motion.span>
        <span className="text-[11px] text-gray-400 mt-1">/ 100</span>
      </div>
    </div>
  )
}

// ── Penalty bar ───────────────────────────────────────────────────────────────

function PenaltyBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(Math.abs(value) / max * 100, 100)
  const col = Math.abs(value) > 15 ? 'bg-red-400' : Math.abs(value) > 5 ? 'bg-amber-400' : 'bg-emerald-400'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-gray-500">{label}</span>
        <span className={`text-[11px] font-mono font-bold ${Math.abs(value) > 10 ? 'text-red-500' : 'text-gray-500'}`}>
          {value > 0 ? '-' : ''}{Math.abs(value).toFixed(0)} pts
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${col}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
    </div>
  )
}

// ── Column card ───────────────────────────────────────────────────────────────

function ColumnCard({ column, index }: { column: any; index: number }) {
  const [open, setOpen] = useState(false)
  const missingHigh = column.missingPercentage > 20

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`rounded-xl border bg-white transition-all duration-200 overflow-hidden ${
        column.isPII ? 'border-red-200' : missingHigh ? 'border-amber-200' : 'border-gray-200'
      } hover:shadow-sm`}
    >
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${
            column.isPII ? 'bg-red-500' : missingHigh ? 'bg-amber-400' : 'bg-emerald-400'
          }`} />
          <div className="min-w-0">
            <span className="text-sm font-semibold text-gray-800 truncate block">{column.name}</span>
            <span className="text-[11px] text-gray-400">
              {column.dataType.charAt(0).toUpperCase() + column.dataType.slice(1)} · {column.uniqueCount} unique
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          {column.isPII && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
              <AlertOctagon className="w-2.5 h-2.5" /> PII
            </span>
          )}
          {missingHigh && !column.isPII && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
              {column.missingPercentage}% missing
            </span>
          )}
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </button>

      {/* Expandable detail */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="px-4 py-3 flex flex-col gap-3">
              {/* Mini stat row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Missing', value: `${column.missingPercentage}%` },
                  { label: 'Duplicates', value: column.duplicateCount },
                  ...(column.mean !== undefined ? [
                    { label: 'Mean', value: column.mean },
                    { label: 'Std Dev', value: column.stdDev },
                  ] : []),
                ].map(stat => (
                  <div key={stat.label} className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{stat.label}</p>
                    <p className="text-sm font-bold text-gray-700 mt-0.5 truncate">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Sample values */}
              {column.sampleValues?.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Sample Values</p>
                  <div className="font-mono text-xs bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-gray-600 truncate">
                    {column.sampleValues.join(' · ')}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function QualityAnalysisResults({ analysis, onDownloadReport }: QualityAnalysisResultsProps) {
  const [recommendation, setRecommendation] = useState<string | null>(null)
  const [loadingRec, setLoadingRec] = useState(true)
  const color = getScoreColor(analysis.modelReadinessScore)
  const readiness = getReadinessLabel(analysis.modelReadinessScore)
  const ReadinessIcon = readiness.icon
  const [cleaning, setCleaning] = useState(false)
  const [cleanedCsv, setCleanedCsv] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRec() {
      try {
        const report = `
Dataset: ${analysis.totalRows} rows, ${analysis.totalColumns} columns
Completeness: ${analysis.overallCompleteness}%
Duplicates: ${analysis.duplicatePercentage}%
PII columns: ${analysis.piiColumnsCount}
Score: ${analysis.modelReadinessScore}/100
Penalties — Missing: ${analysis.scoreBreakdown.missingValuesPenalty}, Duplicates: ${analysis.scoreBreakdown.duplicateRowsPenalty}, Row count: ${analysis.scoreBreakdown.lowRowCountPenalty}, PII: ${analysis.scoreBreakdown.piiExposurePenalty}, Consistency: ${analysis.scoreBreakdown.inconsistentDataPenalty}
Columns: ${analysis.columns.map(c => `${c.name} (${c.dataType}, ${c.missingPercentage}% missing${c.isPII ? ', PII' : ''})`).join('; ')}
        `.trim()
        const res = await fetch('/api/ai-recommendation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysisReport: report }),
        })
        if (res.ok) {
          const data = await res.json()
          setRecommendation(data.recommendation)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingRec(false)
      }
    }
    fetchRec()
  }, [analysis])

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  }
  const item = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: 'easeOut' } },
  }
  
  const handleCleanData = async () => {
    setCleaning(true)
      try {
      const report = `Score: ${analysis.modelReadinessScore}/100, 
        Rows: ${analysis.totalRows}, Columns: ${analysis.totalColumns},
        PII columns: ${analysis.columns.filter(c => c.isPII).map(c => c.name).join(', ')},
        High missing: ${analysis.columns.filter(c => c.missingPercentage > 20).map(c => c.name).join(', ')}`
  
      const res = await fetch('/api/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvContent: analysis.rawCsv,
          analysisReport: report,
        }),
      })
      const data = await res.json()
      setCleanedCsv(data.cleanedCsv)
    } catch (e) {
      console.error(e)
    } finally {
      setCleaning(false)
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-5">

      {/* ── Hero: score + overview in one row ── */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Score card */}
        <div className={`lg:col-span-2 rounded-2xl border ${color.border} ${color.light} p-6 flex flex-col items-center justify-center gap-4`}>
          <ScoreRing score={analysis.modelReadinessScore} />
          <div className="text-center">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-1 ${color.badge}`}>
              <ReadinessIcon className="w-3.5 h-3.5" />
              {readiness.label}
            </div>
            <p className="text-xs text-gray-500 max-w-[200px] leading-relaxed">
              {analysis.modelReadinessScore >= 80
                ? 'Your data meets quality standards for model training.'
                : analysis.modelReadinessScore >= 50
                ? 'Address the flagged issues before training.'
                : 'Major cleaning or more data collection required.'}
            </p>
          </div>
        </div>

        {/* Overview stats */}
        <div className="lg:col-span-3 rounded-2xl border border-gray-200 bg-white p-6 flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Overview</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{analysis.summary}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Rows, label: 'Total Rows', value: analysis.totalRows.toLocaleString() },
              { icon: Columns, label: 'Columns', value: analysis.totalColumns },
              { icon: Percent, label: 'Completeness', value: `${analysis.overallCompleteness}%` },
              { icon: HardDrive, label: 'File Size', value: analysis.fileSize },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.07 }}
                className="flex flex-col gap-1 p-3 rounded-xl bg-gray-50 border border-gray-100"
              >
                <s.icon className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-lg font-bold text-gray-800 leading-none">{s.value}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Score breakdown ── */}
      <motion.div variants={item} className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Score Breakdown — Penalties</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {[
            { label: 'Missing Values', value: analysis.scoreBreakdown.missingValuesPenalty },
            { label: 'Duplicates', value: analysis.scoreBreakdown.duplicateRowsPenalty },
            { label: 'Row Count', value: analysis.scoreBreakdown.lowRowCountPenalty },
            { label: 'PII Exposure', value: analysis.scoreBreakdown.piiExposurePenalty },
            { label: 'Data Consistency', value: analysis.scoreBreakdown.inconsistentDataPenalty },
          ].map(p => <PenaltyBar key={p.label} label={p.label} value={p.value} />)}
        </div>
      </motion.div>

      {/* ── PII alert ── */}
      <AnimatePresence>
        {analysis.piiColumnsCount > 0 && (
          <motion.div
            variants={item}
            className="rounded-2xl border-2 border-red-200 bg-red-50 p-5 flex items-start gap-4"
          >
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4.5 h-4.5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-800 mb-2">
                {analysis.piiColumnsCount} PII-sensitive column{analysis.piiColumnsCount !== 1 ? 's' : ''} detected
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {analysis.columns.filter(c => c.isPII).map(c => (
                  <span key={c.name} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600 text-white text-[11px] font-bold">
                    <AlertOctagon className="w-3 h-3" /> {c.name}
                  </span>
                ))}
              </div>
              <p className="text-xs text-red-700 leading-relaxed">
                These columns contain personally identifiable information and must be anonymized or removed before training models.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Column breakdown ── */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Column Breakdown <span className="ml-1 normal-case font-normal text-gray-300">({analysis.columns.length} columns)</span>
          </h3>
          <span className="text-[10px] text-gray-400">Click to expand</span>
        </div>
        <div className="flex flex-col gap-2">
          {analysis.columns.map((col, i) => (
            <ColumnCard key={col.name} column={col} index={i} />
          ))}
        </div>
      </motion.div>

      {/* ── AI Recommendation ── */}
      <motion.div variants={item} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {/* Green left accent via gradient top border */}
        <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-800">AI Recommendation</h3>
          </div>

          {loadingRec ? (
            <div className="space-y-2.5">
              {[1, 0.9, 0.75].map((w, i) => (
                <Skeleton key={i} className="h-3 rounded-full" style={{ width: `${w * 100}%` }} />
              ))}
            </div>
          ) : recommendation ? (
            <>
              <p className="text-sm text-gray-600 leading-relaxed">{recommendation}</p>
              <p className="text-[11px] text-gray-400 italic mt-3">Generated by Gemini 2.0 Flash</p>
            </>
          ) : (
            <p className="text-sm text-gray-400">Unable to generate recommendation.</p>
          )}
        </div>
      </motion.div>

      {/* ── Download ── */}
      {onDownloadReport && (
        <motion.div variants={item}>
          <Button
            onClick={onDownloadReport}
            variant="outline"
            className="w-full h-11 rounded-xl border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-colors gap-2 font-semibold text-sm"
          >
            <Download className="h-4 w-4" />
            Download Analysis Report
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}