import { calculateFidelityScore } from '@/lib/services/gemini'
import { fetchReferenceData } from '@/lib/services/reference-data'
import { extractDomain, extractCountry } from '@/lib/utils/extract'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { csvData, prompt, domain, country } = await req.json()
  
  const referenceData = await Promise.race([
    fetchReferenceData(domain, country),
    new Promise<string>(resolve => setTimeout(() => resolve(''), 2000))
  ])

  const result = await calculateFidelityScore(
    csvData, prompt, domain, country, referenceData
  )

  return NextResponse.json(result)
}