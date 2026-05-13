import { NextResponse } from 'next/server'

const OM_BASE = process.env.OPENMETADATA_URL!
const OM_TOKEN = process.env.OPENMETADATA_TOKEN!

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${OM_TOKEN}`,
}

export async function GET() {
  // This create the database
  const dbRes = await fetch(`${OM_BASE}/api/v1/databases`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'default',
      displayName: 'AfriGen Default Database',
      service: 'afrigen-synthetic',
    }),
  })
  const db = await dbRes.json()

  // Create schema
  const schemaRes = await fetch(`${OM_BASE}/api/v1/databaseSchemas`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'synthetic_datasets',
      displayName: 'Synthetic Datasets',
      database: 'afrigen-synthetic.default',
    }),
  })
  const schema = await schemaRes.json()

  return NextResponse.json({ db, schema })
}