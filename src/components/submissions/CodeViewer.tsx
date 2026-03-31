'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import hljs from 'highlight.js/lib/core'
import python from 'highlight.js/lib/languages/python'
import cpp from 'highlight.js/lib/languages/cpp'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import { lcFetch } from '@/lib/lc-fetch'
import { Submission, LeetCodeData, SubmissionDetails, Question } from '@/types/leetcode'
import { CodeReviewPanel } from './CodeReviewPanel'

hljs.registerLanguage('python', python)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('java', java)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('python3', python)
hljs.registerLanguage('c', cpp)

interface CodeViewerProps {
  submission: Submission
  username: string
  data: LeetCodeData
  studentName?: string
  onSessionError: (reason: 'missing' | 'expired') => void
}

type Status = 'loading' | 'done' | 'error'

const DIFF_COLOR: Record<string, string> = {
  Easy:   'var(--easy)',
  Medium: 'var(--medium)',
  Hard:   'var(--hard)',
}

export function CodeViewer({ submission, username, data, studentName, onSessionError }: CodeViewerProps) {
  const router = useRouter()
  const [details,       setDetails]       = useState<SubmissionDetails | null>(null)
  const [question,      setQuestion]      = useState<Question | null>(null)
  const [status,        setStatus]        = useState<Status>('loading')
  const [codeUnavail,   setCodeUnavail]   = useState(false)
  const [showProblem,   setShowProblem]   = useState(false)
  const [showReview,    setShowReview]    = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')
    setDetails(null)
    setQuestion(null)
    setCodeUnavail(false)
    setShowReview(false)

    try {
      const [detRes, qRes] = await Promise.all([
        lcFetch('/api/submission-details', { submissionId: submission.id }),
        fetch('/api/question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titleSlug: submission.titleSlug }),
        }),
      ])

      const detJson = await detRes.json()
      const qJson   = await qRes.json()

      if (!detRes.ok) {
        const code = detJson.error as string
        if (code === 'SESSION_MISSING') { onSessionError('missing'); return }
        if (code === 'SESSION_EXPIRED') { onSessionError('expired'); return }
        setStatus('error'); return
      }

      if (detJson.codeUnavailable) setCodeUnavail(true)
      else setDetails(detJson)

      setQuestion(qJson.question ?? null)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }, [submission.id, submission.titleSlug, onSessionError])

  useEffect(() => { load() }, [load])

  const highlighted = details?.code
    ? hljs.highlightAuto(details.code, [details.lang?.name ?? 'python']).value
    : null

  const lang     = details?.lang?.verboseName ?? details?.lang?.name ?? submission.lang ?? ''
  const runtime  = details ? `${details.runtime}ms` : 'N/A'
  const memory   = details ? `${details.memory}MB`  : 'N/A'
  const rtPct    = details?.runtimePercentile ? ` — beats ${details.runtimePercentile.toFixed(1)}%` : ''
  const memPct   = details?.memoryPercentile  ? ` — beats ${details.memoryPercentile.toFixed(1)}%`  : ''
  const q        = question ?? details?.question

  if (status === 'loading') {
    return (
      <div className="space-y-4 p-6">
        <div className="skeleton h-6 w-48 rounded" />
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="p-6 text-center" style={{ color: 'var(--hard)' }}>
        Failed to load submission details.
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Top bar */}
      <div
        className="p-5 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>
                {q?.questionFrontendId && <span className="mono text-sm mr-1" style={{ color: 'var(--muted)' }}>#{q.questionFrontendId}</span>}
                {q?.title ?? submission.title}
              </span>
              {q?.difficulty && (
                <span
                  className="mono text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: `${DIFF_COLOR[q.difficulty] ?? 'var(--muted)'}20`,
                    color: DIFF_COLOR[q.difficulty] ?? 'var(--muted)',
                  }}
                >
                  {q.difficulty}
                </span>
              )}
            </div>
            {/* Topic tags */}
            {q?.topicTags && (
              <div className="flex flex-wrap gap-1 mb-2">
                {q.topicTags.slice(0, 5).map(t => (
                  <span
                    key={t.slug}
                    className="mono text-xs px-2 py-0.5 rounded"
                    style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' }}
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-4 text-xs mono" style={{ color: 'var(--muted)' }}>
              <span>⚡ {runtime}{rtPct}</span>
              <span>🧠 {memory}{memPct}</span>
              <span
                className="px-2 py-0.5 rounded"
                style={{ background: 'var(--surface2)', color: 'var(--accent)' }}
              >
                {lang}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Problem statement collapsible */}
        {question?.content && (
          <div>
            <button
              onClick={() => setShowProblem(s => !s)}
              className="flex items-center gap-2 text-sm mono mb-2"
              style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span>{showProblem ? '▾' : '▸'}</span>
              {showProblem ? 'Hide Problem Statement' : 'Show Problem Statement'}
            </button>
            {showProblem && (
              <div
                className="rounded-xl p-4 text-sm overflow-y-auto"
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  maxHeight: 256,
                  color: 'var(--text)',
                }}
                dangerouslySetInnerHTML={{ __html: question.content }}
              />
            )}
          </div>
        )}

        {/* Code block */}
        {codeUnavail ? (
          <div
            className="rounded-xl p-5 text-center"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
          >
            <div className="text-2xl mb-2">⚠️</div>
            <p className="text-sm mb-1" style={{ color: 'var(--text)' }}>
              LeetCode has restricted access to this submission&apos;s code.
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
              You can still run AI analysis on the problem itself.
            </p>
            <button
              onClick={() => setShowReview(true)}
              className="px-4 py-2 rounded-xl mono text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#0a0a0f' }}
            >
              🤖 Analyse Problem Without Code
            </button>
          </div>
        ) : highlighted ? (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div
              className="flex items-center justify-between px-4 py-2"
              style={{ background: '#1a1a2e', borderBottom: '1px solid var(--border)' }}
            >
              <span className="mono text-xs" style={{ color: 'var(--muted)' }}>{lang}</span>
            </div>
            <pre
              className="p-4 overflow-x-auto text-sm"
              style={{ background: '#0d0d14', margin: 0 }}
            >
              <code
                className="hljs"
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </pre>
          </div>
        ) : null}

        {/* Action buttons */}
        {!codeUnavail && (
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowReview(s => !s)}
              className="px-4 py-2 rounded-xl mono text-sm font-bold transition-all"
              style={{
                background: showReview ? 'var(--surface2)' : 'linear-gradient(135deg, var(--accent), var(--accent2))',
                color: showReview ? 'var(--muted)' : '#0a0a0f',
                border: showReview ? '1px solid var(--border)' : 'none',
              }}
            >
              🤖 {showReview ? 'Hide AI Review' : 'AI Code Review'}
            </button>
            <button
              onClick={() => router.push(`/profile/${username}/mock?from=${submission.titleSlug}`)}
              className="px-4 py-2 rounded-xl mono text-sm font-bold transition-all"
              style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              🎤 Mock Interview from This
            </button>
          </div>
        )}

        {/* AI Review Panel */}
        <CodeReviewPanel
          visible={showReview}
          username={username}
          data={data}
          studentName={studentName}
          problemTitle={q?.title ?? submission.title}
          problemStatement={question?.content ?? ''}
          code={details?.code ?? null}
          language={lang}
          runtime={runtime}
          memory={memory}
        />
      </div>

      {/* highlight.js theme — injected inline to avoid extra CSS file */}
      <style global jsx>{`
        .hljs { color: #abb2bf; }
        .hljs-keyword, .hljs-selector-tag, .hljs-built_in, .hljs-literal { color: #c678dd; }
        .hljs-string, .hljs-attr { color: #98c379; }
        .hljs-number, .hljs-symbol { color: #d19a66; }
        .hljs-comment { color: #5c6370; font-style: italic; }
        .hljs-function, .hljs-title { color: #61afef; }
        .hljs-class, .hljs-type { color: #e5c07b; }
        .hljs-variable { color: #e06c75; }
        .hljs-meta { color: #56b6c2; }
      `}</style>
    </div>
  )
}
