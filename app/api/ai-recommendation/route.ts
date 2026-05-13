import { generateAIRecommendation } from '@/lib/services/gemini'

export async function POST(req: Request) {
  try {
    const { analysisReport } = await req.json()

    if (!analysisReport) {
      return Response.json({ error: 'Analysis report is required' }, { status: 400 })
    }

    const recommendation = await generateAIRecommendation(analysisReport)

    return Response.json({ recommendation })
  } catch (error) {
    console.error('Recommendation error:', error)
    return Response.json(
      {
        error: 'Failed to generate recommendation',
        details: (error as Error).message,
      },
      { status: 500 }
    )
  }
}
