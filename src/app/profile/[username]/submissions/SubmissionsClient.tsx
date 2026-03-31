'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { LeetCodeData, StudentInfo, Submission } from '@/types/leetcode'
import { SubmissionList }    from '@/components/submissions/SubmissionList'
import { CodeViewer }        from '@/components/submissions/CodeViewer'
import { SessionCookieModal } from '@/components/profile/SessionCookieModal'

export default function SubmissionsClient() {
  const params   = useParams()
  const router   = useRouter()
  const username = params.username as string

  const [data,               setData]               = useState<LeetCodeData | null>(null)
  const [student,            setStudent]            = useState<StudentInfo | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showCookieModal,    setShowCookieModal]    = useState(false)
  const [cookieModalReason,  setCookieModalReason]  = useState<'missing' | 'expired'>('missing')

  useEffect(() => {
    const cached = sessionStorage.getItem(`profile:${username}`)
    const stu    = sessionStorage.getItem(`student:${username}`)
    if (cached) setData(JSON.parse(cached))
    if (stu)    setStudent(JSON.parse(stu))
  }, [username])

  const handleSessionError = (reason: 'missing' | 'expired') => {
    setCookieModalReason(reason)
    setShowCookieModal(true)
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
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: 'var(--text)' }}>
            {student?.name && <span className="font-semibold">{student.name} · </span>}
            <span className="mono" style={{ color: 'var(--accent)' }}>@{username}</span>
          </span>
          <button
            onClick={() => router.push(`/profile/${username}/mock`)}
            className="mono text-sm px-4 py-2 rounded-xl font-bold"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#0a0a0f' }}
          >
            🎤 Mock Interview →
          </button>
        </div>
      </nav>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left panel */}
        <div
          className="lg:w-[40%] p-6 border-r overflow-y-auto"
          style={{ borderColor: 'var(--border)', minWidth: 0 }}
        >
          <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>
            Last 20 Submissions
          </h2>
          <SubmissionList
            username={username}
            onSelect={setSelectedSubmission}
            selectedId={selectedSubmission?.id ?? null}
            onSessionError={handleSessionError}
          />
        </div>

        {/* Right panel */}
        <div className="flex-1 overflow-hidden" style={{ minHeight: 400 }}>
          {!selectedSubmission ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8" style={{ color: 'var(--muted)' }}>
              <div className="text-5xl">📄</div>
              <p className="text-center text-sm">Click a submission to view code and analysis</p>
            </div>
          ) : data ? (
            <CodeViewer
              submission={selectedSubmission}
              username={username}
              data={data}
              studentName={student?.name}
              onSessionError={handleSessionError}
            />
          ) : null}
        </div>
      </div>

      {/* Cookie modal */}
      {showCookieModal && (
        <SessionCookieModal
          reason={cookieModalReason}
          onSaved={() => setShowCookieModal(false)}
        />
      )}
    </main>
  )
}
