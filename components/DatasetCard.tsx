'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Download, Sparkles } from 'lucide-react'

interface DatasetCardProps {
  id: string
  name: string
  description: string
  domain: string
  country: string
  rowCount: number
  columnCount: number
  fidelityScore: number
  onDownload?: (id: string) => void
  isNew?: boolean
  isDownloading?: boolean
}

function getCountryFlag(country: string): string {
  const flagMap: Record<string, string> = {
    Nigeria: '🇳🇬',
    Kenya: '🇰🇪',
    Ghana: '🇬🇭',
    'South Africa': '🇿🇦',
    Uganda: '🇺🇬',
    Senegal: '🇸🇳',
  }
  return flagMap[country] || '🌍'
}

function getDomainColor(domain: string): string {
  const colorMap: Record<string, string> = {
    Healthcare: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    FinTech: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    Agriculture: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    Education: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
    Energy: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    Labor: 'bg-pink-500/10 text-pink-700 dark:text-pink-400',
    General: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
  }
  return colorMap[domain] || colorMap['General']
}

export function DatasetCard({
  id,
  name,
  description,
  domain,
  country,
  rowCount,
  columnCount,
  fidelityScore,
  onDownload,
  isNew = false,
  isDownloading = false,
}: DatasetCardProps) {
  const flag = getCountryFlag(country)
  const domainColor = getDomainColor(domain)

  return (
    <motion.div
      initial={isNew ? { x: 100, opacity: 0 } : { opacity: 0, y: 20 }}
      animate={{ x: 0, opacity: 1, y: 0 }}
      transition={
        isNew
          ? { type: 'spring', stiffness: 200, damping: 25 }
          : { duration: 0.4 }
      }
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-lg border border-border bg-card p-3 sm:p-6 transition-all hover:border-primary/50 hover:shadow-lg"
    >
      <div className="space-y-3 sm:space-y-4">
        {/* Header with flag and title */}
        <div className="flex items-start gap-2 sm:gap-3">
          <span className="text-2xl sm:text-4xl flex-shrink-0">{flag}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm sm:text-base leading-tight line-clamp-2">{name}</h3>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {description}
            </p>
          </div>
        </div>

        {/* Domain badge */}
        <div className="flex items-center gap-2">
          <motion.span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${domainColor}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {domain}
          </motion.span>
        </div>

        {/* Fidelity score progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Fidelity Score</span>
            <span className="text-xs font-bold text-green-600">{Math.round(fidelityScore)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${fidelityScore}%` }}
              transition={{ duration: 0.6, delay: 0.1 }}
            />
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Rows</p>
            <p className="font-mono text-xs sm:text-sm font-bold">{rowCount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Columns</p>
            <p className="font-mono text-xs sm:text-sm font-bold">{columnCount}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 sm:gap-2 pt-2">
          <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link href={`/generate?prompt=${encodeURIComponent(`Generate a dataset for ${name}`)}`}>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs sm:text-sm"
              >
                <Sparkles className="mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4 text-amber-500" />
                <span className="hidden sm:inline">Generate</span>
                <span className="sm:hidden">New</span>
              </Button>
            </Link>
          </motion.div>
          <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              size="sm"
              disabled={isDownloading}
              className="w-full bg-green-600 hover:bg-green-700 text-xs sm:text-sm disabled:opacity-75"
              onClick={() => onDownload?.(id)}
            >
              {isDownloading ? (
                <>
                  <Spinner className="mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                  <span className="hidden sm:inline">Generating...</span>
                  <span className="sm:hidden">Loading...</span>
                </>
              ) : (
                <>
                  <Download className="mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                  <span className="hidden sm:inline">Download</span>
                  <span className="sm:hidden">Get</span>
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
