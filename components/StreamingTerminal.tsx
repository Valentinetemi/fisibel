'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface StreamingTerminalProps {
  content: string
  isStreaming: boolean
  onComplete?: () => void
}

export function StreamingTerminal({
  content,
  isStreaming,
  onComplete,
}: StreamingTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const wasStreamingRef = useRef(false)
  const [rowCount, setRowCount] = useState(0)

  useEffect(() => {
    if (isStreaming) {
      wasStreamingRef.current = true
      // Count rows and update
      const lines = content.split('\n').filter((line) => line.trim().length > 0)
      setRowCount(Math.max(1, lines.length - 1)) // -1 for header
    } else if (wasStreamingRef.current && !isStreaming && onComplete) {
      wasStreamingRef.current = false
      onComplete()
    }
  }, [isStreaming, content, onComplete])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [content])

  const lineCount = content.split('\n').length

  return (
    <div className="space-y-2">
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <label className="text-sm font-medium">Data Stream</label>
        <motion.span
          className="text-xs text-green-500 font-semibold"
          key={rowCount}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {rowCount} rows generated
        </motion.span>
      </motion.div>

      <motion.div
        ref={terminalRef}
        className="relative overflow-hidden rounded-lg border border-border bg-slate-950 p-4 font-mono text-sm text-green-400"
        style={{ height: '300px', overflowY: 'auto' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <pre className="whitespace-pre-wrap break-words font-mono text-sm">
          {content}
          {isStreaming && <span className="animate-pulse">▌</span>}
        </pre>
      </motion.div>

      {isStreaming && (
        <motion.div
          className="flex items-center gap-2 text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-400"></span>
          Generating data...
        </motion.div>
      )}
    </div>
  )
}
