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
        className="rounded-lg border border-border overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {headers.map((header) => (
                  <TableHead key={header} className="font-semibold">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, idx) => (
                <TableRow key={idx} className="hover:bg-muted/30">
                  {headers.map((header) => (
                    <TableCell key={`${idx}-${header}`} className="py-2">
                      <span className="text-sm">{String(row[header] ?? '')}</span>
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
        <p className="text-sm text-muted-foreground">
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
