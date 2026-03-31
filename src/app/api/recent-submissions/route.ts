import { NextRequest, NextResponse } from 'next/server'

const LEETCODE_API = 'https://leetcode.com/graphql'

const RECENT_SUBMISSIONS_QUERY = `
query recentAcSubmissions($username: String!, $limit: Int!) {
  recentAcSubmissionList(username: $username, limit: $limit) {
    id
    title
    titleSlug
    timestamp
  }
}
`

export async function POST(req: NextRequest) {
  try {
    const { username, limit = 20 } = await req.json()

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const response = await fetch(LEETCODE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0 (compatible)',
      },
      body: JSON.stringify({ query: RECENT_SUBMISSIONS_QUERY, variables: { username, limit } }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `LeetCode API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (data.errors) {
      return NextResponse.json(
        { error: data.errors[0]?.message || 'GraphQL error' },
        { status: 400 }
      )
    }

    return NextResponse.json(data.data)
  } catch (err) {
    console.error('LeetCode fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch from LeetCode' }, { status: 500 })
  }
}
