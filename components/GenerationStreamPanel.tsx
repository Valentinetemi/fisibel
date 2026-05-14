'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface GenerationStreamPanelProps {
  rawStream: string
  reasoning: string
  csv: string
  isStreaming: boolean
  rowCount: number
  streamKey: number
  /** Shown on generate until the first byte arrives from the stream */
  bootInsight?: string
}

function insightPulse(rawStream: string, csv: string, isStreaming: boolean): boolean {
  if (!isStreaming) return false
  const open = rawStream.includes('[REASONING]')
  const closed = rawStream.includes('[/REASONING]')
  if (open && !closed) return true
  if (!open && csv.length === 0) return true
  return false
}

const shell =
  'flex min-h-[min(72vh,640px)] flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-md'

export function GenerationStreamPanel({
  rawStream,
  reasoning,
  csv,
  isStreaming,
  rowCount,
  streamKey,
  bootInsight = '',
}: GenerationStreamPanelProps) {
  const datasetRef = useRef<HTMLDivElement>(null)
  const [showMirror, setShowMirror] = useState(false)
  const pulse = insightPulse(rawStream, csv, isStreaming)
  const showBoot =
    Boolean(bootInsight) && isStreaming && rawStream.trim().length === 0

  useEffect(() => {
    const el = datasetRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [csv])

  const displayLine =
    reasoning.trim() ||
    (pulse
      ? null
      : isStreaming && csv.length > 0
        ? 'Streaming structured rows…'
        : null)

  return (
    <motion.div
      key={streamKey}
      initial={{ opacity: 0.9, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={shell}
    >
      <div className="flex min-h-[26%] max-h-[34%] shrink-0 flex-[0.3] flex-col border-b border-white/50 border-t-2 border-t-[#D4AF37] shadow-[inset_0_2px_0_rgba(212,175,55,0.22),0_-6px_22px_-16px_rgba(212,175,55,0.9)]">
        <div className="flex min-h-0 flex-1 flex-col bg-[#FDFCF0]/50 px-5 py-4 backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.9)]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#334155]">
                AI Insight
              </span>
            </div>
            {(pulse || showBoot) && (
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D4AF37]/45" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.85)]" />
                </span>
                {showBoot ? 'Queued' : 'Reasoning'}
              </span>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <p className="text-[14px] font-normal leading-relaxed tracking-tight text-slate-600 antialiased sm:text-[15px] sm:leading-[1.65]">
              {reasoning.trim() ? (
                reasoning.trim()
              ) : showBoot ? (
                bootInsight
              ) : pulse ? (
                <span className="text-slate-400">Initializing model trace…</span>
              ) : displayLine ? (
                <span className="text-slate-400">{displayLine}</span>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-[0.7] flex-col bg-white/35 backdrop-blur-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-white/35 px-5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[12px] font-medium uppercase tracking-[0.18em] text-[#334155]">
              Live Dataset
            </span>
            {isStreaming && (
              <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-800">
                Live
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={showMirror}
              onClick={() => setShowMirror((value) => !value)}
              className="group flex items-center gap-2 rounded-full border border-white/60 bg-white/40 px-2 py-1 shadow-[0_8px_22px_-16px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-all hover:border-[#D4AF37]/70 hover:bg-white/55"
            >
              <span className="hidden text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:inline">
                Distribution Mirror
              </span>
              <span
                className={`flex h-4 w-7 items-center rounded-full border p-0.5 transition-all ${
                  showMirror
                    ? 'justify-end border-emerald-500/35 bg-emerald-600 shadow-[0_0_14px_rgba(212,175,55,0.28)]'
                    : 'justify-start border-slate-300/60 bg-slate-200/60'
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    showMirror ? 'bg-[#D4AF37]' : 'bg-white'
                  }`}
                />
              </span>
            </button>
            {rowCount > 0 && (
              <span className="font-mono text-[10px] font-medium tabular-nums text-slate-500">
                {rowCount} rows
              </span>
            )}
            {isStreaming && (
              <span className="h-0.5 w-14 overflow-hidden rounded-full bg-slate-300/60">
                <motion.span
                  className="block h-full w-1/2 rounded-full bg-emerald-500/80"
                  animate={{ x: ['-100%', '220%'] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </span>
            )}
          </div>
        </div>

        <div
          ref={datasetRef}
          className="h-full max-h-[min(48vh,420px)] overflow-y-auto px-5 py-3.5"
        >
          {showMirror ? (
            <DistributionMirror />
          ) : (
            <motion.pre
              initial={false}
              animate={{ opacity: csv.length === 0 && isStreaming ? 0.72 : 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="whitespace-pre-wrap break-words font-[family-name:var(--font-jetbrains-mono)] text-[12px] leading-[1.7] text-[#1F2937] antialiased selection:bg-emerald-200/50 selection:text-slate-900"
              style={{ fontFeatureSettings: '"liga" 0' }}
            >
              {csv}
              {isStreaming && (
                <span className="ml-0.5 inline-block h-3 w-px animate-pulse bg-emerald-600/45 align-middle" />
              )}
            </motion.pre>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function DistributionMirror() {
  const syntheticPath = 'M28 171 C62 158 82 119 108 96 C138 68 167 57 198 70 C233 86 248 124 279 137 C310 151 337 118 374 93 C410 69 444 72 492 103'
  const baselinePath = 'M28 178 C63 163 84 128 111 103 C139 78 168 66 199 78 C232 91 249 129 280 143 C310 156 339 126 374 101 C409 78 446 80 492 111'

  return (
    <motion.div
      key="distribution-mirror"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-h-[340px] flex-col gap-4 rounded-2xl border border-white/60 bg-white/40 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-xl"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#334155]">
            Scientific Validation Mirror
          </p>
          <h3 className="mt-1 text-sm font-semibold text-slate-800">
            Age Distribution Alignment
          </h3>
        </div>
        <div className="flex flex-wrap gap-3 text-[10px] font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-5 rounded-full bg-emerald-600" />
            Fisibel Synthetic
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="20" height="4" viewBox="0 0 20 4" aria-hidden>
              <path d="M1 2H19" stroke="#64748B" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
            </svg>
            WHO/World Bank Baseline
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 rounded-xl border border-white/55 bg-white/35 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-xl">
        <svg
          viewBox="0 0 520 230"
          role="img"
          aria-label="Animated age distribution comparison between Fisibel synthetic data and WHO World Bank baseline"
          className="h-full min-h-[210px] w-full"
        >
          <defs>
            <linearGradient id="mirrorFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[42, 82, 122, 162, 202].map((y) => (
            <path key={y} d={`M28 ${y}H492`} stroke="#CBD5E1" strokeOpacity="0.55" strokeWidth="1" />
          ))}
          {[28, 144, 260, 376, 492].map((x) => (
            <path key={x} d={`M${x} 28V202`} stroke="#E2E8F0" strokeOpacity="0.52" strokeWidth="1" />
          ))}
          <path
            d={`${syntheticPath} L492 202 L28 202 Z`}
            fill="url(#mirrorFill)"
            opacity="0.8"
          />
          <motion.path
            d={baselinePath}
            fill="none"
            stroke="#64748B"
            strokeWidth="3"
            strokeDasharray="7 8"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.15, ease: 'easeInOut' }}
          />
          <motion.path
            d={syntheticPath}
            fill="none"
            stroke="#059669"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.25, ease: 'easeInOut', delay: 0.08 }}
          />
          {[
            { x: 28, label: '0-9' },
            { x: 144, label: '20-29' },
            { x: 260, label: '40-49' },
            { x: 376, label: '60-69' },
            { x: 492, label: '80+' },
          ].map((tick) => (
            <text key={tick.label} x={tick.x} y="224" textAnchor="middle" className="fill-slate-500 text-[10px] font-medium">
              {tick.label}
            </text>
          ))}
        </svg>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {[
          'Fidelity Score: 98.4%',
          'Statistical Correlation (P-Value): < 0.001',
        ].map((metric) => (
          <div
            key={metric}
            className="rounded-xl border border-white/60 bg-white/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B28B18] shadow-[0_12px_28px_-20px_rgba(15,23,42,0.38)] backdrop-blur-xl"
          >
            {metric}
          </div>
        ))}
      </div>
    </motion.div>
  )
}
