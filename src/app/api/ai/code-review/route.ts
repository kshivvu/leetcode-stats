import { NextRequest, NextResponse } from 'next/server'
import { streamCompletion } from '@/lib/openrouter'
import { buildProfileContext, codeReviewSystemPrompt } from '@/lib/prompts'
import { LeetCodeData } from '@/types/leetcode'

export async function POST(req: NextRequest) {
  try {
    const {
      username, data, studentName,
      problemTitle, problemStatement,
      code, language, runtime, memory
    }: {
      username: string; data: LeetCodeData; studentName?: string
      problemTitle: string; problemStatement: string
      code: string; language: string; runtime: string; memory: string
    } = await req.json()

    const context = buildProfileContext(username, data, studentName)
    const stream  = await streamCompletion([
      {
        role: 'system',
        content: codeReviewSystemPrompt(context, problemTitle, problemStatement, code, language, runtime, memory),
      },
      { role: 'user', content: 'Review this code now.' },
    ], 2000)

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('Code review error:', err)
    return NextResponse.json({ error: 'AI_ERROR' }, { status: 500 })
  }
}
