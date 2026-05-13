import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText, streamText } from 'ai'
import { fetchReferenceData } from './reference-data'
import { extractDomain, extractCountry } from '@/lib/utils/extract'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
})

const model = google('gemini-flash-latest')

// ─── African context knowledge base ───────────────────────────────────────────

const AFRICAN_CONTEXT = {
  nigeria: {
    states: ['Lagos', 'Kano', 'Rivers', 'Ogun', 'Kaduna', 'Anambra', 'Oyo', 'Delta', 'Borno', 'Enugu'],
    lgas: {
      Lagos: ['Ikeja', 'Surulere', 'Alimosho', 'Eti-Osa', 'Kosofe', 'Mushin', 'Agege'],
      Kano: ['Kano Municipal', 'Fagge', 'Dala', 'Gwale', 'Tarauni', 'Nassarawa'],
      Rivers: ['Port Harcourt', 'Obio-Akpor', 'Eleme', 'Ikwerre', 'Oyigbo'],
    },
    ethnicGroups: ['Yoruba', 'Hausa', 'Igbo', 'Fulani', 'Efik', 'Tiv', 'Ijaw'],
    currency: 'NGN',
    phonePrefix: '+234',
    hospitals: ['LUTH', 'UCH Ibadan', 'AKTH Kano', 'NAUTH Nnewi', 'FMC Abuja', 'UNTH Enugu'],
  },
  kenya: {
    counties: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Nyeri', 'Machakos'],
    currency: 'KES',
    phonePrefix: '+254',
    ethnicGroups: ['Kikuyu', 'Luo', 'Luhya', 'Kamba', 'Kalenjin', 'Meru', 'Kisii'],
  },
  ghana: {
    regions: ['Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Northern', 'Volta', 'Brong-Ahafo'],
    currency: 'GHS',
    phonePrefix: '+233',
    ethnicGroups: ['Akan', 'Ewe', 'Ga', 'Dagbani', 'Fante'],
  },
  southAfrica: {
    provinces: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Mpumalanga'],
    currency: 'ZAR',
    phonePrefix: '+27',
    ethnicGroups: ['Zulu', 'Xhosa', 'Sotho', 'Tswana', 'Venda', 'Afrikaans'],
  },
}

// ─── Prompt parser ─────────────────────────────────────────────────────────────

interface ParsedPrompt {
  topic: string
  rowCount: number
  country: string
  region: string
  columns: string[]
  domainHints: string[]
}

function parseUserPrompt(userPrompt: string): ParsedPrompt {
  const lower = userPrompt.toLowerCase()

  const rowMatch = userPrompt.match(/(\d[\d,]*)\s*(rows?|records?|samples?|entries|data points?)/i)
  let rowCount = 500
  if (rowMatch) rowCount = Math.min(parseInt(rowMatch[1].replace(/,/g, '')), 2000)

  let country = 'nigeria'
  if (lower.includes('kenya') || lower.includes('nairobi')) country = 'kenya'
  else if (lower.includes('ghana') || lower.includes('accra')) country = 'ghana'
  else if (lower.includes('south africa') || lower.includes('johannesburg')) country = 'southAfrica'

  let region = ''
  for (const state of AFRICAN_CONTEXT.nigeria.states) {
    if (lower.includes(state.toLowerCase())) { region = state; break }
  }

  const columnKeywords: Record<string, string[]> = {
    health: ['age', 'gender', 'diagnosis', 'symptoms', 'treatment', 'outcome', 'facility', 'lga', 'date_of_visit'],
    finance: ['transaction_id', 'sender', 'receiver', 'amount', 'currency', 'channel', 'timestamp', 'status'],
    agriculture: ['crop_type', 'farm_size_ha', 'state', 'lga', 'rainfall_mm', 'temperature_c', 'yield_kg', 'season'],
    education: ['student_id', 'school', 'lga', 'state', 'gender', 'age', 'grade', 'subject', 'score', 'year'],
    transport: ['vehicle_id', 'route', 'state', 'distance_km', 'fare_ngn', 'passenger_count', 'date', 'time'],
  }

  let domainHints: string[] = []
  let columns: string[] = []

  for (const [domain, cols] of Object.entries(columnKeywords)) {
    if (
      lower.includes(domain) ||
      (domain === 'health' && (lower.includes('malaria') || lower.includes('patient') || lower.includes('hospital'))) ||
      (domain === 'finance' && (lower.includes('mobile money') || lower.includes('transaction') || lower.includes('bank'))) ||
      (domain === 'agriculture' && (lower.includes('crop') || lower.includes('farm') || lower.includes('yield')))
    ) {
      domainHints.push(domain)
      columns = cols
      break
    }
  }

  const columnMatch = userPrompt.match(/with\s+([^.]+?)(?:\s+data|\s+information|\s+fields|\s+columns|$)/i)
  if (columnMatch) {
    const mentioned = columnMatch[1].split(/,|and/).map(s => s.trim().toLowerCase().replace(/\s+/g, '_')).filter(Boolean)
    if (mentioned.length > 0) columns = [...new Set([...columns, ...mentioned])]
  }

  return { topic: userPrompt, rowCount, country, region, columns, domainHints }
}

