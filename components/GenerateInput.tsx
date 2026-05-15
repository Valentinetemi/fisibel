'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileImage, FileText, UploadCloud, X } from 'lucide-react'
import {
  buildMultimodalPrompt,
  extractDocumentContext,
  formatFileSize,
  type UploadedVisualContext,
} from '@/lib/utils/multimodal-context'

interface GenerateInputProps {
  onSubmit: (prompt: string, visualContext?: UploadedVisualContext | null) => Promise<void>
  isLoading?: boolean
  initialPrompt?: string
  onPromptChange?: (prompt: string) => void
}

const DOMAINS = [
  { id: 'malaria', label: 'Malaria' },
  { id: 'maternal', label: 'Maternal' },
  { id: 'epidemic', label: 'Ebola / Lassa' },
]

const COUNTRIES = [
  'Nigeria', 'Kenya', 'Ghana', 'South Africa',
  'Ethiopia', 'Tanzania', 'Rwanda',
]

const ROW_PRESETS = [
  { label: '500', value: 500 },
  { label: '1,000', value: 1000 },
  { label: '2,000', value: 2000 },
]

const PLACEHOLDERS = [
  'Malaria patient records for Kano State with age, symptoms, test results, outcomes...',
  'Maternal health tracking for Lagos clinics: prenatal visits, risk factors, and delivery outcomes...',
  'Epidemiological data for Lassa Fever in Edo State including onset dates and contact tracing...',
  'Community health surveys from rural Kenya: nutrition levels, vaccination status, and water access...',
]

const PII_TIPS: Record<string, string> = {
  name: 'Use Patient_ID instead of patient names to avoid PII flags.',
  phone: 'Phone numbers are PII - they will lower your quality score.',
  address: 'Use LGA or State instead of full addresses.',
}

function getWarning(prompt: string): string | null {
  const lower = prompt.toLowerCase()
  if (lower.includes('name') && (lower.includes('patient') || lower.includes('person'))) return PII_TIPS.name
  if (lower.includes('phone') || lower.includes('telephone')) return PII_TIPS.phone
  if (lower.includes('address')) return PII_TIPS.address
  return null
}

function buildPrompt(prompt: string, domain: string, country: string, rows: number): string {
  let out = prompt.trim()
  if (!/\d[\d,]*\s*(rows?|records?|samples?|entries)/i.test(out)) {
    out = `Generate ${rows} rows of ` + out.replace(/^generate\s+/i, '')
  }
  if (country && !out.toLowerCase().includes(country.toLowerCase())) out += ` in ${country}`
  if (domain && !out.toLowerCase().includes(domain)) out += `. This is a ${domain} dataset.`
  return out
}

function useTypewriter(strings: string[], speed = 32, pause = 2600) {
  const [display, setDisplay] = useState('')
  const [idx, setIdx] = useState(0)
  const [char, setChar] = useState(0)

  useEffect(() => {
    const current = strings[idx]
    if (char < current.length) {
      const t = setTimeout(() => {
        setDisplay(current.slice(0, char + 1))
        setChar((c) => c + 1)
      }, speed)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      setIdx((i) => (i + 1) % strings.length)
      setChar(0)
      setDisplay('')
    }, pause)
    return () => clearTimeout(t)
  }, [char, idx, strings, pause, speed])

  return display
}

const glassField =
  'rounded-xl border border-white/[0.08] bg-white/[0.04] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-[box-shadow,border-color] duration-200'

