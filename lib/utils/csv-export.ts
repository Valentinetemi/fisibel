export function csvToJSON(csvText: string): any[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0])
  const data: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const obj: any = {}
    const currentLine = parseCSVLine(lines[i])

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentLine[j] || ''
    }

    data.push(obj)
  }

  return data
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

export function arrayToCSV(data: any[], headers?: string[]): string {
  if (data.length === 0) return ''

  const keys = headers || Object.keys(data[0])
  const csvHeaders = keys.join(',')
  const csvRows = data.map((row) =>
    keys.map((key) => {
      const value = row[key]
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value ?? ''
    })
  )

  return [csvHeaders, ...csvRows.map((row) => row.join(','))].join('\n')
}

export function arrayToJSON(data: any[]): string {
  return JSON.stringify(data, null, 2)
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
