'use client'

import { useState, useEffect } from 'react'
import { LeetCodeData, Message, InterviewSummaryResult } from '@/types/leetcode'

interface InterviewSummaryProps {
  username: string
  data: LeetCodeData
  studentName?: string
  conversationHistory: Message[]
  onNewInterview: () => void
}

const READINESS_COLOR: Record<string, string> = {
  'Not Ready':    'var(--hard)',
  'Needs Work':   'var(--medium)',
  'Almost There': '#e8b45a',
  'Ready':        'var(--easy)',
}

const PERF_ICON: Record<string, string> = {
  strong:  '✅',
  partial: '⚠️',
  missed:  '❌',
}

export function InterviewSummary({
  username, data, studentName, conversationHistory, onNewInterview,
}: InterviewSummaryProps) {
  const [summary,   setSummary]   = useState<InterviewSummaryResult | null>(null)
  const [rawText,   setRawText]   = useState<string | null>(null)
  const [status,    setStatus]    = useState<'loading' | 'done' | 'error'>('loading')
  const [copied,    setCopied]    = useState(false)

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res  = await fetch('/api/ai/interview-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, data, studentName, conversationHistory }),
        })
        const json = await res.json()
        if (json.parseError) { setRawText(json.rawText); setStatus('done'); return }
        if (json.error)      { setStatus('error'); return }
        setSummary(json as InterviewSummaryResult)
        setStatus('done')
      } catch {
        setStatus('error')
      }
    }
    fetch_()
  }, [username, data, studentName, conversationHistory])

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)' }}
        />
        <p className="mono text-sm" style={{ color: 'var(--muted)' }}>Analysing interview…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--hard)' }}>Failed to generate summary. Check API key.</p>
      </div>
    )
  }

  if (rawText) {
    return (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Received raw text (JSON parse failed):</p>
        <pre className="rounded-xl p-4 overflow-auto text-xs" style={{ background: 'var(--surface2)', color: 'var(--text)', maxHeight: 400 }}>
          {rawText}
        </pre>
        <button
          onClick={() => { navigator.clipboard.writeText(rawText); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          className="px-4 py-2 rounded-xl mono text-sm"
          style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          {copied ? '✓ Copied!' : 'Copy Raw'}
        </button>
      </div>
    )
  }

  if (!summary) return null

  const handleCopy = () => {
    const name = studentName || username
    const lines = [
      `Mock Interview Report — ${name}`,
      `Score: ${summary.overallScore}/10 — ${summary.interviewReadiness}`,
      '',
      summary.overallFeedback,
      '',
      `✅ Strength: ${summary.topStrength}`,
      `🎯 To Improve: ${summary.topImprovement}`,
      '',
      'Questions:',
      ...summary.questionResults.map(q =>
        `${PERF_ICON[q.performance]} ${q.question}\n   ${q.feedback}`),
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const readyColor = READINESS_COLOR[summary.interviewReadiness] ?? 'var(--muted)'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mono text-xs tracking-widest" style={{ color: 'var(--muted)' }}>INTERVIEW COMPLETE</div>
        <div className="text-4xl font-extrabold mono" style={{ color: 'var(--text)' }}>
          {summary.overallScore} <span style={{ color: 'var(--muted)', fontSize: '1.5rem' }}>/ 10</span>
        </div>
        <div>
          <span
            className="mono text-sm font-semibold px-4 py-1.5 rounded-full"
            style={{ background: `${readyColor}20`, color: readyColor, border: `1px solid ${readyColor}40` }}
          >
            {summary.interviewReadiness}
          </span>
        </div>
        <div className="mono text-xs" style={{ color: 'var(--muted)' }}>
          {summary.totalQuestions} question{summary.totalQuestions !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Per-question results */}
      <div
        className="rounded-2xl overflow-hidden border"
        style={{ borderColor: 'var(--border)' }}
      >
        {summary.questionResults.map((q, i) => (
          <div
            key={i}
            className="flex items-start gap-4 px-5 py-4 text-sm"
            style={{
              background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)',
              borderBottom: i < summary.questionResults.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <span className="flex-shrink-0 text-lg">{PERF_ICON[q.performance]}</span>
            <div>
              <div className="font-medium mb-0.5" style={{ color: 'var(--text)' }}>
                {q.question.length > 60 ? q.question.slice(0, 60) + '…' : q.question}
              </div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>{q.feedback}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall feedback */}
      <div
        className="rounded-2xl p-5 border space-y-3"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{summary.overallFeedback}</p>
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(0,184,169,0.08)', border: '1px solid rgba(0,184,169,0.2)', color: 'var(--easy)' }}
        >
          ✅ <strong>Strength:</strong> {summary.topStrength}
        </div>
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(255,192,30,0.08)', border: '1px solid rgba(255,192,30,0.2)', color: 'var(--medium)' }}
        >
          🎯 <strong>To Improve:</strong> {summary.topImprovement}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleCopy}
          className="flex-1 py-3 rounded-xl mono font-bold text-sm"
          style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          {copied ? '✓ Copied!' : '📋 Copy Report'}
        </button>
        <button
          onClick={() => {
            sessionStorage.removeItem(`interview-session:${username}`)
            sessionStorage.removeItem(`interview-config:${username}`)
            onNewInterview()
          }}
          className="flex-1 py-3 rounded-xl mono font-bold text-sm"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#0a0a0f' }}
        >
          🔄 New Interview
        </button>
      </div>
    </div>
  )
}
