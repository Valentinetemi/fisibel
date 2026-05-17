import { createFisibelService, registerDataset } from '@/lib/services/openmetadata'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const result = await createFisibelService()
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const { name, domain, country, rowCount, columns, fidelityScore, prompt } = await req.json()

  // Always ensure service exists first
  await createFisibelService()

  const result = await registerDataset({
    name,
    domain,
    country,
    rowCount,
    columns,
    fidelityScore,
    prompt,
  })

  return NextResponse.json({ success: !!result, data: result })
}