'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DataTableProps {
  data: any[]
  headers: string[]
}

export function DataTable({ data, headers }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage
    return data.slice(startIndex, startIndex + rowsPerPage)
  }, [data, currentPage])

  const totalPages = Math.ceil(data.length / rowsPerPage)

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <motion.div
        className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/40 bg-white/35 hover:bg-white/35">
                {headers.map((header) => (
                  <TableHead key={header} className="font-semibold">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, idx) => (
                <TableRow
                  key={idx}
                  className="border-white/30 hover:bg-white/25"
                >
                  {headers.map((header) => (
                    <TableCell key={`${idx}-${header}`} className="py-2">
                      <span className="text-sm text-[#1F2937]">{String(row[header] ?? '')}</span>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {/* Pagination */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <p className="text-xs font-medium text-slate-500">
          Page {currentPage} of {totalPages} ({data.length} total rows)
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
