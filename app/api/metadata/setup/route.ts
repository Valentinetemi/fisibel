import { createFisibelService, registerDataset } from '@/lib/services/openmetadata'
import { NextResponse } from 'next/server'

export async function GET() {
  const result = await createFisibelService()
  console.log('[OpenMetadata] Service creation result:', result)
  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const body = await req.json()
  
  // Always create service first
  await createFisibelService()
  
  const result = await registerDataset(body)
  return NextResponse.json(result)
}