'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LeetCodeData, StudentInfo, Submission, SubmissionDetails, InterviewConfig, Message } from '@/types/leetcode'
import { lcFetch }                  from '@/lib/lc-fetch'
import { InterviewConfigPanel }     from '@/components/mock/InterviewConfig'
import { InterviewSession }         from '@/components/mock/InterviewSession'
import { InterviewSummary }         from '@/components/mock/InterviewSummary'
import { SessionCookieModal }       from '@/components/profile/SessionCookieModal'

type Phase = 'config' | 'loading-code' | 'session' | 'summary'

export default function MockClient() {
  const params      = useParams()
  const searchParams = useSearchParams()
  const username    = params.username as string
  const fromSlug    = searchParams.get('from')

  const [data,              setData]              = useState<LeetCodeData | null>(null)
  const [student,           setStudent]           = useState<StudentInfo | null>(null)
  const [phase,             setPhase]             = useState<Phase>('config')
  const [config,            setConfig]            = useState<InterviewConfig | null>(null)
  const [submissions,       setSubmissions]       = useState<Submission[]>([])
  const [subDetails,        setSubDetails]        = useState<SubmissionDetails[]>([])
  const [loadProgress,      setLoadProgress]      = useState({ current: 0, total: 0 })
  const [conversationHistory, setConversationHistory] = useState<Message[]>([])
  const [showCookieModal,   setShowCookieModal]   = useState(false)
  const [cookieReason,      setCookieReason]      = useState<'missing' | 'expired'>('missing')

  useEffect(() => {
    const cached = sessionStorage.getItem(`profile:${username}`)
    const stu    = sessionStorage.getItem(`student:${username}`)
    if (cached) setData(JSON.parse(cached))
    if (stu)    setStudent(JSON.parse(stu))

    // Load submissions
    const load = async () => {
      const res  = await lcFetch('/api/submissions', { username })
      const json = await res.json()
      if (!res.ok || json.error) {
        const code = json.error
        if (code === 'SESSION_MISSING') { setCookieReason('missing'); setShowCookieModal(true); return }
        if (code === 'SESSION_EXPIRED') { setCookieReason('expired'); setShowCookieModal(true); return }
        return
      }
      const subs: Submission[] = json.recentAcSubmissionList ?? []
      setSubmissions(subs)
    }
    load()
  }, [username])

  const fetchSubmissionCode = useCallback(async (ids: string[]) => {
    setLoadProgress({ current: 0, total: ids.length })
    const results: SubmissionDetails[] = []

    for (let i = 0; i < ids.length; i++) {
      const res  = await lcFetch('/api/submission-details', { submissionId: ids[i] })
      const json = await res.json()
      if (!json.codeUnavailable && !json.error) {
        results.push(json as SubmissionDetails)
      }
      setLoadProgress({ current: i + 1, total: ids.length })
    }

    setSubDetails(results)
    setPhase('session')
  }, [])

  const phaseLabel: Record<Phase, string> = {
    'config':       'Setup',
    'loading-code': 'Loading',
    'session':      'Interview',
    'summary':      'Results',
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <Link
          href={`/profile/${username}`}
          className="mono text-sm flex items-center gap-2 hover:opacity-80 transition-opacity"
          style={{ color: 'var(--muted)' }}
        >
          ← Profile
        </Link>
        {/* Phase indicator */}
        <div className="flex items-center gap-2">
          {(['config', 'session', 'summary'] as const).map((p, i) => (
            <div key={p} className="flex items-center gap-2">
              <span
                className="mono text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: phase === p ? 'var(--accent)' : 'var(--surface2)',
                  color:      phase === p ? '#0a0a0f' : 'var(--muted)',
                }}
              >
                {phaseLabel[p]}
              </span>
              {i < 2 && <span style={{ color: 'var(--border)' }}>→</span>}
            </div>
          ))}
        </div>
      </nav>

      <div className="flex-1 px-4 py-8">
        {/* Config */}
        {phase === 'config' && data && (
          <InterviewConfigPanel
            username={username}
            data={data}
            studentName={student?.name}
            submissions={submissions}
            onStart={cfg => {
              setConfig(cfg)
              if (cfg.mode === 'submitted-code') {
                setPhase('loading-code')
                fetchSubmissionCode(cfg.selectedSubmissionIds)
              } else {
                setPhase('session')
              }
            }}
          />
        )}

        {/* Loading code */}
        {phase === 'loading-code' && (
          <div className="flex flex-col items-center justify-center gap-5 py-20">
            <div className="font-semibold" style={{ color: 'var(--text)' }}>
              Fetching submission code…
            </div>
            <div className="mono text-sm" style={{ color: 'var(--muted)' }}>
              {loadProgress.current} / {loadProgress.total}
            </div>
            <div
              className="w-64 h-2 rounded-full overflow-hidden"
              style={{ background: 'var(--surface2)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: loadProgress.total > 0 ? `${(loadProgress.current / loadProgress.total) * 100}%` : '0%',
                  background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
                }}
              />
            </div>
          </div>
        )}

        {/* Session */}
        {phase === 'session' && data && config && (
          <InterviewSession
            username={username}
            data={data}
            studentName={student?.name}
            config={config}
            submissionDetails={subDetails}
            onEnd={history => { setConversationHistory(history); setPhase('summary') }}
          />
        )}

        {/* Summary */}
        {phase === 'summary' && data && (
          <InterviewSummary
            username={username}
            data={data}
            studentName={student?.name}
            conversationHistory={conversationHistory}
            onNewInterview={() => setPhase('config')}
          />
        )}
      </div>

      {/* Cookie modal */}
      {showCookieModal && (
        <SessionCookieModal
          reason={cookieReason}
          onSaved={() => setShowCookieModal(false)}
        />
      )}
    </main>
  )
}
