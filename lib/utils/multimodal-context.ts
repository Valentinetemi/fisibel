export interface UploadedVisualContext {
  fileName: string
  fileSize: number
  fileType: string
  detectedRegion: string
  summary: string
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

export function extractDocumentContext(file: File): UploadedVisualContext {
  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || inferFileType(file.name),
    detectedRegion: inferRegionFromFileName(file.name),
    summary:
      'Uploaded visual health context queued for OCR, map inspection, report parsing, and clinical signal extraction.',
  }
}

export function analyzeVisualEntities(context: UploadedVisualContext): string[] {
  const lower = context.fileName.toLowerCase()
  const entities = ['clinical indicators', 'regional markers']

  if (lower.includes('map') || lower.includes('geo')) entities.push('geospatial clusters')
  if (lower.includes('scan') || lower.includes('xray') || lower.includes('x-ray')) entities.push('scan findings')
  if (lower.includes('report') || lower.endsWith('.pdf')) entities.push('tabular report fields')
  if (lower.includes('malaria')) entities.push('malaria prevalence signals')
  if (lower.includes('maternal')) entities.push('maternal health parameters')

  return [...new Set(entities)]
}

export function buildMultimodalPrompt(
  basePrompt: string,
  context?: UploadedVisualContext | null
): string {
  if (!context) return basePrompt

  const entities = analyzeVisualEntities(context).join(', ')

  return `${basePrompt}

Uploaded Visual Context:
Analyze the uploaded document/map/report and extract any detectable clinical, regional, epidemiological, or tabular information.

Visual Context Metadata:
- File: ${context.fileName}
- Type: ${context.fileType}
- Size: ${formatFileSize(context.fileSize)}
- Detected Region: ${context.detectedRegion}
- Candidate Entities: ${entities}
- OCR Status: placeholder pipeline active; use the metadata and filename signals as generation context until Gemma multimodal extraction is connected.`
}

function inferFileType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  if (extension === 'pdf') return 'application/pdf'
  if (extension === 'png') return 'image/png'
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg'
  return 'unknown'
}

function inferRegionFromFileName(fileName: string): string {
  const lower = fileName.toLowerCase()
  const regions = [
    'Nigeria',
    'Kenya',
    'Ghana',
    'South Africa',
    'Ethiopia',
    'Tanzania',
    'Rwanda',
    'Lagos',
    'Kano',
    'Nairobi',
    'Accra',
  ]

  return regions.find((region) => lower.includes(region.toLowerCase())) || 'Detected Region'
}
