import { NextRequest, NextResponse } from 'next/server'
import { getLCSession, buildLCHeaders } from '@/lib/lc-session'

const QUERY = `
query submissionDetails($submissionId: Int!) {
  submissionDetails(submissionId: $submissionId) {
    runtime
    runtimePercentile
    memory
    memoryPercentile
    code
    lang { name verboseName }
    question {
      title
      titleSlug
      difficulty
      questionFrontendId
      topicTags { name slug }
    }
    timestamp
  }
}
`

export async function POST(req: NextRequest) {
  const session = getLCSession(req)
  if (!session) {
    return NextResponse.json({ error: 'SESSION_MISSING' }, { status: 401 })
  }

  const { submissionId } = await req.json()
  if (!submissionId) return NextResponse.json({ error: 'submissionId required' }, { status: 400 })

  try {
    const res = await fetch('https://leetcode.com/graphql', {
      method:  'POST',
      headers: buildLCHeaders(session),
      body:    JSON.stringify({
        query: QUERY,
        variables: { submissionId: parseInt(submissionId) },
      }),
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

    if (data.errors || !data.data?.submissionDetails) {
      // LC sometimes blocks code access even with valid session
      return NextResponse.json({ codeUnavailable: true })
    }

    return NextResponse.json(data.data.submissionDetails)
  } catch {
    return NextResponse.json({ error: 'FETCH_FAILED' }, { status: 500 })
  }
}
