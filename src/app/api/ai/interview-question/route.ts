import { NextRequest, NextResponse } from 'next/server'
import { streamCompletion } from '@/lib/gemini'
import { buildProfileContext, mockInterviewSystemPrompt } from '@/lib/prompts'
import { LeetCodeData } from '@/types/leetcode'

interface Message { role: 'user' | 'assistant'; content: string }

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const {
      username, data, studentName,
      submissionsContext, config,
      conversationHistory
    }: {
      username: string; data: LeetCodeData; studentName?: string
      submissionsContext: string
      config: {
        difficulty: string; topics: string[]
        mode: 'submitted-code' | 'custom-topics'
        style: 'conversational' | 'strict'
        numQuestions: number
      }
      conversationHistory: Message[]
    } = await req.json()

    const context = buildProfileContext(username, data, studentName)
    const stream  = await streamCompletion([
      { role: 'system', content: mockInterviewSystemPrompt(context, submissionsContext, config) },
      ...conversationHistory,
    ], 1000)

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err: any) {
    console.error('Interview question error:', err)
    return NextResponse.json({
      error: 'AI_ERROR',
      details: err.message || String(err)
    }, { status: 500 })
  }
}
