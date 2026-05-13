/** Session keys for persisting generate page state across navigations (same tab). */
export const GENERATE_SESSION = {
  stream: 'streamContent',
  rows: 'fisibel_generate_rows',
  headers: 'fisibel_generate_headers',
  ready: 'fisibel_generate_ready',
} as const

export function clearPersistedGenerateResult() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(GENERATE_SESSION.rows)
    sessionStorage.removeItem(GENERATE_SESSION.headers)
    sessionStorage.removeItem(GENERATE_SESSION.ready)
  } catch {
    /* ignore */
  }
}

export function persistGenerateResult(rows: unknown[], headers: string[]) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(GENERATE_SESSION.rows, JSON.stringify(rows))
    sessionStorage.setItem(GENERATE_SESSION.headers, JSON.stringify(headers))
    sessionStorage.setItem(GENERATE_SESSION.ready, '1')
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function loadPersistedGenerateResult(): {
  rows: any[] | null
  headers: string[] | null
} {
  if (typeof window === 'undefined') return { rows: null, headers: null }
  try {
    if (sessionStorage.getItem(GENERATE_SESSION.ready) !== '1') {
      return { rows: null, headers: null }
    }
    const rawRows = sessionStorage.getItem(GENERATE_SESSION.rows)
    const rawHeaders = sessionStorage.getItem(GENERATE_SESSION.headers)
    if (!rawRows || !rawHeaders) return { rows: null, headers: null }
    const rows = JSON.parse(rawRows) as unknown
    const headers = JSON.parse(rawHeaders) as unknown
    if (!Array.isArray(rows) || rows.length === 0) return { rows: null, headers: null }
    if (!Array.isArray(headers) || headers.length === 0) return { rows: null, headers: null }
    return { rows: rows as any[], headers: headers as string[] }
  } catch {
    return { rows: null, headers: null }
  }
}
