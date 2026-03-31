'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { LeetCodeData, StudentInfo } from '@/types/leetcode'
import { ProfileHeader }  from '@/components/profile/ProfileHeader'
import { StatsGrid }      from '@/components/profile/StatsGrid'
import { ScorecardPanel } from '@/components/profile/ScorecardPanel'
import { AIChat }         from '@/components/profile/AIChat'
import { SkeletonCard }   from '@/components/SkeletonCard'

export default function ProfilePage() {
  const params   = useParams()
  const router   = useRouter()
  const username = params.username as string

  const [data,    setData]    = useState<LeetCodeData | null>(null)
  const [student, setStudent] = useState<StudentInfo | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    const cached = sessionStorage.getItem(`profile:${username}`)
    const stu    = sessionStorage.getItem(`student:${username}`)
    if (stu) setStudent(JSON.parse(stu))

    if (cached) {
      setData(JSON.parse(cached))
    } else {
      fetch('/api/leetcode', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username }),
      })
        .then(r => r.json())
        .then(json => {
          if (json.error) { setError(json.error); return }
          sessionStorage.setItem(`profile:${username}`, JSON.stringify(json))
          setData(json)
        })
        .catch(() => setError('Failed to fetch profile'))
    }
  }, [username])

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ color: 'var(--hard)' }}>
        <div className="text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <p>{error}</p>
          <Link href="/" className="mono text-sm mt-4 inline-block" style={{ color: 'var(--accent)' }}>← Back Home</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Sticky nav */}
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <Link
          href="/"
          className="mono text-sm flex items-center gap-2 hover:opacity-80 transition-opacity"
          style={{ color: 'var(--muted)' }}
        >
          ← Home
        </Link>
        <button
          onClick={() => router.push(`/profile/${username}/mock`)}
          className="mono text-sm px-4 py-2 rounded-xl font-bold transition-all"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#0a0a0f' }}
        >
          🎤 Mock Interview →
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {!data ? (
          <SkeletonCard />
        ) : (
          <>
            <ProfileHeader username={username} data={data} student={student} />
            <ScorecardPanel username={username} data={data} studentName={student?.name} />
            <StatsGrid data={data} />
            <AIChat username={username} data={data} studentName={student?.name} />

            {/* Bottom action row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-8">
              <button
                onClick={() => router.push(`/profile/${username}/submissions`)}
                className="py-4 rounded-2xl font-bold mono text-sm border transition-all hover:opacity-80"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                📄 View Submissions →
              </button>
              <button
                onClick={() => router.push(`/profile/${username}/mock`)}
                className="py-4 rounded-2xl font-bold mono text-sm"
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#0a0a0f' }}
              >
                🎤 Start Mock Interview →
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
