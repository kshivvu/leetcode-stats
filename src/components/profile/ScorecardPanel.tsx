'use client'

import { useState, useEffect, useCallback } from 'react'
import { LeetCodeData } from '@/types/leetcode'

interface ScorecardPanelProps {
  username: string
  data: LeetCodeData
  studentName?: string
}

import { Markdown } from '@/components/Markdown'

type Status = 'idle' | 'loading' | 'streaming' | 'done' | 'error'

export function ScorecardPanel({ username, data, studentName }: ScorecardPanelProps) {
  const [status,  setStatus]  = useState<Status>('idle')
  const [content, setContent] = useState('')

  const streamScorecard = useCallback(async () => {
    setStatus('loading')
    setContent('')

    try {
      const response = await fetch('/api/ai/scorecard', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, data, studentName }),
      })

      if (!response.ok) { setStatus('error'); return }

      const reader  = response.body!.getReader()
      const decoder = new TextDecoder()
      setStatus('streaming')

      let accumulated = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        accumulated += text
        setContent(prev => prev + text)
      }
      
      // Cache the result in sessionStorage
      sessionStorage.setItem(`scorecard:${username}`, accumulated)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }, [username, data, studentName])

  useEffect(() => {
    const cached = sessionStorage.getItem(`scorecard:${username}`)
    if (cached) {
      setContent(cached)
      setStatus('done')
    } else if (status === 'idle') {
      streamScorecard()
    }
  }, [status, username, streamScorecard])

  return (
    <div
      className="rounded-2xl border mb-6"
      style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="font-bold" style={{ color: 'var(--accent)' }}>
          📊 AI Placement Analysis
        </div>
        {status === 'done' && (
          <button
            onClick={streamScorecard}
            className="mono text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            ↺ Regenerate
          </button>
        )}
      </div>

      <div className="p-6">
        {status === 'loading' && (
          <div className="space-y-3">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-5/6 rounded" />
            <div className="skeleton h-4 w-2/3 rounded" />
          </div>
        )}

        {(status === 'streaming' || status === 'done') && (
          <div className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
            <Markdown content={content} />
            {status === 'streaming' && (
              <span
                style={{
                  display: 'inline-block',
                  width: '2px',
                  height: '1em',
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
          <div className="text-center py-4">
            <p className="text-sm mb-3" style={{ color: 'var(--hard)' }}>
              Failed to generate analysis. Check your Gemini API key.
            </p>
            <button
              onClick={streamScorecard}
              className="mono text-sm px-4 py-2 rounded-lg"
              style={{
                background: 'var(--surface)',
                color: 'var(--accent)',
                border: '1px solid var(--border)',
              }}
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  )
}
