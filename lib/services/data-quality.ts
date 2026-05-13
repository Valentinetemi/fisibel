import { isPIIColumn, calculatePIIPenalty } from '@/lib/utils/pii-detection'

export interface ColumnAnalysis {
  name: string
  dataType: string
  missingCount: number
  missingPercentage: number
  uniqueCount: number
  duplicateCount: number
  sampleValues: string[]
  isPII: boolean
  // For numeric columns
  mean?: number
  median?: number
  stdDev?: number
  min?: number
  max?: number
  outlierCount?: number
}

export interface QualityAnalysisResult {
  totalRows: number
  totalColumns: number
  fileSize: string
  detectedDomain: string
  columns: ColumnAnalysis[]
  duplicateRows: number
  duplicatePercentage: number
  modelReadinessScore: number
  scoreBreakdown: {
    missingValuesPenalty: number
    duplicateRowsPenalty: number
    lowRowCountPenalty: number
    piiExposurePenalty: number
    inconsistentDataPenalty: number
  }
  overallCompleteness: number
  piiColumnsCount: number
  summary: string
  rawCsv?: string
}

export function analyzeData(
  rows: any[],
  headers: string[],
  detectedDomain: string,
  fileSize: number,
  rawCsv?: string
): QualityAnalysisResult {
  const columnAnalysis = analyzeColumns(rows, headers)
  const duplicateMetrics = findDuplicates(rows)

  // Calculate penalties for model readiness score
  const missingValuesPenalty = calculateMissingValuesPenalty(columnAnalysis)
  const duplicateRowsPenalty = calculateDuplicatesPenalty(
    duplicateMetrics.duplicatePercentage
  )
  const lowRowCountPenalty = calculateRowCountPenalty(rows.length)
  const piiColumnsCount = columnAnalysis.filter((c) => c.isPII).length
  const piiExposurePenalty = calculatePIIPenalty(piiColumnsCount, headers.length)
  const inconsistentDataPenalty = calculateConsistencyPenalty(columnAnalysis)

  // Calculate model readiness score (0-100)
  const totalPenalty =
    missingValuesPenalty +
    duplicateRowsPenalty +
    lowRowCountPenalty +
    piiExposurePenalty +
    inconsistentDataPenalty

  const modelReadinessScore = Math.max(0, Math.round(100 - totalPenalty))

  // Calculate overall completeness
  const overallCompleteness =
    columnAnalysis.length > 0
      ? Math.round(
          100 -
            (columnAnalysis.reduce((sum, col) => sum + col.missingPercentage, 0) /
              columnAnalysis.length) *
              100
        )
      : 100

  return {
    totalRows: rows.length,
    totalColumns: headers.length,
    fileSize: formatFileSize(fileSize),
    detectedDomain,
    columns: columnAnalysis,
    duplicateRows: duplicateMetrics.duplicateCount,
    duplicatePercentage: duplicateMetrics.duplicatePercentage,
    modelReadinessScore,
    scoreBreakdown: {
      missingValuesPenalty,
      duplicateRowsPenalty,
      lowRowCountPenalty,
      piiExposurePenalty,
      inconsistentDataPenalty,
    },
    overallCompleteness,
    piiColumnsCount,
    summary: generateSummary(
      rows.length,
      headers.length,
      modelReadinessScore,
      piiColumnsCount
    ),
    rawCsv,
  }
}

function analyzeColumns(rows: any[], headers: string[]): ColumnAnalysis[] {
  return headers.map((header) => {
    const values = rows.map((row) => row[header])
    const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== '')
    const missingCount = values.length - nonNullValues.length
    const missingPercentage = (missingCount / values.length) * 100

    // Detect data type
    const dataType = detectDataType(nonNullValues)

    // Find duplicates in column
    const valueSet = new Set(nonNullValues)
    const duplicateCount = nonNullValues.length - valueSet.size

    // Get unique count and sample values
    const uniqueCount = valueSet.size
    const sampleValues = Array.from(valueSet)
      .slice(0, 3)
      .map((v) => String(v))

    // Analyze numeric columns
    let numericAnalysis: Partial<ColumnAnalysis> = {}
    if (dataType === 'numeric') {
      const numericValues = nonNullValues
        .map((v) => parseFloat(String(v)))
        .filter((v) => !isNaN(v))

      if (numericValues.length > 0) {
        const sorted = [...numericValues].sort((a, b) => a - b)
        const mean = numericValues.reduce((a, b) => a + b) / numericValues.length
        const median =
          numericValues.length % 2 === 0
            ? (sorted[numericValues.length / 2 - 1] + sorted[numericValues.length / 2]) / 2
            : sorted[Math.floor(numericValues.length / 2)]
        const variance =
          numericValues.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) /
          numericValues.length
        const stdDev = Math.sqrt(variance)
        const min = Math.min(...numericValues)
        const max = Math.max(...numericValues)

        // Count outliers using IQR method
        const q1 = sorted[Math.floor(sorted.length * 0.25)]
        const q3 = sorted[Math.floor(sorted.length * 0.75)]
        const iqr = q3 - q1
        const outlierCount = numericValues.filter(
          (v) => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr
        ).length

        numericAnalysis = {
          mean: Math.round(mean * 100) / 100,
          median: Math.round(median * 100) / 100,
          stdDev: Math.round(stdDev * 100) / 100,
          min,
          max,
          outlierCount,
        }
      }
    }

    return {
      name: header,
      dataType,
      missingCount,
      missingPercentage: Math.round(missingPercentage * 100) / 100,
      uniqueCount,
      duplicateCount,
      sampleValues,
      isPII: isPIIColumn(header),
      ...numericAnalysis,
    }
  })
}

