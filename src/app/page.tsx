'use client'

import { useState, useCallback } from 'react'
import { ProfileCard }  from '@/components/ProfileCard'
import { SkeletonCard } from '@/components/SkeletonCard'
import { ErrorCard }    from '@/components/ErrorCard'
import { ProfileResult } from '@/types/leetcode'
import { extractUsername } from '@/lib/utils'

const PLACEHOLDER = `https://leetcode.com/u/neal_wu/\nhttps://leetcode.com/u/tourist/\nlee215`

export default function Home() {
  const [input,     setInput]     = useState('')
  const [results,   setResults]   = useState<ProfileResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchProfile = useCallback(async (url: string): Promise<ProfileResult> => {
    const username = extractUsername(url)
    if (!username) return { username: url, url, error: 'Invalid URL or username', loading: false }

    try {
      const res  = await fetch('/api/leetcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      const json = await res.json()
      if (!res.ok || json.error) return { username, url, error: json.error || 'Failed to fetch', loading: false }
      return { username, url, data: json, loading: false }
    } catch {
      return { username, url, error: 'Network error', loading: false }
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    const lines = input.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) return

    // Deduplicate
    const seen = new Set<string>()
    const unique = lines.filter(line => {
      const key = (extractUsername(line) || line).toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    setResults(unique.map(url => ({ username: extractUsername(url) || url, url, loading: true })))
    setIsLoading(true)

    const fetched = await Promise.all(unique.map(url => fetchProfile(url)))
    setResults(fetched)
    setIsLoading(false)
  }, [input, fetchProfile])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit()
  }

  const loadingCount = results.filter(r =>  r.loading).length
  const successCount = results.filter(r => !r.loading && r.data).length
  const errorCount   = results.filter(r => !r.loading && r.error).length

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 pt-16 pb-10">

        {/* Hero */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 mono text-xs px-3 py-1.5 rounded-full mb-6"
            style={{ background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.2)', color: 'var(--accent)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            LeetCode Profile Analyzer
          </div>

          <h1 className="text-5xl font-extrabold mb-4 leading-tight" style={{ letterSpacing: '-0.02em' }}>
            <span style={{ color: 'var(--text)' }}>Decode any </span>
            <span style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              LeetCode
            </span>
            <span style={{ color: 'var(--text)' }}> profile</span>
          </h1>

          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--muted)' }}>
            Paste one or more LeetCode profile URLs or usernames to fetch and compare stats side by side.
          </p>
        </div>

        {/* Input */}
        <div
          className="max-w-2xl mx-auto rounded-2xl p-1 mb-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <textarea
            className="w-full bg-transparent p-4 text-sm resize-none mono"
            style={{ color: 'var(--text)', minHeight: 120, caretColor: 'var(--accent)' }}
            placeholder={PLACEHOLDER}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
          />
          <div className="flex items-center justify-between px-4 pb-3">
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              One URL or username per line · Ctrl+Enter to fetch
            </span>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
              className="mono text-sm font-bold px-5 py-2 rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: isLoading ? 'var(--surface2)' : 'linear-gradient(135deg, var(--accent), var(--accent2))',
                color: isLoading ? 'var(--muted)' : '#0a0a0f',
              }}
            >
              {isLoading ? '...' : 'Fetch →'}
            </button>
          </div>
        </div>

        {/* Status bar */}
        {results.length > 0 && (
          <div className="max-w-2xl mx-auto flex items-center gap-4 mb-8 px-1">
            <span className="mono text-xs" style={{ color: 'var(--muted)' }}>
              {results.length} profile{results.length > 1 ? 's' : ''}
            </span>
            {loadingCount > 0 && <span className="mono text-xs" style={{ color: 'var(--accent)' }}>⏳ {loadingCount} loading</span>}
            {successCount > 0 && <span className="mono text-xs" style={{ color: 'var(--easy)'   }}>✓ {successCount} loaded</span>}
            {errorCount   > 0 && <span className="mono text-xs" style={{ color: 'var(--hard)'   }}>✕ {errorCount} failed</span>}
          </div>
        )}

        {/* Cards grid */}
        {results.length > 0 && (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
            {results.map((result, i) =>
              result.loading  ? <SkeletonCard key={`${result.username}-${i}`} /> :
              result.error    ? <ErrorCard    key={`${result.username}-${i}`} username={result.username} error={result.error} /> :
              result.data     ? <ProfileCard  key={`${result.username}-${i}`} username={result.username} data={result.data} index={i} /> :
              null
            )}
          </div>
        )}

        {/* Empty state */}
        {results.length === 0 && (
          <div className="max-w-2xl mx-auto mt-8 text-center">
            <div
              className="inline-flex flex-col items-center gap-3 p-8 rounded-2xl"
              style={{ border: '1px dashed var(--border)' }}
            >
              <div className="text-4xl">{'</>'}</div>
              <div className="font-semibold" style={{ color: 'var(--muted)' }}>Paste URLs above to get started</div>
              <div className="text-xs mono" style={{ color: 'var(--border)' }}>
                Supports leetcode.com/u/username or plain usernames
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-8 mt-8">
        <span className="mono text-xs" style={{ color: 'var(--border)' }}>
          Data fetched live from LeetCode&apos;s GraphQL API
        </span>
      </div>
    </main>
  )
}
