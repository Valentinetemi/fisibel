'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface GenerateInputProps {
  onSubmit: (prompt: string) => Promise<void>
  isLoading?: boolean
  initialPrompt?: string
  onPromptChange?: (prompt: string) => void
}

const DOMAINS = [
  { id: 'health', label: 'Health' },
  { id: 'finance', label: 'Finance' },
  { id: 'agriculture', label: 'Agriculture' },
  { id: 'education', label: 'Education' },
  { id: 'transport', label: 'Transport' },
]

const COUNTRIES = [
  'Nigeria', 'Kenya', 'Ghana', 'South Africa',
  'Ethiopia', 'Tanzania', 'Rwanda', 'Uganda',
]

const ROW_PRESETS = [
 { label: '500', value: 500 },
  { label: '1,000', value: 1000 },
  { label: '2,000', value: 2000 },
]

const PLACEHOLDERS = [
  'Malaria patient records for Kano State with age, symptoms, test results, outcomes…',
  'Mobile money transactions for Lagos with sender, receiver, amount, channel…',
  'Crop yield records for Ogun State with type, rainfall, temperature, harvest…',
  'Student exam records for Nairobi with subject, grade, school type, county…',
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
      const t = setTimeout(() => { setDisplay(current.slice(0, char + 1)); setChar(c => c + 1) }, speed)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => { setIdx(i => (i + 1) % strings.length); setChar(0); setDisplay('') }, pause)
    return () => clearTimeout(t)
  }, [char, idx])

  return display
}

export function GenerateInput({ 
  onSubmit, 
  isLoading = false,
  initialPrompt = '',
  onPromptChange
}: GenerateInputProps) {
  const [prompt, setPrompt] = useState(initialPrompt)

  useEffect(() => {
    setPrompt(initialPrompt)
  }, [initialPrompt])

  const [domain, setDomain] = useState('')
  const [country, setCountry] = useState('Nigeria')
  const [rows, setRows] = useState(1000)
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)
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
    await onSubmit(buildPrompt(prompt, domain, country, rows))
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

  return (
    <div className="w-full flex flex-col gap-6">

      {/* ── Domain ── */}
      <div className="flex flex-col gap-2.5">
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">Domain</span>
        <div className="flex flex-wrap gap-1.5">
          {DOMAINS.map(d => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDomain(prev => prev === d.id ? '' : d.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-150 ${
                domain === d.id
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-green-500 hover:text-green-700'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Textarea ── */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">
          Describe your dataset
        </span>
        <div className={`relative rounded-lg border bg-white transition-colors duration-200 ${
          focused ? 'border-green-500' : 'border-gray-200'
        }`}>
          <textarea
            ref={ref}
            value={prompt}
            onChange={e => handlePromptChange(e.target.value)}
            onKeyDown={onKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={isLoading}
            placeholder={placeholder || 'Describe what you want to generate…'}
            rows={3}
            className="w-full resize-none bg-transparent px-4 pt-3.5 pb-11 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none leading-relaxed"
            style={{ minHeight: 108 }}
          />
          {/* Toolbar */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-3 py-2 border-t border-gray-100">
            <span className="text-[10px] text-gray-300 tabular-nums font-mono">
              {prompt.length > 0 ? `${prompt.length} chars · ⌘↵` : '⌘↵ to submit'}
            </span>
            <button
              type="button"
              onClick={submit}
              disabled={!prompt.trim() || isLoading}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-25 disabled:cursor-not-allowed text-white text-[11px] font-medium transition-colors"
            >
              {isLoading ? (
                <>
                  <svg className="w-2.5 h-2.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Generating
                </>
              ) : (
                <>Generate ↗</>
              )}
            </button>
          </div>
        </div>

        {/* PII warning — quiet, inline, no box */}
        <AnimatePresence mode="wait">
          {warning && (
            <motion.p
              key={warning}
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-[11px] text-amber-500 pl-1 flex items-center gap-1.5"
            >
              <span className="text-amber-400">↳</span> {warning}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── Rows + Country ── */}
      <div className="grid grid-cols-2 gap-5">
        {/* Rows */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">Rows</span>
          <div className="flex gap-1">
            {ROW_PRESETS.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setRows(p.value)}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition-all ${
                  rows === p.value
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-green-500 hover:text-green-700'
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
            onChange={e => setRows(Math.min(2000, Math.max(10, Number(e.target.value))))}
            className="w-full px-3 py-1.5 rounded-md border border-gray-200 text-xs text-gray-700 text-center focus:outline-none focus:border-green-500 bg-white tabular-nums transition-colors"
          />
          <p className="text-[10px] text-gray-400">Max 2,000 for best quality</p>
        </div>

        {/* Country */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">Country</span>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-200 text-xs text-gray-700 focus:outline-none focus:border-green-500 bg-white cursor-pointer transition-colors"
          >
            {COUNTRIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <p className="text-[10px] text-gray-400">Grounds names, LGAs & currency</p>
        </div>
      </div>

      {/* ── Quality checks — no box, just dots + labels ── */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-gray-100">
        {checks.map((c, i) => (
          <motion.div
            key={c.label}
            className="flex items-center gap-2"
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              animate={{ backgroundColor: c.ok ? '#22c55e' : '#d1d5db' }}
              transition={{ duration: 0.3 }}
            />
            <span className="text-[11px] text-gray-400">{c.label}</span>
          </motion.div>
        ))}
      </div>

      {/* ── Primary CTA ── */}
      <button
        type="button"
        onClick={submit}
        disabled={!prompt.trim() || isLoading}
        className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-25 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
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
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generating…
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