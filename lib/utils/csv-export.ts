export function csvToJSON(csvText: string): any[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim())
  const data: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const obj: any = {}
    const currentLine = lines[i].split(',')

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentLine[j]?.trim() || ''
    }

    data.push(obj)
  }

  return data
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
