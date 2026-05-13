'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Copy, Download } from 'lucide-react'
import { arrayToCSV, arrayToJSON, downloadFile } from '@/lib/utils/csv-export'
import { sanitizeFileBasename } from '@/lib/utils/dataset-export-name'

interface ExportToggleProps {
  data: any[]
  headers: string[]
  /** Base filename without extension, e.g. "Healthcare-Nigeria-synthetic-dataset" */
  fileBasename?: string
}

export function ExportToggle({ data, headers, fileBasename }: ExportToggleProps) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv')
  const [copied, setCopied] = useState(false)

  const safeBase = sanitizeFileBasename(
    fileBasename?.trim() && fileBasename.trim().length > 0
      ? fileBasename.trim()
      : 'fisibel-dataset'
  )

  const handleDownload = () => {
    let content: string
    let filename: string
    let mimeType: string

    if (format === 'csv') {
      content = arrayToCSV(data, headers)
      filename = `${safeBase}.csv`
      mimeType = 'text/csv'
    } else {
      content = arrayToJSON(data)
      filename = `${safeBase}.json`
      mimeType = 'application/json'
    }

    downloadFile(content, filename, mimeType)
  }

  const handleCopy = async () => {
    let content: string

    if (format === 'csv') {
      content = arrayToCSV(data, headers)
    } else {
      content = arrayToJSON(data)
    }

    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('[v0] Copy failed:', err)
    }
  }

  return (
    <motion.div
      className="flex flex-col gap-4 rounded-2xl border border-white/55 bg-white/40 p-5 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.1),inset_0_1px_0_0_rgba(255,255,255,0.65)] backdrop-blur-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Export format
          </p>
          <ToggleGroup type="single" value={format} onValueChange={(v) => setFormat(v as any)}>
            <ToggleGroupItem value="csv">CSV</ToggleGroupItem>
            <ToggleGroupItem value="json">JSON</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex items-center gap-2 border-white/55 bg-white/35 backdrop-blur-sm hover:bg-white/50"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
