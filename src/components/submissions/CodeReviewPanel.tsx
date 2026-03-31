'use client'

import { useState, useEffect, useCallback } from 'react'
import { LeetCodeData } from '@/types/leetcode'
import { Markdown } from '@/components/Markdown'

interface CodeReviewPanelProps {
  visible: boolean
  username: string
  data: LeetCodeData
  studentName?: string
  problemTitle: string
  problemStatement: string
  code: string | null
  language: string
  runtime: string
  memory: string
}

type Status = 'idle' | 'loading' | 'streaming' | 'done' | 'error'

export function CodeReviewPanel({
  visible, username, data, studentName,
  problemTitle, problemStatement,
  code, language, runtime, memory,
}: CodeReviewPanelProps) {
  const [status,  setStatus]  = useState<Status>('idle')
  const [content, setContent] = useState('')

  const runReview = useCallback(async () => {
    setStatus('loading')
    setContent('')

    try {
      const response = await fetch('/api/ai/code-review', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username, data, studentName,
          problemTitle,
          problemStatement,
          code: code ?? 'The submitted code is unavailable. Analyse the problem and common approaches.',
          language,
          runtime,
          memory,
        }),
      })

      if (!response.ok) { setStatus('error'); return }

      const reader  = response.body!.getReader()
      const decoder = new TextDecoder()
      setStatus('streaming')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setContent(prev => prev + decoder.decode(value))
      }
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }, [username, data, studentName, problemTitle, problemStatement, code, language, runtime, memory])

  useEffect(() => {
    if (visible && status === 'idle') runReview()
  }, [visible, status, runReview])

  if (!visible) return null

  return (
    <div
      className="rounded-2xl border mt-4"
      style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
    >
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="font-bold text-sm" style={{ color: 'var(--accent)' }}>
          🤖 AI Code Review
        </div>
        {status === 'done' && (
          <button
            onClick={() => { setStatus('idle'); runReview() }}
            className="mono text-xs px-3 py-1 rounded-lg"
            style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            ↺ Re-analyse
          </button>
        )}
      </div>

      <div className="p-5">
        {(status === 'loading') && (
          <div className="space-y-2">
            {[3, 5, 4, 6, 3].map((w, i) => (
              <div key={i} className={`skeleton h-4 rounded w-${w}/6`} />
            ))}
          </div>
        )}
        {(status === 'streaming' || status === 'done') && (
          <div style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text)' }}>
            <Markdown content={content} />
            {status === 'streaming' && (
              <span
                style={{
                  display: 'inline-block',
                  width: '2px',
                  height: '0.9em',
                  background: 'var(--accent)',
                  marginLeft: 2,
                  verticalAlign: 'text-bottom',
                  animation: 'blink 1s step-end infinite',
                }}
              />
            )}
          </div>
        )}
        {status === 'error' && (
          <p className="text-sm" style={{ color: 'var(--hard)' }}>
            Failed to generate review. Check API key and try again.
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  )
}
