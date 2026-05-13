'use client'

import { useEffect, useRef } from 'react'
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
  'flex min-h-[min(72vh,640px)] flex-col overflow-hidden rounded-2xl border border-white/55 bg-white/35 shadow-[0_12px_48px_-16px_rgba(15,23,42,0.14),inset_0_1px_0_0_rgba(255,255,255,0.7)] backdrop-blur-2xl'

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
      <div className="flex min-h-[26%] max-h-[34%] shrink-0 flex-[0.3] flex-col border-b border-white/40">
        <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-white/50 to-white/25 px-5 py-4 backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-emerald-500/80" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                AI Insight
              </span>
            </div>
            {(pulse || showBoot) && (
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/35" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
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

      <div className="flex min-h-0 flex-[0.7] flex-col bg-white/20 backdrop-blur-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-white/35 px-5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[12px] font-medium uppercase tracking-[0.18em] text-slate-500">
              Live Dataset
            </span>
            {isStreaming && (
              <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-800">
                Live
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
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
          <motion.pre
            initial={false}
            animate={{ opacity: csv.length === 0 && isStreaming ? 0.72 : 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="whitespace-pre-wrap break-words font-[family-name:var(--font-jetbrains-mono)] text-[12px] leading-[1.7] text-slate-600 antialiased selection:bg-emerald-200/50 selection:text-slate-900"
            style={{ fontFeatureSettings: '"liga" 0' }}
          >
            {csv}
            {isStreaming && (
              <span className="ml-0.5 inline-block h-3 w-px animate-pulse bg-emerald-600/45 align-middle" />
            )}
          </motion.pre>
        </div>
      </div>
    </motion.div>
  )
}
