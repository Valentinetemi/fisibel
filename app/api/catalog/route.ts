import { NextResponse } from 'next/server'

const OM_BASE = process.env.OPENMETADATA_URL!
const OM_TOKEN = process.env.OPENMETADATA_TOKEN!

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${OM_TOKEN}`,
}

export async function GET() {
  try {
    const res = await fetch(
      `${OM_BASE}/api/v1/tables?databaseSchema=afrigen-synthetic.default.synthetic_datasets&limit=25&include=all&fields=extension,columns,tags`,
      { headers }
    )
    const data = await res.json()
    const tables = data.data || []
console.log('[Catalog] First table raw:', JSON.stringify(tables[0], null, 2))

    // this is to map OpenMetadata table shape to the dataset interface
    const datasets = tables.map((table: any) => {
      // Parse fidelity score from description
      const fidelityMatch = table.description?.match(/Fidelity Score: (\d+)%/)
      const fidelityScore = fidelityMatch ? parseInt(fidelityMatch[1]) : 0
    
      // Parse row count from description  
      const rowMatch = table.description?.match(/(\d+) rows/)
      const rowCount = rowMatch ? parseInt(rowMatch[1]) : 0
    
      // Parse domain and country from description
      const domainMatch = table.description?.match(/Synthetic (\w+) dataset for (\w[\w\s]+?)\./)
      const domain = domainMatch ? domainMatch[1] : 'General'
      const country = domainMatch ? domainMatch[2].trim() : 'Africa'
    
      return {
        id: table.id,
        name: table.displayName || table.name,
        description: table.description || '',
        domain,
        country,
        rowCount,
        columnCount: table.columns?.length || 0,
        fidelityScore,
        createdAt: new Date(table.updatedAt).toISOString(),
      }
    })

    return NextResponse.json({ datasets })
  } catch (err) {
    console.error('[Catalog] Failed to fetch from OpenMetadata:', err)
    return NextResponse.json({ datasets: [] })
  }
}