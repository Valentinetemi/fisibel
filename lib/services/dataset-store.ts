export interface Dataset {
  id: string
  name: string
  description: string
  domain: string
  country: string
  rowCount: number
  columnCount: number
  fidelityScore: number
  data: any[]
  createdAt: Date
}

// In-memory store for the session
let catalog: Dataset[] = [
  {
    id: 'malaria-nigeria',
    name: 'Malaria Prediction - Northern Nigeria',
    description: 'Patient health metrics and malaria test results from Northern Nigerian health centers',
    domain: 'Healthcare',
    country: 'Nigeria',
    rowCount: 5000,
    columnCount: 8,
    fidelityScore: 92,
    data: [],
    createdAt: new Date(),
  },
  {
    id: 'mobile-money-kenya',
    name: 'Mobile Money Transactions - Kenya',
    description: 'M-Pesa transaction data including customer demographics and transaction patterns',
    domain: 'FinTech',
    country: 'Kenya',
    rowCount: 8500,
    columnCount: 10,
    fidelityScore: 88,
    data: [],
    createdAt: new Date(),
  },
  {
    id: 'crop-yield-ghana',
    name: 'Crop Yield Analysis - Ghana',
    description: 'Agricultural data including weather patterns, soil metrics, and harvest yields',
    domain: 'Agriculture',
    country: 'Ghana',
    rowCount: 3200,
    columnCount: 12,
    fidelityScore: 85,
    data: [],
    createdAt: new Date(),
  },
  {
    id: 'education-south-africa',
    name: 'Student Performance - South Africa',
    description: 'Educational metrics, socioeconomic factors, and academic performance data',
    domain: 'Education',
    country: 'South Africa',
    rowCount: 6800,
    columnCount: 15,
    fidelityScore: 90,
    data: [],
    createdAt: new Date(),
  },
  {
    id: 'energy-access-uganda',
    name: 'Energy Access Survey - Uganda',
    description: 'Household data on energy access, income levels, and infrastructure availability',
    domain: 'Energy',
    country: 'Uganda',
    rowCount: 4100,
    columnCount: 9,
    fidelityScore: 87,
    data: [],
    createdAt: new Date(),
  },
  {
    id: 'unemployment-senegal',
    name: 'Labor Market Survey - Senegal',
    description: 'Employment data, skills inventory, and economic indicators from West Africa',
    domain: 'Labor',
    country: 'Senegal',
    rowCount: 7200,
    columnCount: 11,
    fidelityScore: 89,
    data: [],
    createdAt: new Date(),
  },
]

export function getCatalog(): Dataset[] {
  return catalog
}

export function addDataset(
  csvData: string,
  name: string,
  domain: string,
  country: string
): Dataset {
  // Parse CSV to count rows and columns
  const lines = csvData.trim().split('\n')
  const headers = lines[0].split(',')
  const rowCount = lines.length - 1

  const dataset: Dataset = {
    id: `generated-${Date.now()}`,
    name,
    description: `Generated synthetic data for ${domain} in ${country}`,
    domain,
    country,
    rowCount,
    columnCount: headers.length,
    fidelityScore: 85 + Math.random() * 10, // Random fidelity between 85-95
    data: [], // Keep data lightweight in catalog
    createdAt: new Date(),
  }

  catalog.unshift(dataset) // Add to front of catalog
  return dataset
}

export function getDatasetById(id: string): Dataset | undefined {
  return catalog.find((d) => d.id === id)
}
