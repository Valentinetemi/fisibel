import { analyzeData } from '@/lib/services/data-quality'
import { parseFile } from '@/lib/utils/file-parser'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return Response.json({ error: 'File is required' }, { status: 400 })
    }

    // Parse the file
    const parsedData = await parseFile(file)
    const rawCsv = await file.text()

    // Analyze the data
    const analysis = analyzeData(
      parsedData.rows,
      parsedData.headers,
      parsedData.detectedDomain,
      file.size,
      rawCsv
    )

    return Response.json({ analysis })
  } catch (error) {
    console.error('Analyze error:', error)
    return Response.json(
      {
        error: 'Failed to analyze file',
        details: (error as Error).message,
      },
      { status: 500 }
    )
  }
}
