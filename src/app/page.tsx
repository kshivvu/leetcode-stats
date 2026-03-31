'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileCard }  from '@/components/ProfileCard'
import { SkeletonCard } from '@/components/SkeletonCard'
import { ErrorCard }    from '@/components/ErrorCard'
import { LeaderboardTable } from '@/components/LeaderboardTable'
import { ClassSummary } from '@/components/ClassSummary'
import { ProblemChecker } from '@/components/ProblemChecker'
import { SavedBatches } from '@/components/SavedBatches'
import { CSVUploader } from '@/components/CSVUploader'
import { Toast } from '@/components/Toast'
import { ProfileResult, StudentInfo } from '@/types/leetcode'
import { extractUsername } from '@/lib/utils'
import { exportToExcel } from '@/lib/exportExcel'
import { saveBatch } from '@/lib/batchStorage'

import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

const PLACEHOLDER = `https://leetcode.com/u/neal_wu/\nhttps://leetcode.com/u/tourist/\nlee215`

export default function Home() {
  const router  = useRouter()
  const [input,     setInput]     = useState('')
  const [results,   setResults]   = useState<ProfileResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [view,      setView]      = useState<'grid' | 'table'>('grid')
  
  const [batchNameInput, setBatchNameInput] = useState('')
  const [isSavingBatch, setIsSavingBatch] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)

  // Page load entrance animations
  useGSAP(() => {
    const tl = gsap.timeline()
    tl.from('.hero-badge', { y: -20, opacity: 0, duration: 0.6, ease: 'back.out(1.7)' })
      .from('.hero-title', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
      .from('.hero-desc',  { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
      .from('.input-area', { y: 30, opacity: 0, scale: 0.98, duration: 0.7, ease: 'power3.out' }, '-=0.3')
      .from('.empty-state', { opacity: 0, duration: 0.5 }, '-=0.2')
  }, { scope: containerRef })

  // Staggering cards animate-in effect whenever results change
  useGSAP(() => {
    if (results.length > 0) {
      gsap.fromTo('.profile-card, .skeleton-card', 
        { y: 50, opacity: 0, scale: 0.95 },
        { 
          y: 0, opacity: 1, scale: 1, 
          duration: 0.6, 
          ease: 'back.out(1.5)',
          stagger: 0.1 
        }
      )
    }
  }, { dependencies: [results], scope: containerRef })

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

  const handleSubmit = useCallback(async (urlsOverride?: string[], studentsOverride?: StudentInfo[]) => {
    const lines = urlsOverride || input.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) return

    // Deduplicate
    const seen = new Set<string>()
    const unique = lines.filter(line => {
      const key = (extractUsername(line) || line).toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    setResults(unique.map(url => {
      const username = extractUsername(url) || url
      const studentInfo = studentsOverride?.find(s => 
        s.leetcodeUrl.toLowerCase().includes(username.toLowerCase()) ||
        s.leetcodeUrl.toLowerCase() === url.toLowerCase()
      )
      return { username, url, loading: true, studentInfo }
    }))
    setIsLoading(true)

    const fetched = await Promise.all(unique.map(async (url) => {
      const profile = await fetchProfile(url)
      const username = extractUsername(url) || url
      const studentInfo = studentsOverride?.find(s => 
        s.leetcodeUrl.toLowerCase().includes(username.toLowerCase()) ||
        s.leetcodeUrl.toLowerCase() === url.toLowerCase()
      )
      return { ...profile, studentInfo }
    }))
    setResults(fetched)
    setIsLoading(false)
  }, [fetchProfile, input])

  const handleShare = () => {
    const usernames = results.map(r => extractUsername(r.url) || r.username).filter(Boolean)
    if (usernames.length === 0) return
    const url = new URL(window.location.href)
    url.searchParams.set('users', usernames.join(','))
    navigator.clipboard.writeText(url.toString())
    setToastMessage('Link Copied!')
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const usersQuery = searchParams.get('users')
      if (usersQuery) {
        const users = usersQuery.split(',').map(u => u.trim()).filter(Boolean)
        if (users.length > 0) {
          setInput(users.join('\n'))
          handleSubmit(users)
        }
      }
    }
    // Only run on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit()
  }

  const handleStudentsLoaded = useCallback((students: StudentInfo[]) => {
    const urls = students.map(s => s.leetcodeUrl).filter(Boolean)
    if (urls.length > 0) {
      setInput(urls.join('\n'))
      handleSubmit(urls, students)
    }
  }, [handleSubmit])

  const loadingCount = results.filter(r =>  r.loading).length
  const successCount = results.filter(r => !r.loading && r.data).length
  const errorCount   = results.filter(r => !r.loading && r.error).length

  return (
    <main className="min-h-screen relative overflow-hidden" ref={containerRef}>
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-12 relative z-10">
        
        {/* Dynamic Glow Background behind hero for extra depth */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-[var(--accent)] opacity-5 blur-[120px] rounded-full pointer-events-none" />

        {/* Hero */}
        <div className="text-center mb-16 relative">
          <div
            className="hero-badge inline-flex items-center gap-2 mono text-[10px] tracking-widest uppercase px-4 py-2 rounded-full mb-8 shadow-lg"
            style={{ background: 'var(--surface-glass)', border: '1px solid var(--border-glass)', color: 'var(--accent)', backdropFilter: 'blur(8px)' }}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse shadow-[0_0_8px_currentColor]" />
            LeetCode Insight Engine
          </div>

          <h1 className="hero-title text-5xl md:text-7xl font-extrabold mb-6 leading-tight drop-shadow-xl" style={{ letterSpacing: '-0.03em' }}>
            <span style={{ color: 'var(--text)' }}>Decode any </span>
            <span className="relative inline-block">
               <span className="relative z-10" style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                 LeetCode
               </span>
               <span className="absolute inset-0 z-0 bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] blur-2xl opacity-20 transform scale-110"></span>
            </span>
            <span style={{ color: 'var(--text)' }}> profile</span>
          </h1>

          <p className="hero-desc text-lg md:text-xl max-w-2xl mx-auto font-medium" style={{ color: 'var(--muted)' }}>
            Paste one or more LeetCode profile URLs or usernames to fetch, compare, and analyze stats in a stunning interactive grid.
          </p>
        </div>

        {/* CSV/Excel Uploader */}
        <div className="max-w-3xl mx-auto mb-4">
          <CSVUploader onStudentsLoaded={handleStudentsLoaded} />
        </div>

        {/* Input */}
        <div
          className="input-area max-w-3xl mx-auto rounded-3xl p-1.5 mb-8 shadow-2xl glass-panel relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl -z-10" />
          
          <textarea
            className="w-full bg-transparent p-5 text-base md:text-lg resize-none mono leading-relaxed"
            style={{ color: 'var(--text)', minHeight: 140, caretColor: 'var(--accent)' }}
            placeholder={PLACEHOLDER}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
          />
          <div className="flex items-center justify-between px-5 pb-4">
            <span className="text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--muted)' }}>
              One URL/username per line · Ctrl+Enter to fetch
            </span>
            <button
              onClick={() => handleSubmit()}
              disabled={isLoading || !input.trim()}
              className="mono text-sm font-extrabold uppercase tracking-wider px-8 py-3 rounded-2xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-[0_0_20px_rgba(240,180,41,0.3)]"
              style={{
                background: isLoading ? 'var(--surface2)' : 'linear-gradient(135deg, var(--accent), var(--accent2))',
                color: isLoading ? 'var(--muted)' : '#0a0a0f',
                boxShadow: isLoading ? 'none' : 'inset 0 1px 1px rgba(255,255,255,0.3)',
              }}
            >
              {isLoading ? 'Scanning...' : 'Fetch Stats →'}
            </button>
          </div>
        </div>

        {/* Saved Batches */}
        <SavedBatches onLoadBatch={(urls) => {
          setInput(urls.join('\n'))
          handleSubmit(urls)
        }} />

        {/* Status bar */}
        {results.length > 0 && (
          <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-4 mb-10 px-2">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <span className="mono text-[10px] tracking-widest uppercase font-bold px-3 py-1 rounded shadow-sm" style={{ color: 'var(--muted)', background: 'var(--surface-glass)' }}>
                {results.length} Profile{results.length > 1 ? 's' : ''}
              </span>
              {loadingCount > 0 && <span className="mono text-[10px] tracking-widest uppercase font-bold flex items-center gap-1" style={{ color: 'var(--accent)' }}><span className="animate-spin text-sm">↻</span> {loadingCount} Loading</span>}
              {successCount > 0 && <span className="mono text-[10px] tracking-widest uppercase font-bold flex items-center gap-1" style={{ color: 'var(--easy)'   }}><span className="text-sm">✓</span> {successCount} Loaded</span>}
              {errorCount   > 0 && <span className="mono text-[10px] tracking-widest uppercase font-bold flex items-center gap-1" style={{ color: 'var(--hard)'   }}><span className="text-sm">✕</span> {errorCount} Failed</span>}
            </div>
            
            <div className="flex items-center gap-3 ml-auto">
              {successCount > 0 && (
                <button
                  onClick={handleShare}
                  className="mono text-[10px] tracking-widest uppercase font-bold px-4 py-1.5 rounded flex items-center gap-2 transition-all hover:bg-white/5 active:scale-95 shadow-sm border"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  <span className="text-sm font-normal">🔗</span> Share Link
                </button>
              )}
              {successCount > 0 && (
                <button
                  onClick={() => setIsSavingBatch(!isSavingBatch)}
                  className="mono text-[10px] tracking-widest uppercase font-bold px-4 py-1.5 rounded flex items-center gap-2 transition-all hover:opacity-80 active:scale-95 shadow-sm border"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  <span className="text-sm font-normal">+</span> Save Batch
                </button>
              )}
              <div className="flex bg-[var(--surface-glass)] rounded-lg p-1 border border-[var(--border-glass)]">
                <button 
                  onClick={() => setView('grid')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors ${view === 'grid' ? 'bg-[var(--surface2)] text-[var(--accent)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
                >
                  ⊞ Cards
                </button>
                <button 
                  onClick={() => setView('table')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors ${view === 'table' ? 'bg-[var(--surface2)] text-[var(--accent)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
                >
                  ☰ Leaderboard
                </button>
              </div>
              {successCount > 0 && (
                <button
                  onClick={() => exportToExcel(results)}
                  className="mono text-[10px] tracking-widest uppercase font-bold px-4 py-1.5 rounded flex items-center gap-2 transition-all hover:opacity-80 active:scale-95 shadow-sm"
                  style={{ background: 'var(--easy)', color: 'var(--bg)' }}
                >
                  <span className="text-sm font-normal">↓</span> Export Excel
                </button>
              )}
            </div>
          </div>
        )}

        {/* Inline Save Batch Form */}
        {isSavingBatch && (
          <div className="max-w-3xl mx-auto flex items-center justify-end gap-3 mb-6 animate-fade-up px-2">
            <input 
              type="text" 
              placeholder="Batch name (e.g. CS-A 2025)"
              className="px-4 py-1.5 rounded-lg text-sm border bg-transparent outline-none focus:border-[var(--accent)] text-[var(--text)] transition-colors mono"
              style={{ borderColor: 'var(--border)' }}
              value={batchNameInput}
              onChange={(e) => setBatchNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && batchNameInput.trim()) {
                  saveBatch(batchNameInput.trim(), results.map(r => r.url || r.username))
                  setIsSavingBatch(false)
                  setBatchNameInput('')
                }
              }}
              autoFocus
            />
            <button
              onClick={() => {
                if (batchNameInput.trim()) {
                  saveBatch(batchNameInput.trim(), results.map(r => r.url || r.username))
                  setIsSavingBatch(false)
                  setBatchNameInput('')
                }
              }}
              disabled={!batchNameInput.trim()}
              className="px-4 py-1.5 rounded-lg text-sm font-bold disabled:opacity-50 tracking-wider duration-300 transition-colors"
              style={{ background: 'var(--accent)', color: 'var(--bg)' }}
            >
              Save
            </button>
          </div>
        )}

        {/* Class Summary */}
        {successCount > 0 && <ClassSummary results={results} />}

        {/* Problem Checker */}
        {successCount > 0 && <ProblemChecker results={results} />}

        {/* Results view */}
        {results.length > 0 && (
          view === 'grid' ? (
            <div className="grid gap-6 perspective-1000" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
              {results.map((result, i) =>
                result.loading  ? <div key={`${result.username}-${i}`} className="skeleton-card"><SkeletonCard /></div> :
                result.error    ? <div key={`${result.username}-${i}`} className="profile-card"><ErrorCard username={result.username} error={result.error} /></div> :
                result.data     ? (
                  <div
                    key={`${result.username}-${i}`}
                    className="profile-card cursor-pointer"
                    style={{ borderRadius: '1rem', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
                    onClick={() => {
                      sessionStorage.setItem(`profile:${result.username}`, JSON.stringify(result.data))
                      if (result.studentInfo) sessionStorage.setItem(`student:${result.username}`, JSON.stringify(result.studentInfo))
                      router.push(`/profile/${result.username}`)
                    }}
                  >
                    <ProfileCard username={result.username} data={result.data} index={i} studentInfo={result.studentInfo} />
                    <div
                      className="px-4 py-2 mono text-center text-xs"
                      style={{ borderTop: '1px solid var(--border)', color: 'var(--muted)' }}
                    >
                      Click to view full profile →
                    </div>
                  </div>
                ) :
                null
              )}
            </div>
          ) : (
            <div className="animate-fade-up">
              <LeaderboardTable results={results} />
            </div>
          )
        )}

        {/* Empty state */}
        {results.length === 0 && (
          <div className="empty-state max-w-2xl mx-auto mt-12 text-center">
            <div
              className="inline-flex flex-col items-center gap-4 p-12 rounded-3xl glass-panel shadow-none"
              style={{ border: '1px dashed var(--border-glass)' }}
            >
              <div className="text-5xl opacity-80" style={{ color: 'var(--accent)' }}>{'</>'}</div>
              <div className="font-bold text-lg" style={{ color: 'var(--muted)' }}>Ready to analyze</div>
              <div className="text-xs mono tracking-tight" style={{ color: 'var(--border)' }}>
                Supports standard leetcode.com/u/username or plain handles
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-8 mt-12 relative z-10">
        <span className="mono text-[10px] tracking-widest uppercase font-bold" style={{ color: 'var(--border)' }}>
          Data retrieved securely via LeetCode GraphQL API
        </span>
      </div>

      {/* Pop-up Toast */}
      <Toast message={toastMessage} visible={!!toastMessage} onClose={() => setToastMessage('')} />
    </main>
  )
}
