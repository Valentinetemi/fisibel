'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { DatasetCard } from '@/components/DatasetCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { datasetPrompts } from '@/lib/utils/dataset-prompts'

interface Dataset {
  id: string
  name: string
  description: string
  domain: string
  country: string
  rowCount: number
  columnCount: number
  fidelityScore: number
  createdAt: string
}

export default function CatalogPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const res = await fetch('/api/catalog')
        if (!res.ok) throw new Error('Failed to fetch catalog')

        const data = await res.json()
        setDatasets(data.datasets)
      } catch (err) {
        console.error('Catalog fetch error:', err)
        setError('Failed to load datasets')
      } finally {
        setLoading(false)
      }
    }

    fetchCatalog()
  }, [])

  const handleDownload = async (id: string) => {
    const dataset = datasets.find((d) => d.id === id)
    if (!dataset) return

    const promptData = datasetPrompts[id]
    if (!promptData) {
      console.error('No prompt found for dataset:', id)
      return
    }

    setDownloadingId(id)

    try {
      // Call the generate API with the dataset-specific prompt
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptData.prompt }),
      })

      if (!response.body) {
        throw new Error('No response body')
      }

      // Read the streaming response
      let csvContent = ''
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        csvContent += decoder.decode(value, { stream: true })
      }

      // Trigger file download
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = promptData.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error:', err)
      // Silently fail
    } finally {
      setDownloadingId(null)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-8">
        <motion.div
          className="space-y-4 sm:space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">African Data Infrastructure</h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl">
              Browse and download pre-generated synthetic African datasets. All datasets include realistic country-specific data, demographics, and metrics.
            </p>
          </motion.div>

          {/* Datasets Grid */}
          <motion.div variants={itemVariants}>
            <h3 className="text-xs sm:text-sm font-medium mb-3 sm:mb-4 text-muted-foreground uppercase tracking-wider">
              Available Datasets ({datasets.length})
            </h3>

            {loading ? (
              <div className="grid gap-3 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-32 rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 p-4 text-center">
                <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
              </div>
            ) : datasets.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card/50 p-12 text-center">
                <p className="text-muted-foreground">
                  No datasets available yet. Generate one on the Generate page.
                </p>
              </div>
            ) : (
              <motion.div
                className="grid gap-3 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {datasets.map((dataset, idx) => (
                  <DatasetCard
                    key={dataset.id}
                    {...dataset}
                    isNew={idx >= datasets.length - 1}
                    isDownloading={downloadingId === dataset.id}
                    onDownload={handleDownload}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Info Section */}
          <motion.div variants={itemVariants} className="rounded-lg border border-border bg-card p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3">About These Datasets</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">→</span>
                <span>
                  <strong>Authentic:</strong> Generated with real African place names,
                  demographics, and domain-specific metrics
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">→</span>
                <span>
                  <strong>Domain-Specific:</strong> Healthcare, FinTech, Agriculture,
                  Education, Energy, and Labor datasets
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">→</span>
                <span>
                  <strong>Validated:</strong> Use our Data Quality analyzer to check
                  completeness and model readiness
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">→</span>
                <span>
                  <strong>Ready to Use:</strong> Download as CSV or JSON and use
                  immediately for training
                </span>
              </li>
            </ul>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