// ─── System prompt builder ─────────────────────────────────────────────────────

function buildSystemPrompt(parsed: ParsedPrompt, referenceData?: string | null): string {
  const ctx = AFRICAN_CONTEXT[parsed.country as keyof typeof AFRICAN_CONTEXT] || AFRICAN_CONTEXT.nigeria
  const columnList = parsed.columns.length > 0 ? parsed.columns.join(', ') : 'infer appropriate columns from the topic'
  const regionCtx = parsed.region || (parsed.country === 'nigeria' ? 'Lagos or Kano' : 'the capital region')

  const stateList = 'states' in ctx
    ? ctx.states.join(', ')
    : 'counties' in ctx
      ? (ctx as typeof AFRICAN_CONTEXT.kenya).counties.join(', ')
      : 'regions' in ctx
        ? (ctx as typeof AFRICAN_CONTEXT.ghana).regions.join(', ')
        : (ctx as typeof AFRICAN_CONTEXT.southAfrica).provinces.join(', ')

  return `You are a specialized synthetic dataset generator for African AI research.

## STRICT OUTPUT RULES
- Return ONLY valid CSV. First row is headers. No explanations, no markdown, no backticks, no commentary.
- Every row must be complete — no empty fields unless the column is explicitly nullable.
- Escape commas inside values by wrapping in double quotes.
- All categorical columns must use EXACTLY the same spelling/casing throughout (e.g. always "Male", never "male" or "M").
- Date format: YYYY-MM-DD. Timestamps: YYYY-MM-DD HH:MM:SS.
- Numbers must be numeric only — no units inside cells (e.g. 42 not "42kg").

## COLUMNS TO GENERATE
${columnList}

## GEOGRAPHIC GROUNDING (${parsed.country.toUpperCase()})
- Region focus: ${regionCtx}
- Use ONLY real place names from: ${stateList}
- LGA/district names must match their actual parent state/county.
- Do NOT invent place names or use placeholders like "City_1", "District_A".

## CULTURAL AUTHENTICITY
- Names must reflect the ethnicity of the region (${ctx.ethnicGroups.join(', ')}).
- Currency: ${ctx.currency}. Phone prefix: ${ctx.phonePrefix}.
- Socioeconomic values must reflect realistic African distributions.

${referenceData ? `## REAL-WORLD REFERENCE DATA (World Bank / WHO)
Use these verified statistics as ground truth for distributions and values:
${referenceData}
Distributions in your generated data MUST align with these figures.

` : ''}## DATA QUALITY REQUIREMENTS
- Never generate PII columns like patient_name, phone_number, national_id, email, or any personally identifiable information
- Use anonymous identifiers like patient_id (numeric only), case_id, record_id instead
- NO PII: Do not generate real ID numbers, passport numbers, or biometric data.
- NO patient names — use Patient_ID format (e.g. PT-00142).
- Categorical consistency: pick 4–8 fixed categories per column and reuse across ALL rows.
- Realistic distributions: ~60% most common category, ~25% second, rest spread.
- Numeric ranges must be realistic (adult ages 18–75, not 0–200).
- Include ~3–5% realistic missing values in non-critical columns only.

## ROW COUNT
Generate exactly ${parsed.rowCount} data rows (not counting the header).`
}

// ─── Post-processor ────────────────────────────────────────────────────────────

