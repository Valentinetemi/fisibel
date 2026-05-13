import { createAfriGenService } from '@/lib/services/openmetadata'
import { NextResponse } from 'next/server'

export async function GET() {
  const result = await createAfriGenService()
  console.log('[OpenMetadata] Service creation result:', result)
  return NextResponse.json(result)
}