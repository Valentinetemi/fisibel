export function isPIIColumn(columnName: string): boolean {
  const columnLower = columnName.toLowerCase()

  const piiPatterns = [
    /^(patient_?name|full_?name|firstname|lastname|surname|first_name|last_name)$/,
    /^(phone|mobile|telephone|phone_number|mobile_number)$/,
    /^(email|email_address)$/,
    /^(ssn|social_security|national_id|nin|bvn|passport|passport_number|driving_license|driver_license)$/,
    /^(street_address|home_address|residential_address)$/,
    /^(credit_card|card_number|account_number|bank_account)$/,
    /^(date_of_birth|dob|birth_date)$/,
    /^(national_insurance|tax_id|tin)$/,
  ]

  return piiPatterns.some((pattern) => pattern.test(columnLower))
}

export function detectPIIColumns(headers: string[]): string[] {
  return headers.filter((header) => isPIIColumn(header))
}

export function calculatePIIPenalty(piiColumnsCount: number, totalColumns: number): number {
  if (piiColumnsCount === 0) return 0
  return Math.min((piiColumnsCount / totalColumns) * 40, 30)
}