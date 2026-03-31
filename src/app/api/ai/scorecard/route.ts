import { NextRequest, NextResponse } from 'next/server'
import { streamCompletion } from '@/lib/openrouter'
import { buildProfileContext, scorecardStreamPrompt } from '@/lib/prompts'
import { LeetCodeData } from '@/types/leetcode'

export async function POST(req: NextRequest) {
  try {
    const { username, data, studentName }: {
      username: string; data: LeetCodeData; studentName?: string
    } = await req.json()

    const context = buildProfileContext(username, data, studentName)
    const stream  = await streamCompletion([
      { role: 'system', content: scorecardStreamPrompt(context) },
      { role: 'user',   content: 'Generate the placement readiness report now.' },
    ], 1500)

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err: any) {
    console.error('Scorecard error:', err.message || err)
    return NextResponse.json({ error: 'AI_ERROR' }, { status: 500 })
  }
}
