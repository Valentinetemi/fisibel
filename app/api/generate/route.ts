import { streamSyntheticDataGeneration } from '@/lib/services/gemini'

export async function POST(req: Request) {
  const { prompt, visualContext } = await req.json()
  
  const { stream, domain, country } = await streamSyntheticDataGeneration(prompt, visualContext)
  
  const response = stream.toTextStreamResponse()
  response.headers.set('X-Domain', domain)
  response.headers.set('X-Country', country)
  
  return response
}