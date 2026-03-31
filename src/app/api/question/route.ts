import { NextRequest, NextResponse } from 'next/server'

const QUERY = `
query questionDetail($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionFrontendId
    title
    titleSlug
    difficulty
    content
    topicTags { name slug }
    hints
    exampleTestcases
  }
}
`

export async function POST(req: NextRequest) {
  const { titleSlug } = await req.json()
  if (!titleSlug) return NextResponse.json({ error: 'titleSlug required' }, { status: 400 })

  try {
    const res = await fetch('https://leetcode.com/graphql', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Referer': 'https://leetcode.com' },
      body:    JSON.stringify({ query: QUERY, variables: { titleSlug } }),
    })

    if (!res.ok) return NextResponse.json({ error: 'LC_ERROR' }, { status: res.status })

    const data = await res.json()
    return NextResponse.json(data.data)
  } catch {
    return NextResponse.json({ error: 'FETCH_FAILED' }, { status: 500 })
  }
}
