'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText } from 'lucide-react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  isLoading?: boolean
}

export function FileUpload({ onFileSelect, isLoading = false }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFile = useCallback(
    (file: File) => {
      const validTypes = [
        'text/csv',
        'application/json',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ]

      if (!validTypes.includes(file.type)) {
        alert('Please upload a CSV, JSON, or Excel file')
        return
      }

      if (file.size > 50 * 1024 * 1024) {
        // 50MB limit
        alert('File size must be less than 50MB')
        return
      }

      setFileName(file.name)
      onFileSelect(file)
    },
    [onFileSelect]
  )

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <label className="text-sm font-medium">Upload Dataset</label>
      <motion.div
        className={`relative rounded-lg border-2 border-dashed transition-all ${
          dragActive
            ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
            : 'border-gray-300 dark:border-gray-700 hover:border-green-400 bg-white dark:bg-slate-950'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        animate={{
          scale: dragActive ? 1.02 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <input
          type="file"
          onChange={handleChange}
          disabled={isLoading}
          accept=".csv,.json,.xlsx,.xls,.parquet"
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="block p-8 sm:p-12 text-center"
        >
          <motion.div
            animate={{ y: dragActive ? -2 : 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {fileName ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <FileText className="mx-auto mb-3 h-8 w-8 text-green-600 dark:text-green-400" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {fileName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ready to analyze
                </p>
              </motion.div>
            ) : (
              <motion.div>
                <Upload className="mx-auto mb-3 h-10 w-10 text-gray-400 dark:text-gray-500" />
                <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Drop your CSV, JSON, Excel or Parquet file here
                </p>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                  or click to browse (Max 50MB)
                </p>
              </motion.div>
            )}
          </motion.div>
        </label>
      </motion.div>
    </motion.div>
  )
}
