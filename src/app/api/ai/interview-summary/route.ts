import { NextRequest, NextResponse } from 'next/server'
import { completeCompletion } from '@/lib/openrouter'
import { buildProfileContext, interviewSummaryPrompt } from '@/lib/prompts'
import { parseAIJson } from '@/lib/parse-ai-json'
import { LeetCodeData } from '@/types/leetcode'

export async function POST(req: NextRequest) {
  try {
    const { username, data, studentName, conversationHistory }: {
      username: string; data: LeetCodeData; studentName?: string
      conversationHistory: { role: string; content: string }[]
    } = await req.json()

    const context     = buildProfileContext(username, data, studentName)
    const historyText = conversationHistory
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n')

    const raw    = await completeCompletion(
      [{ role: 'user', content: interviewSummaryPrompt(context, historyText) }],
      2000
    )
    const parsed = parseAIJson(raw, ['overallScore', 'questionResults', 'overallFeedback'])

    if (!parsed) {
      // Return raw text as fallback so frontend can still show something
      return NextResponse.json({ parseError: true, rawText: raw })
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Summary error:', err)
    return NextResponse.json({ error: 'AI_ERROR' }, { status: 500 })
  }
}
