import { NextRequest, NextResponse } from 'next/server'
import { getLCSession, buildLCHeaders } from '@/lib/lc-session'

const QUERY = `
query recentAcSubmissions($username: String!, $limit: Int!) {
  recentAcSubmissionList(username: $username, limit: $limit) {
    id
    title
    titleSlug
    timestamp
    lang
  }
}
`

export async function POST(req: NextRequest) {
  const session = getLCSession(req)
  if (!session) {
    return NextResponse.json({ error: 'SESSION_MISSING' }, { status: 401 })
  }

  const { username } = await req.json()
  if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 })

  try {
    const res = await fetch('https://leetcode.com/graphql', {
      method:  'POST',
      headers: buildLCHeaders(session),
      body:    JSON.stringify({ query: QUERY, variables: { username, limit: 20 } }),
    })

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json({ error: 'SESSION_EXPIRED' }, { status: 401 })
    }
    if (res.status === 429) {
      return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 })
    }
    if (!res.ok) {
      return NextResponse.json({ error: 'LC_ERROR' }, { status: res.status })
    }

    const data = await res.json()
    if (data.errors) {
      return NextResponse.json({ error: 'SESSION_EXPIRED' }, { status: 401 })
    }

    return NextResponse.json(data.data)
  } catch {
    return NextResponse.json({ error: 'FETCH_FAILED' }, { status: 500 })
  }
}