function detectDataType(values: any[]): string {
  if (values.length === 0) return 'unknown'

  let numericCount = 0
  let dateCount = 0
  let booleanCount = 0

  for (const value of values.slice(0, 100)) {
    const str = String(value).trim().toLowerCase()

    // Strict boolean  - only exact matches
    if (/^(true|false|yes|no)$/.test(str)) {
      booleanCount++
    // Strict numeric - must be a valid number, not just contain digits
    } else if (!isNaN(Number(str)) && str !== '') {
      numericCount++
    // Date patterns
    } else if (
      /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$|^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(str)
    ) {
      dateCount++
    }
  }

  const total = Math.min(values.length, 100)

  if (booleanCount > total * 0.8) return 'boolean'
  if (numericCount > total * 0.8) return 'numeric'
  if (dateCount > total * 0.8) return 'date'
  return 'text'
}

function findDuplicates(rows: any[]): {
  duplicateCount: number
  duplicatePercentage: number
} {
  const rowStrings = rows.map((row) => JSON.stringify(row))
  const unique = new Set(rowStrings)
  const duplicateCount = rows.length - unique.size

  return {
    duplicateCount,
    duplicatePercentage: Math.round((duplicateCount / rows.length) * 100 * 100) / 100,
  }
}

function calculateMissingValuesPenalty(columns: ColumnAnalysis[]): number {
  if (columns.length === 0) return 0

  const avgMissing =
    columns.reduce((sum, col) => sum + col.missingPercentage, 0) / columns.length

  // 0% missing = 0 penalty, 50% missing = 25 penalty, 100% missing = 40 penalty
  return Math.min((avgMissing / 100) * 40, 40)
}

function calculateDuplicatesPenalty(duplicatePercentage: number): number {
  // 0% duplicates = 0 penalty, 50% duplicates = 20 penalty, 100% duplicates = 30 penalty
  return Math.min((duplicatePercentage / 100) * 30, 30)
}

function calculateRowCountPenalty(rowCount: number): number {
  // Less than 100 rows = 20 penalty, 100-1000 = 10 penalty, 1000+ = 0 penalty
  if (rowCount < 100) return 20
  if (rowCount < 1000) return 10
  return 0
}

function calculateConsistencyPenalty(columns: ColumnAnalysis[]): number {
  let penalty = 0

  for (const column of columns) {
    if (column.missingPercentage > 50) {
      penalty += 5 // High missing values in specific column
    }
    if (column.duplicateCount > column.uniqueCount * 0.1) {
      penalty += 2 // High duplicates in column
    }
  }

  return Math.min(penalty, 20)
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

function generateSummary(
  rowCount: number,
  columnCount: number,
  readinessScore: number,
  piiCount: number
): string {
  let parts = []

  parts.push(`Dataset contains ${rowCount} rows and ${columnCount} columns.`)

  if (piiCount > 0) {
    parts.push(`⚠️ ${piiCount} PII-sensitive column(s) detected.`)
  }

  if (readinessScore >= 80) {
    parts.push(`✓ Model Readiness Score: ${readinessScore}/100 - Ready for model training.`)
  } else if (readinessScore >= 60) {
    parts.push(
      `⚠️ Model Readiness Score: ${readinessScore}/100 - Some data quality issues need addressing.`
    )
  } else {
    parts.push(
      `✗ Model Readiness Score: ${readinessScore}/100 - Significant data quality issues. Review recommendations below.`
    )
  }

  return parts.join(' ')
}