export function postProcessCSV(rawCSV: string): string {
  const lines = rawCSV
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .filter(l => !l.startsWith('```') && !l.startsWith('#') && !l.startsWith('//'))

  if (lines.length < 2) return rawCSV

  const header = lines[0]
  const headers = parseCSVLine(header)
  const dataLines = lines.slice(1)

  const columnCategories: Map<number, Map<string, string>> = new Map()

  for (const line of dataLines) {
    const values = parseCSVLine(line)
    values.forEach((val, i) => {
      if (!val || !isNaN(Number(val))) return
      if (!columnCategories.has(i)) columnCategories.set(i, new Map())
      const cats = columnCategories.get(i)!
      const normalized = toTitleCase(val.trim())
      if (!cats.has(val.toLowerCase())) cats.set(val.toLowerCase(), normalized)
    })
  }

  const cleanedLines = dataLines.map(line => {
    const values = parseCSVLine(line)
    while (values.length < headers.length) values.push('')
    const trimmed = values.slice(0, headers.length)
    const normalized = trimmed.map((val, i) => {
      if (!val) return ''
      const cats = columnCategories.get(i)
      if (cats?.has(val.toLowerCase())) return cats.get(val.toLowerCase())!
      return val
    })
    return normalized.map(v => (v.includes(',') ? `"${v}"` : v)).join(',')
  })

  const seen = new Set<string>()
  const deduped = cleanedLines.filter(line => {
    if (seen.has(line)) return false
    seen.add(line)
    return true
  })

  return [header, ...deduped].join('\n')
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const char of line) {
    if (char === '"') inQuotes = !inQuotes
    else if (char === ',' && !inQuotes) { result.push(current.trim()); current = '' }
    else current += char
  }
  result.push(current.trim())
  return result
}

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
}

export async function calculateFidelityScore(
  csvData: string,
  prompt: string,
  domain: string,
  country: string,
  referenceData: string
): Promise<{ score: number; justification: string }> {
  function getCompleteness(csv: string) {
    const rows = csv.split('\n').filter(Boolean)
  
    let total = 0
    let filled = 0
  
    rows.forEach(r => {
      r.split(',').forEach(cell => {
        total++
        if (cell.trim() !== '') filled++
      })
    })
  
    return (filled / total) * 100
  }

  function sampleRows(csv: string, n = 200) {
    const rows = csv.split('\n').filter(Boolean)
    const header = rows[0]
    const body = rows.slice(1)
  
    const shuffled = body.sort(() => 0.5 - Math.random())
    return [header, ...shuffled.slice(0, n)].join('\n')
  }
  const rows = sampleRows(csvData, 50)

  const { text } = await generateText({
    model,
    prompt: `You are an African data scientist evaluating synthetic data quality.

User requested: "${prompt}"
Domain: ${domain}
Country: ${country}

${referenceData ? `Real reference statistics:\n${referenceData}\n` : ''}

Here are the first 20 rows of the generated data:
${rows}

Score this dataset's fidelity from 0-100 based on:
- Do feature relationships make sense? (40 pts)
- Are distributions realistic (not uniform/random)? (30 pts)
- Are risk factors consistent across rows? (20 pts)
- Is there logical coherence (no contradictions)? (10 pts)
- If the data looks generally well-structured and realistic, bias toward 70-90 range
- Only score below 60 if you see clear contradictions or random distributions

Return ONLY valid JSON, nothing else:
{"score": <number>, "justification": "<one sentence explanation>"}`,
    temperature: 0.1,
  })

  try {
    const clean = text.replace(/```json|```/g, '').trim()

    const llmResult = JSON.parse(clean)

    const completeness = getCompleteness(csvData)

    const finalScore = Math.round(
      0.8 * llmResult.score + 0.2 * completeness
    )
    return{
      score: finalScore,
      justification: llmResult.justification
    }
  } catch {
    return { score: 50, justification: 'Fallback due to parsing error' }
  }
}

// - Single exported function - merges structured prompt and reference data -

export async function streamSyntheticDataGeneration(userPrompt: string) {
  const parsed = parseUserPrompt(userPrompt)

  // Try to fetch real World Bank / WHO reference data
  let referenceData: string | null = null
  let domain = ''
  let country = ''
  try {
    const domain = extractDomain(userPrompt)
    const country = extractCountry(userPrompt)

    referenceData = await Promise.race([
      fetchReferenceData(domain, country),
      new Promise<string>(resolve => setTimeout(() => resolve(''), 3000))
    ])
  }
  catch (err)
  {
    console.error(err)
  }
  const systemPrompt = buildSystemPrompt(parsed, referenceData)

  const stream = streamText({
    model,
    system: systemPrompt,
    prompt: `Generate a synthetic CSV dataset for: ${userPrompt}`,
    temperature: 0.7,
  })

  return { stream, domain, country, referenceData }
}

// ─── AI recommendation ─────────────────────────────────────────────────────────

export async function generateAIRecommendation(analysisReport: string): Promise<string> {
  const { text } = await generateText({
    model,
    system: `You are a data science expert helping African data scientists understand data quality and model readiness.
Provide a concise, specific, one-paragraph recommendation (2-3 sentences) based on the data quality analysis provided.
Focus on: what's good about this dataset, what needs fixing, and whether it's ready for model training.
Be specific — do not use generic advice.`,
    prompt: `Data Quality Analysis:\n${analysisReport}\n\nProvide a specific recommendation.`,
    temperature: 0.3,
  })
  return text
}