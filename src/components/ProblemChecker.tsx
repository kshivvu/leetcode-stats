'use client'

import { useState } from 'react'
import { ProfileResult } from '@/types/leetcode'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

function timeSince(unixSeconds: string) {
  const seconds = Math.floor(Date.now() / 1000 - parseInt(unixSeconds, 10))
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + " years ago"
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + " months ago"
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + " days ago"
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + " hours ago"
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + " minutes ago"
  return Math.floor(seconds) + " seconds ago"
}

export function ProblemChecker({ results }: { results: ProfileResult[] }) {
  const [input, setInput] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  
  const [checkResults, setCheckResults] = useState<{
    profile: ProfileResult;
    solved: boolean;
    timestamp?: string;
  }[] | null>(null)

  const handleCheck = async () => {
    let slug = input.trim()
    if (!slug) return
    
    // Parse problem slug: /problems\/([a-z0-9-]+)/ from the input
    const match = slug.match(/problems\/([a-z0-9-]+)/)
    if (match) {
      slug = match[1]
    } else {
      // If user pasted a URL but without 'problems/', just take last segment
      // Or if it's already a slug, keep it
      // Replace trailing slashes
      slug = slug.replace(/\/$/, '').split('/').pop() || slug
    }

    setIsChecking(true)
    const validProfiles = results.filter(r => !r.loading && r.data)
    
    const fetchPromises = validProfiles.map(async (profile) => {
      try {
        const res = await fetch('/api/recent-submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: profile.username, limit: 20 }),
        })
        const json = await res.json()
        const subs = json.recentAcSubmissionList || []
        const matchedSub = subs.find((s: any) => s.titleSlug === slug)
        
        return {
          profile,
          solved: !!matchedSub,
          timestamp: matchedSub ? matchedSub.timestamp : undefined
        }
      } catch (e) {
        return { profile, solved: false }
      }
    })

    const checked = await Promise.all(fetchPromises)
    setCheckResults(checked)
    setIsChecking(false)
  }

  useGSAP(() => {
    if (checkResults) {
      gsap.fromTo('.checker-row', 
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out' }
      )
    }
  }, { dependencies: [checkResults] })

  // Don't render anything if no valid profiles exist yet
  if (!results.some(r => !r.loading && r.data)) return null

  return (
    <div className="mb-10 w-full rounded-3xl p-6 border glass-panel" style={{ borderColor: 'var(--border-glass)' }}>
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Problem Assignment Checker</h2>
          <p className="text-xs tracking-wide" style={{ color: 'var(--muted)' }}>Check who solved a specific problem recently (last 20 accepted subs)</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-2">
          <input
            type="text"
            className="px-4 py-2 rounded-xl text-sm w-full md:w-72 border bg-transparent outline-none focus:border-[var(--accent)] transition-colors mono"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            placeholder="Problem URL or slug (e.g. two-sum)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
          />
          <button
            onClick={handleCheck}
            disabled={isChecking || !input.trim()}
            className="px-6 py-2 rounded-xl font-bold text-sm tracking-wider duration-300 disabled:opacity-50"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            {isChecking ? 'Checking...' : 'Check'}
          </button>
        </div>
      </div>

      {checkResults && (
        <div className="mt-4 border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="px-4 py-2 text-xs font-bold tracking-wider uppercase flex justify-between items-center" style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
            <span>Results ({checkResults.filter(r => r.solved).length} / {checkResults.length} solved)</span>
            <span className="opacity-70 normal-case font-normal mono">Only checks last 20 submissions</span>
          </div>
          <div className="max-h-80 overflow-y-auto custom-scrollbar" style={{ background: 'var(--surface)' }}>
            <table className="w-full text-left border-collapse text-sm">
              <thead className="sticky top-0 shadow-sm" style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
                <tr>
                  <th className="px-4 py-2 font-semibold font-xs uppercase tracking-wider">Student</th>
                  <th className="px-4 py-2 font-semibold font-xs uppercase tracking-wider">Roll No</th>
                  <th className="px-4 py-2 font-semibold font-xs uppercase tracking-wider">Solved?</th>
                  <th className="px-4 py-2 font-semibold font-xs uppercase tracking-wider">When</th>
                </tr>
              </thead>
              <tbody>
                {checkResults.map((r, i) => {
                  const user = r.profile.data!.matchedUser
                  const name = user.profile.realName || r.profile.username
                  
                  return (
                    <tr key={r.profile.username} className="border-t checker-row bg-opacity-50" style={{ borderColor: 'var(--border)', backgroundColor: r.solved ? 'rgba(0,184,169,0.05)' : 'transparent' }}>
                      <td className="px-4 py-3 font-bold" style={{ color: r.solved ? 'var(--text)' : 'var(--muted)' }}>
                        {name} <span className="mono text-xs font-normal ml-2 opacity-60">@{r.profile.username}</span>
                      </td>
                      <td className="px-4 py-3 mono text-xs opacity-60">—</td>
                      <td className="px-4 py-3">
                        {r.solved ? (
                          <span className="mono text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 shadow-sm font-bold">
                            ✅ Yes
                          </span>
                        ) : (
                          <span className="mono text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 shadow-sm">
                            ❌ Not in recent
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 mono text-xs" style={{ color: 'var(--muted)' }}>
                        {r.solved && r.timestamp ? timeSince(r.timestamp) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
