export function extractDomain(prompt: string): string {
    const domains = ['Healthcare']
    const lower = prompt.toLowerCase()
    for (const domain of domains) {
      if (lower.includes(domain.toLowerCase())) return domain
    }
    // Extra keywords
    if (lower.includes('malaria') || lower.includes('health') || lower.includes('patient') || lower.includes('hospital')) return 'Healthcare'
  }
  
  export function extractCountry(prompt: string): string {
    const countries: Record<string, string> = {
      'nigeria': 'Nigeria',
      'nigerian': 'Nigeria',
      'kenya': 'Kenya',
      'kenyan': 'Kenya',
      'ghana': 'Ghana',
      'ghanaian': 'Ghana',
      'south africa': 'South Africa',
      'uganda': 'Uganda',
      'senegal': 'Senegal',
      'rwanda': 'Rwanda',
      'ethiopia': 'Ethiopia',
      'tanzania': 'Tanzania',
    }
    const lower = prompt.toLowerCase()
    for (const [key, value] of Object.entries(countries)) {
      if (lower.includes(key)) return value
    }
    return 'Nigeria' // default
  }