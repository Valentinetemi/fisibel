import { streamSyntheticDataGeneration, calculateFidelityScore } from '@/lib/services/gemini'

export async function POST(req: Request) {
  const { prompt } = await req.json()
  const { stream, domain, country, referenceData } = await streamSyntheticDataGeneration(prompt)
  
  // this is to store context in response headers so frontend can use it
  const response = stream.toTextStreamResponse()
  response.headers.set('X-Domain', domain)
  response.headers.set('X-Country', country)
  
  return response
}