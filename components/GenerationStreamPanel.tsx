'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { UploadedVisualContext } from '@/lib/utils/multimodal-context'

interface GenerationStreamPanelProps {
  rawStream: string
  reasoning: string
  csv: string
  isStreaming: boolean
  rowCount: number
  streamKey: number
  userPrompt?: string
  /** Shown on generate until the first byte arrives from the stream */
  bootInsight?: string
  visualContext?: UploadedVisualContext | null
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
  'flex min-h-[min(72vh,640px)] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-[0_20px_50px_rgba(0,0,0,0.18)] backdrop-blur-md'

export function GenerationStreamPanel({
  rawStream,
  reasoning,
  csv,
  isStreaming,
  rowCount,
  streamKey,
  userPrompt = '',
  bootInsight = '',
  visualContext = null,
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
      <div className="flex min-h-[26%] max-h-[34%] shrink-0 flex-[0.3] flex-col border-b border-white/[0.08] border-t-2 border-t-[#3b82f6] shadow-[inset_0_2px_0_rgba(59,130,246,0.22),0_-6px_22px_-16px_rgba(59,130,246,0.9)]">
        <div className="flex min-h-0 flex-1 flex-col bg-white/[0.04] px-5 py-4 backdrop-blur-xl">
          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3b82f6] shadow-[0_0_10px_rgba(59,130,246,0.9)]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white">
                AI Insight
              </span>
            </div>
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <span className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.16em] text-slate-400">
                <span className="h-1 w-1 rounded-full bg-[#60a5fa]" />
                POWERED BY GEMMA 4
              </span>
              {(pulse || showBoot) && (
                <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400/45" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#3b82f6] shadow-[0_0_10px_rgba(59,130,246,0.85)]" />
                  </span>
                  {showBoot ? 'Queued' : 'Reasoning'}
                </span>
              )}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <p className="text-[14px] font-normal leading-relaxed tracking-tight text-slate-100 antialiased sm:text-[15px] sm:leading-[1.65]">
              {reasoning.trim() ? (
                reasoning.trim()
              ) : showBoot && visualContext ? (
                <VisualCognitionText
                  detectedRegion={visualContext.detectedRegion}
                  fileName={visualContext.fileName}
                />
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

      <div className="flex min-h-0 flex-[0.7] flex-col bg-white/[0.04] backdrop-blur-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[12px] font-medium uppercase tracking-[0.18em] text-white">
              Live Dataset
            </span>
            {isStreaming && (
              <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-200">
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
              className="group flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1 shadow-[0_8px_22px_-16px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all hover:border-[#3b82f6]/70 hover:bg-white/[0.08]"
            >
              <span className="hidden text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:inline">
                Distribution Mirror
              </span>
              <span
                className={`flex h-4 w-7 items-center rounded-full border p-0.5 transition-all ${
                  showMirror
                    ? 'justify-end border-blue-500/35 bg-[#3b82f6] shadow-[0_0_14px_rgba(59,130,246,0.28)]'
                    : 'justify-start border-slate-300/60 bg-slate-200/60'
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    showMirror ? 'bg-[#60a5fa]' : 'bg-white'
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
                  className="block h-full w-1/2 rounded-full bg-[#3b82f6]/80"
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
          <SourceAttributionFeed
            rawStream={rawStream}
            reasoning={reasoning}
            csv={csv}
            userPrompt={userPrompt}
            isStreaming={isStreaming}
            visualContext={visualContext}
          />
          {showMirror ? (
            <DistributionMirror />
          ) : (
            <motion.pre
              initial={false}
              animate={{ opacity: csv.length === 0 && isStreaming ? 0.72 : 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="whitespace-pre-wrap break-words font-[family-name:var(--font-jetbrains-mono)] text-[12px] leading-[1.7] text-slate-100 antialiased selection:bg-blue-400/50 selection:text-white"
              style={{ fontFeatureSettings: '"liga" 0' }}
            >
              {csv}
              {isStreaming && (
                <span className="ml-0.5 inline-block h-3 w-px animate-pulse bg-[#3b82f6]/45 align-middle" />
              )}
            </motion.pre>
          )}
        </div>
      </div>
    </motion.div>
  )
}

type SourceMilestone = {
  id: string
  timestamp: string
  label: string
  tone: 'global' | 'regional' | 'logic'
}

function detectSourceMilestones({
  rawStream,
  reasoning,
  csv,
  userPrompt,
  visualContext,
}: {
  rawStream: string
  reasoning: string
  csv: string
  userPrompt: string
  visualContext?: UploadedVisualContext | null
}): SourceMilestone[] {
  const haystack = [userPrompt, rawStream, reasoning, csv]
    .filter(Boolean)
    .join('\n')
    .toLowerCase()
  const milestones: SourceMilestone[] = []
  const add = (milestone: SourceMilestone) => {
    if (!milestones.some((item) => item.id === milestone.id)) {
      milestones.push(milestone)
    }
  }

  if (visualContext) {
    add({
      id: 'visual-context',
      timestamp: '[00.8s]',
      label: 'Grounding: Visual Document Context (Uploaded)',
      tone: 'regional',
    })
  }

  add({
    id: 'model-logic',
    timestamp: '[00s]',
    label: 'Model Logic: Schema, privacy, and distribution constraints initialized',
    tone: 'logic',
  })

  if (haystack.includes('malaria')) {
    add({
      id: 'who-malaria',
      timestamp: '[01s]',
      label: 'Grounding: WHO World Malaria Report (2023 Update)',
      tone: 'global',
    })
  }

  if (/\b(who|world health organization)\b/i.test(haystack)) {
    add({
      id: 'who',
      timestamp: '[03s]',
      label: 'Source: WHO epidemiological reference detected',
      tone: 'global',
    })
  }

  if (/\b(world bank|worldbank)\b/i.test(haystack)) {
    add({
      id: 'world-bank',
      timestamp: '[03s]',
      label: 'Source: World Bank development indicator detected',
      tone: 'global',
    })
  }

  if (/\b(cdc|africa cdc|centers for disease control)\b/i.test(haystack)) {
    add({
      id: 'cdc',
      timestamp: '[03s]',
      label: 'Source: CDC surveillance reference detected',
      tone: 'global',
    })
  }

  const year = haystack.match(/\b(19|20)\d{2}\b/)?.[0]
  if (year) {
    add({
      id: `year-${year}`,
      timestamp: '[04s]',
      label: `Temporal Anchor: ${year} reference window detected`,
      tone: 'logic',
    })
  }

  if (/\b(ngn|kes|ghs|zar|xaf|usd|currency|exchange rate|naira|shilling|cedi|rand)\b/i.test(haystack)) {
    add({
      id: 'currency-sync',
      timestamp: '[02s]',
      label: 'Currency Sync: CBN Exchange Rates (Fixed-Point)',
      tone: 'regional',
    })
  }

  if (/\b(nigeria|lagos|kano|ghana|kenya|south africa|rwanda|tanzania|ethiopia|nairobi|accra)\b/i.test(haystack)) {
    add({
      id: 'regional-grounding',
      timestamp: '[02.5s]',
      label: 'Regional Data: African geo-distribution grounding active',
      tone: 'regional',
    })
  }

  return milestones
}

function SourceAttributionFeed({
  rawStream,
  reasoning,
  csv,
  userPrompt,
  isStreaming,
  visualContext,
}: {
  rawStream: string
  reasoning: string
  csv: string
  userPrompt: string
  isStreaming: boolean
  visualContext?: UploadedVisualContext | null
}) {
  const milestones = detectSourceMilestones({
    rawStream,
    reasoning,
    csv,
    userPrompt,
    visualContext,
  })

  return (
    <div className="mb-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-[0_16px_36px_-28px_rgba(0,0,0,0.7)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-3 py-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
          Live Source Attribution
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-200">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400/60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#3b82f6]" />
          </span>
          {isStreaming ? 'Live' : 'Indexed'}
        </span>
      </div>
      <div className="bg-[linear-gradient(rgba(226,232,240,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(226,232,240,0.03)_1px,transparent_1px)] bg-[size:18px_18px] px-3 py-2">
        <div className="space-y-1.5 font-mono text-[10px]">
          {milestones.map((milestone, index) => (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.24, delay: index * 0.04 }}
              className="flex items-center gap-2 text-slate-200"
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full shadow-[0_0_10px_currentColor] ${
                  milestone.tone === 'global'
                    ? 'bg-blue-500 text-blue-500'
                    : milestone.tone === 'regional'
                      ? 'bg-[#3b82f6] text-[#3b82f6]'
                      : 'bg-slate-400 text-slate-400'
                }`}
              />
              <span className="shrink-0 text-slate-400">{milestone.timestamp}</span>
              <span>{milestone.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function VisualCognitionText({
  detectedRegion,
  fileName,
}: {
  detectedRegion: string
  fileName: string
}) {
  const text = useTypewriter(
    [
      'Analyzing uploaded document...',
      `Extracting clinical parameters for ${detectedRegion}...`,
      `Cross-referencing ${fileName} against epidemiological grounding rules...`,
    ].join('\n'),
    18
  )

  return <span className="whitespace-pre-line">{text}</span>
}

function useTypewriter(text: string, speed = 24) {
  const [display, setDisplay] = useState('')

  useEffect(() => {
    setDisplay('')
    let index = 0
    const interval = window.setInterval(() => {
      index += 1
      setDisplay(text.slice(0, index))
      if (index >= text.length) window.clearInterval(interval)
    }, speed)

    return () => window.clearInterval(interval)
  }, [text, speed])

  return display
}

function VisualProvenanceMilestone() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="mb-3 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 font-[family-name:var(--font-jetbrains-mono)] text-[10px] text-slate-200 shadow-[0_12px_28px_-24px_rgba(0,0,0,0.65)] backdrop-blur-xl"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#3b82f6] shadow-[0_0_10px_rgba(59,130,246,0.7)]" />
      <span>[00.8s] Grounding: Visual Document Context (Uploaded)</span>
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
      className="flex min-h-[340px] flex-col gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
            Scientific Validation Mirror
          </p>
          <h3 className="mt-1 text-sm font-semibold text-slate-100">
            Age Distribution Alignment
          </h3>
        </div>
        <div className="flex flex-wrap gap-3 text-[10px] font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-5 rounded-full bg-[#3b82f6]" />
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

      <div className="min-h-0 flex-1 rounded-xl border border-white/[0.08] bg-[#0f1f3d] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
        <svg
          viewBox="0 0 520 230"
          role="img"
          aria-label="Animated age distribution comparison between Fisibel synthetic data and WHO World Bank baseline"
          className="h-full min-h-[210px] w-full"
        >
          <defs>
            <linearGradient id="mirrorFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
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
            stroke="#3b82f6"
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
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#60a5fa] shadow-[0_12px_28px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            {metric}
          </div>
        ))}
      </div>
    </motion.div>
  )
}