export function GenerateInput({
  onSubmit,
  isLoading = false,
  initialPrompt = '',
  onPromptChange,
}: GenerateInputProps) {
  const [prompt, setPrompt] = useState(initialPrompt)

  useEffect(() => {
    setPrompt(initialPrompt)
  }, [initialPrompt])

  const [domain, setDomain] = useState('')
  const [country, setCountry] = useState('Nigeria')
  const [rows, setRows] = useState(1000)
  const [focused, setFocused] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessingUpload, setIsProcessingUpload] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedContext, setUploadedContext] = useState<UploadedVisualContext | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const ref = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const placeholder = useTypewriter(PLACEHOLDERS)
  const warning = getWarning(prompt)

  const handlePromptChange = (val: string) => {
    setPrompt(val)
    onPromptChange?.(val)
  }

  const checks = [
    { ok: !/patient.{0,10}name/i.test(prompt), label: 'No raw patient names' },
    { ok: !/phone|telephone/i.test(prompt), label: 'No phone numbers' },
    { ok: prompt.length > 20, label: 'Prompt is descriptive' },
    { ok: rows <= 2000, label: 'Row count in range' },
  ]

  const submit = async () => {
    if (!prompt.trim() || isLoading) return
    const basePrompt = buildPrompt(prompt, domain, country, rows)
    await onSubmit(buildMultimodalPrompt(basePrompt, uploadedContext), uploadedContext)
  }

  const processFile = (file?: File) => {
    if (!file || isLoading) return
    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf']
    const allowedExtensions = /\.(png|jpe?g|pdf)$/i
    if (!allowedTypes.includes(file.type) && !allowedExtensions.test(file.name)) return
  
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setIsProcessingUpload(true)
    setUploadedFile(file)
    setUploadedContext(null)
    setPreviewUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : null)
  
    // Convert to base64
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      setUploadedContext({
        ...extractDocumentContext(file),
        base64Data: base64,
        mimeType: file.type,
      })
      setIsProcessingUpload(false)
    }
    reader.readAsDataURL(file)
  }

    const removeUpload = () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setUploadedFile(null)
      setUploadedContext(null)
      setPreviewUrl(null)
      setIsProcessingUpload(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setIsDragging(false)
      processFile(event.dataTransfer.files[0])
    }

    const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') submit()
    }

    useEffect(() => {
      const el = ref.current
      if (!el) return
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 200) + 'px'
    }, [prompt])

    useEffect(() => {
      return () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
      }
    }, [previewUrl])

    return (
    <div className="flex w-full flex-col gap-7">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
            Health specialization
          </span>
          <span className="hidden text-[9px] font-medium uppercase tracking-wider text-slate-400 sm:inline">
            Optional
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DOMAINS.map((d) => {
            const active = domain === d.id
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDomain((prev) => (prev === d.id ? '' : d.id))}
                className={`rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] backdrop-blur-md transition-all duration-200 active:scale-[0.97] ${
                  active
                    ? 'border-[#3b82f6] bg-[#3b82f6] text-white ring-1 ring-[#3b82f6]/20'
                    : 'border-[#3b82f6] bg-blue-500/15 text-[#60a5fa] hover:border-[#60a5fa] hover:bg-blue-500/20'
                }`}
              >
                {d.label}
              </button>
            )
          })}
        </div>
      </div>
      {domain && (
  <div className="mt-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
    <div className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#60a5fa] opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3b82f6]"></span>
    </div>
    <span className="text-[10px] font-semibold text-slate-200 uppercase tracking-wider">
      {domain === 'malaria' && "Grounding: WHO Malaria Report 2025 (Sub-Saharan African Cohort)"}
      {domain === 'maternal' && "Grounding: World Bank Maternal Health Data (Nigeria/Ghana Focus)"}
      {domain === 'epidemic' && "Grounding: CDC Africa Infectious Disease Surveillance Patterns"}
    </span>
  </div>
)}

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
          Clinical specification
        </span>
        <div
          className={`relative overflow-hidden ${glassField} ${
            focused
              ? 'border-[#60a5fa]/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_0_0_3px_rgba(59,130,246,0.16)]'
              : ''
          }`}
        >
          <textarea
            ref={ref}
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            onKeyDown={onKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={isLoading}
            placeholder={placeholder || 'Describe cohort, variables, and outcomes…'}
            rows={3}
            className="min-h-[112px] w-full resize-none bg-transparent px-3.5 pb-11 pt-3 text-sm leading-relaxed text-slate-100 placeholder:text-sm placeholder:leading-relaxed placeholder:text-slate-400/85 focus:outline-none"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/[0.08] bg-white/[0.04] px-2.5 py-2 backdrop-blur-md">
            <span className="font-mono text-[9px] tabular-nums tracking-wide text-slate-300">
              {prompt.length > 0 ? `${prompt.length} chars · ⌘↵` : '⌘↵ submit'}
            </span>
            <button
              type="button"
              onClick={submit}
              disabled={!prompt.trim() || isLoading}
              className="flex items-center gap-1 rounded-md border border-[#3b82f6]/25 bg-[#3b82f6] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-[0_8px_18px_-10px_rgba(59,130,246,0.85),0_2px_8px_-4px_rgba(37,99,235,0.55)] backdrop-blur-sm transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {isLoading ? (
                <>
                  <svg className="h-2.5 w-2.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Run
                </>
              ) : (
                <>Run ↗</>
              )}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {warning && (
            <motion.p
              key={warning}
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5 pl-0.5 text-[10px] text-amber-700/90"
            >
              <span className="font-mono text-amber-600/90">!</span> {warning}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
          Visual context
        </span>
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') fileInputRef.current?.click()
          }}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`group relative overflow-hidden rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.04] p-3 text-slate-400 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.55)] backdrop-blur-md transition-all duration-300 hover:scale-[1.01] hover:border-[#60a5fa]/50 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.16),0_18px_44px_-26px_rgba(37,99,235,0.35)] ${
            isDragging ? 'scale-[1.01] border-[#60a5fa]/60 shadow-[0_0_0_1px_rgba(59,130,246,0.18),0_18px_44px_-26px_rgba(37,99,235,0.45)]' : ''
          }`}
        >
          {isProcessingUpload && (
            <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.3),transparent)] animate-pulse" />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
            className="hidden"
            onChange={(event) => processFile(event.target.files?.[0])}
          />

          <AnimatePresence mode="wait">
            {uploadedFile ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.22 }}
                className="relative flex items-center gap-3"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
                  {previewUrl ? (
                    <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <FileText className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#60a5fa] shadow-[0_0_10px_rgba(96,165,250,0.7)]" />
                    <p className="truncate text-[11px] font-semibold text-slate-100">
                      {uploadedFile.name}
                    </p>
                  </div>
                  <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400">
                    {formatFileSize(uploadedFile.size)} · {isProcessingUpload ? 'Processing visual context' : 'Upload indexed'}
                  </p>
                  {uploadedContext && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-blue-400/20 bg-blue-500/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-slate-200"
                    >
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#60a5fa]" />
                      Visual Context Active
                    </motion.span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    removeUpload()
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-slate-400 transition-colors hover:border-red-200/60 hover:text-red-500"
                  aria-label="Remove uploaded visual context"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                  <UploadCloud className="h-5 w-5 text-slate-400 transition-colors group-hover:text-[#60a5fa]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-300">
                    Upload Health Record / Map
                  </p>
                  <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400">
                    PNG, JPG, JPEG, PDF · drag or click
                  </p>
                </div>
                <FileImage className="ml-auto hidden h-4 w-4 text-slate-300 sm:block" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">Volume</span>
          <div className="flex gap-1">
            {ROW_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setRows(p.value)}
                className={`flex-1 rounded-lg border py-1.5 text-[11px] font-semibold tabular-nums tracking-tight backdrop-blur-md transition-all duration-200 ${
                  rows === p.value
                    ? 'border-[#3b82f6] bg-[#3b82f6] text-white ring-1 ring-[#3b82f6]/15'
                    : 'border-[#3b82f6] bg-blue-500/15 text-[#60a5fa] hover:bg-blue-500/20'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={10}
            max={2000}
            value={rows}
            aria-label="Number of rows to generate"
            onChange={(e) =>
              setRows(Math.min(2000, Math.max(10, Number(e.target.value))))
            }
            className={`${glassField} w-full px-2.5 py-2 text-center text-xs font-medium tabular-nums text-slate-100 focus:border-[#60a5fa]/50 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/15`}
          />
          <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">Max 2k rows · latency SLA</p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">Region</span>
          <select
            value={country}
            aria-label="Country for regional grounding"
            onChange={(e) => setCountry(e.target.value)}
            className={`${glassField} w-full cursor-pointer px-2.5 py-2 text-xs font-medium text-slate-100 focus:border-[#60a5fa]/50 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/15`}
          >
            {COUNTRIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">Geo + currency grounding</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-white/[0.08] pt-4">
        {checks.map((c) => (
          <motion.div key={c.label} className="flex items-center gap-1.5" animate={{ opacity: 1 }}>
            <motion.div
              className="h-1 w-1 shrink-0 rounded-full"
              animate={{ backgroundColor: c.ok ? '#3b82f6' : '#94a3b8' }}
              transition={{ duration: 0.25 }}
            />
            <span className="text-[10px] font-medium text-slate-500">{c.label}</span>
          </motion.div>
        ))}
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!prompt.trim() || isLoading}
        className="generate-gold-shimmer w-full rounded-xl border border-blue-400/30 bg-gradient-to-br from-[#60a5fa] via-[#3b82f6] to-[#1d4ed8] py-3 text-sm font-semibold tracking-tight text-white shadow-[0_14px_30px_-14px_rgba(59,130,246,0.95),0_8px_18px_-10px_rgba(37,99,235,0.58),inset_0_1px_0_0_rgba(255,255,255,0.28)] backdrop-blur-sm transition-all hover:from-[#60a5fa] hover:via-[#3b82f6] hover:to-[#1e40af] hover:shadow-[0_18px_38px_-14px_rgba(59,130,246,0.95),0_10px_22px_-12px_rgba(37,99,235,0.6),inset_0_1px_0_0_rgba(255,255,255,0.3)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-25 disabled:active:scale-100"
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Provisioning stream…
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Generate dataset
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  )
}
