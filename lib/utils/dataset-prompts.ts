// This are pre-written prompts for each hardcoded catalog dataset
export const datasetPrompts: Record<string, { prompt: string; filename: string }> = {
  'malaria-nigeria': {
    prompt:
      'Generate 1,000 rows of malaria prediction data for Northern Nigeria with realistic patient demographics (age, gender, location), symptoms (fever, headache, body ache duration), test results (rapid diagnostic test, blood smear microscopy), and outcomes (confirmed positive/negative, treatment outcome, recovery time).',
    filename: 'malaria-nigeria-sample.csv',
  },
  'mobile-money-kenya': {
    prompt:
      'Generate 1,500 rows of M-Pesa transaction data for Kenya with customer demographics (phone number, location, customer type), transaction details (amount in KES, transaction type, timestamp), recipient info, and behavioral metrics (frequency, average amount, success rate).',
    filename: 'mobile-money-kenya-sample.csv',
  },
  'crop-yield-ghana': {
    prompt:
      'Generate 1,000 rows of agricultural data from Ghana with farm location (district, region), crop type (maize, cocoa, cassava), environmental factors (rainfall mm, temperature C, soil pH), input metrics (fertilizer kg, labor hours), and harvest results (yield kg/hectare, quality grade).',
    filename: 'crop-yield-ghana-sample.csv',
  },
  'education-south-africa': {
    prompt:
      'Generate 1,200 rows of student performance data from South Africa including demographics (age, gender, province, school type), socioeconomic factors (parent education, household income bracket, access to resources), learning metrics (attendance %, homework completion %), and academic outcomes (grades 0-100, graduation status).',
    filename: 'student-performance-sa-sample.csv',
  },
  'energy-access-uganda': {
    prompt:
      'Generate 1,000 rows of household energy access survey data from Uganda with household location (district, urban/rural), demographic info (household size, income level), energy sources used (grid electricity, solar, biomass), energy spending, and availability metrics (hours per day available, reliability score).',
    filename: 'energy-access-uganda-sample.csv',
  },
  'unemployment-senegal': {
    prompt:
      'Generate 1,200 rows of labor market survey data from Senegal with individual demographics (age, gender, education level, location), employment status (employed, unemployed, self-employed), job details (sector, salary range, job type), skills inventory, and economic indicators (years experience, job search duration).',
    filename: 'labor-market-senegal-sample.csv',
  },
}
