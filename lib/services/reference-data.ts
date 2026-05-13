const WORLD_BANK_BASE = 'https://api.worldbank.org/v2'
const WHO_BASE = 'https://ghoapi.azureedge.net/api'

export async function fetchReferenceData(domain: string, country: string): Promise<string> {
  const countryCode = getCountryCode(country)
  
  try {
    if (domain === 'Healthcare') {
      return await fetchWHOData(countryCode, country)
    } else if (domain === 'Finance' || domain === 'FinTech') {
      return await fetchWorldBankFinanceData(countryCode, country)
    } else if (domain === 'Agriculture') {
      return await fetchWorldBankAgricultureData(countryCode, country)
    } else {
      return await fetchWorldBankGeneralData(countryCode, country)
    }
  } catch (error) {
    // If API fails, return empty, this makes Gemini generates.
    return ''
  }
}

async function fetchWHOData(countryCode: string, country: string): Promise<string> {
  const indicators = [
    'MALARIA_EST_DEATHS', // Malaria deaths
    'MDG_0000000026',     // Maternal mortality
    'NUTRITION_ANT_HAZ_NE2', // Child malnutrition
  ]
  
  const results: string[] = []
  
  for (const indicator of indicators) {
    try {
      const res = await fetch(
        `${WHO_BASE}/${indicator}?$filter=SpatialDim eq '${countryCode}'&$top=1`,
        { next: { revalidate: 86400 } } // cache for 24hrs
      )
      const data = await res.json()
      if (data.value?.[0]) {
        results.push(`${indicator}: ${data.value[0].NumericValue} (${data.value[0].TimeDim})`)
      }
    } catch {}
  }
  
  return results.length > 0 
    ? `Real WHO statistics for ${country}:\n${results.join('\n')}` 
    : ''
}

async function fetchWorldBankFinanceData(countryCode: string, country: string): Promise<string> {
  // Financial inclusion, mobile money access
  const indicators = [
    'FX.OWN.TOTL.ZS',   // Account ownership
    'IT.CEL.SETS.P2',    // Mobile subscriptions per 100
  ]
  return fetchWorldBankIndicators(indicators, countryCode, country, 'Finance')
}

async function fetchWorldBankAgricultureData(countryCode: string, country: string): Promise<string> {
  const indicators = [
    'AG.YLD.CREL.KG',   // Cereal yield kg per hectare
    'AG.LND.ARBL.ZS',   // Arable land percentage
    'AG.PRD.FOOD.XD',   // Food production index
  ]
  return fetchWorldBankIndicators(indicators, countryCode, country, 'Agriculture')
}

async function fetchWorldBankGeneralData(countryCode: string, country: string): Promise<string> {
  const indicators = [
    'SP.POP.TOTL',       // Total population
    'SP.URB.TOTL.IN.ZS', // Urban population %
    'SI.POV.NAHC',       // Poverty headcount
    'NY.GDP.PCAP.CD',    // GDP per capita
  ]
  return fetchWorldBankIndicators(indicators, countryCode, country, 'General')
}

async function fetchWorldBankIndicators(
  indicators: string[], 
  countryCode: string, 
  country: string,
  domain: string
): Promise<string> {
  const results: string[] = []
  
  for (const indicator of indicators) {
    try {
      const res = await fetch(
        `${WORLD_BANK_BASE}/country/${countryCode}/indicator/${indicator}?format=json&mrv=1`,
        { next: { revalidate: 86400 } }
      )
      const data = await res.json()
      if (data[1]?.[0]?.value) {
        results.push(`${data[1][0].indicator.value}: ${data[1][0].value} (${data[1][0].date})`)
      }
    } catch {}
  }
  
  return results.length > 0
    ? `Real World Bank statistics for ${country} (${domain}):\n${results.join('\n')}`
    : ''
}

function getCountryCode(country: string): string {
  const codes: Record<string, string> = {
    'Nigeria': 'NG',
    'Kenya': 'KE',
    'Ghana': 'GH',
    'South Africa': 'ZA',
    'Uganda': 'UG',
    'Senegal': 'SN',
    'Rwanda': 'RW',
    'Ethiopia': 'ET',
    'Tanzania': 'TZ',
    'Mozambique': 'MZ',
  }
  return codes[country] || 'NG'
}