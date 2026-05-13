import { createAfriGenService } from '@/lib/services/openmetadata'

export async function GET() {
  const result = await createAfriGenService()
  return Response.json(result)
}   