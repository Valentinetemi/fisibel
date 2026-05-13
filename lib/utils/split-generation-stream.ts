const REASONING_OPEN = '[REASONING]'
const REASONING_CLOSE = '[/REASONING]'

/** Strip a suffix that is a strict prefix of `token` (incomplete tag at chunk boundary). */
function stripIncompleteSuffix(buffer: string, token: string): string {
  const max = Math.min(buffer.length, token.length - 1)
  for (let len = max; len >= 1; len--) {
    const suffix = buffer.slice(-len)
    if (len === 1 && suffix === '[') continue
    if (token.startsWith(suffix)) return buffer.slice(0, -len)
  }
  return buffer
}

/**
 * Splits a streamed model buffer into reasoning (inside tags) and raw CSV.
 * Backward compatible: if no opening tag appears, the whole buffer is treated as CSV.
 */
export function splitGenerationStream(buffer: string): { reasoning: string; csv: string } {
  let work = buffer.replace(/\r\n/g, '\n')

  const openIdx = work.indexOf(REASONING_OPEN)

  if (openIdx === -1) {
    work = stripIncompleteSuffix(work, REASONING_OPEN)
    return { reasoning: '', csv: work.trimStart() }
  }

  const afterOpen = work.slice(openIdx + REASONING_OPEN.length)
  const closeIdx = afterOpen.indexOf(REASONING_CLOSE)

  if (closeIdx === -1) {
    let reasoning = stripIncompleteSuffix(afterOpen, REASONING_CLOSE).trimEnd()
    return { reasoning, csv: '' }
  }

  const reasoning = afterOpen.slice(0, closeIdx).trim()
  const csv = afterOpen.slice(closeIdx + REASONING_CLOSE.length).replace(/^\s*\n+/, '')
  return { reasoning, csv }
}
