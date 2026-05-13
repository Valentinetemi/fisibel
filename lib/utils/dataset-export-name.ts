import { extractCountry, extractDomain } from '@/lib/utils/extract'

/** Safe filename segment (no path separators or Windows-forbidden chars). */
export function sanitizeFileBasename(input: string): string {
  const s = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[/\\?%*:|"<>.\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120)
  return s || 'fisibel-dataset'
}

/** Human-readable base name for exports (no extension). */
export function buildGeneratedDatasetBasename(prompt: string): string {
  const domain = extractDomain(prompt)
  const country = extractCountry(prompt)
  return sanitizeFileBasename(`${domain}-${country}-synthetic-dataset`)
}
