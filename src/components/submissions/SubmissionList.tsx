'use client'

import { useState, useEffect } from 'react'
import { lcFetch } from '@/lib/lc-fetch'
import { Submission } from '@/types/leetcode'

interface SubmissionListProps {
  username: string
  onSelect: (sub: Submission) => void
  selectedId: string | null
  onSessionError: (reason: 'missing' | 'expired') => void
}

type Status = 'idle' | 'loading' | 'error' | 'done'

function timeAgo(ts: number): string {
  const seconds = Math.floor(Date.now() / 1000) - ts
  if (seconds < 60)            return 'just now'
  if (seconds < 3600)          return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400)         return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 7 * 86400)     return `${Math.floor(seconds / 86400)}d ago`
  if (seconds < 30 * 86400)    return `${Math.floor(seconds / (7 * 86400))} weeks ago`
  return `${Math.floor(seconds / (30 * 86400))} months ago`
}

const DIFF_COLOR: Record<string, string> = {
  Easy:   'var(--easy)',
  Medium: 'var(--medium)',
  Hard:   'var(--hard)',
}

export function SubmissionList({ username, onSelect, selectedId, onSessionError }: SubmissionListProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [status,      setStatus]      = useState<Status>('idle')
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setStatus('loading')
      try {
        const res  = await lcFetch('/api/submissions', { username })
        const json = await res.json()

        if (!res.ok || json.error) {
          const code = json.error as string
          if (code === 'SESSION_MISSING') { onSessionError('missing'); return }
          if (code === 'SESSION_EXPIRED') { onSessionError('expired'); return }
          if (code === 'RATE_LIMITED')    { setErrorMsg('Rate limited — wait a minute and retry.'); setStatus('error'); return }
          setErrorMsg('Failed to fetch submissions.'); setStatus('error'); return
        }

        setSubmissions(json.recentAcSubmissionList ?? [])
        setStatus('done')
      } catch {
        setErrorMsg('Network error.'); setStatus('error')
      }
    }
    load()
  }, [username, onSessionError])

  if (status === 'loading') {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-14 rounded-xl" />
        ))}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>
        {errorMsg}
      </div>
    )
  }

  if (status === 'done' && submissions.length === 0) {
    return (
      <div className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>
        No accepted submissions found for this user.
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {submissions.map((sub, idx) => {
        const isSelected = selectedId === sub.id
        return (
          <button
            key={sub.id}
            onClick={() => onSelect(sub)}
            className="w-full text-left px-4 py-3 rounded-xl transition-all"
            style={{
              background: isSelected ? 'var(--surface2)' : 'transparent',
              borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
              border: isSelected
                ? '1px solid var(--border)'
                : '1px solid transparent',
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="mono text-xs flex-shrink-0" style={{ color: 'var(--muted)' }}>
                  #{idx + 1}
                </span>
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: isSelected ? 'var(--accent)' : 'var(--text)' }}
                >
                  {sub.title}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="mono text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
                  {sub.lang}
                </span>
                <span className="mono text-xs" style={{ color: 'var(--muted)' }}>
                  {timeAgo(Number(sub.timestamp))}
                </span>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
