/**
 * Safely parses AI-generated JSON.
 * Strips markdown fences, finds outermost braces, validates required keys.
 * Returns null on any failure — callers must handle null gracefully.
 */
export function parseAIJson<T>(raw: string, requiredKeys: string[]): T | null {
  try {
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i,     '')
      .replace(/```\s*$/,      '')
      .trim()

    // Find the outermost { } in case of leading/trailing garbage text
    const start = cleaned.indexOf('{')
    const end   = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1) return null

    const jsonStr = cleaned.slice(start, end + 1)
    const parsed  = JSON.parse(jsonStr) as T

    for (const key of requiredKeys) {
      if (!(key in (parsed as object))) return null
    }

    return parsed
  } catch {
    return null
  }
}
