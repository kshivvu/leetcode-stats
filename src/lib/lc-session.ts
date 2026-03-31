import { NextRequest } from 'next/server'

export function getLCSession(req: NextRequest): string | null {
  return req.headers.get('x-lc-session') ?? null
}

export function buildLCHeaders(session: string) {
  return {
    'Content-Type': 'application/json',
    'Referer':      'https://leetcode.com',
    'User-Agent':   'Mozilla/5.0 (compatible)',
    'Cookie':       `LEETCODE_SESSION=${session}`,
    'x-csrftoken':  'dummy',
  }
}
