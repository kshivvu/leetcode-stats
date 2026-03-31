'use client'

import { useState, useEffect } from 'react'
import { LeetCodeData, Submission, InterviewConfig } from '@/types/leetcode'

interface InterviewConfigProps {
  username: string
  data: LeetCodeData
  studentName?: string
  submissions: Submission[]
  onStart: (config: InterviewConfig) => void
}

const TOPICS = [
  'Arrays', 'Strings', 'Hash Table', 'Dynamic Programming', 'Math',
  'Sorting', 'Greedy', 'DFS', 'BFS', 'Binary Search', 'Two Pointers',
  'Sliding Window', 'Trees', 'Graphs', 'Heap', 'Backtracking', 'Stack',
  'Linked List', 'Trie', 'Union Find',
]

const STORAGE_KEY = (u: string) => `interview-config:${u}`

export function InterviewConfigPanel({
  username, data, submissions, onStart,
}: InterviewConfigProps) {
  const [difficulty,     setDifficulty]     = useState<'Easy' | 'Medium' | 'Hard' | 'Mixed'>('Medium')
  const [mode,           setMode]           = useState<'submitted-code' | 'custom-topics'>('submitted-code')
  const [selectedSubs,   setSelectedSubs]   = useState<string[]>(submissions.map(s => s.id))
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['Arrays', 'Dynamic Programming'])
  const [numQuestions,   setNumQuestions]   = useState(5)
  const [style,          setStyle]          = useState<'conversational' | 'strict'>('conversational')
  const [validError,     setValidError]     = useState('')

  // Restore from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY(username))
      if (saved) {
        const c = JSON.parse(saved) as InterviewConfig
        setDifficulty(c.difficulty as InterviewConfigProps['onStart'] extends (c: InterviewConfig) => void ? InterviewConfig['difficulty'] : never ?? 'Medium')
        setMode(c.mode)
        setSelectedSubs(c.selectedSubmissionIds)
        setSelectedTopics(c.topics)
        setNumQuestions(c.numQuestions)
        setStyle(c.style)
      }
    } catch { /* ignore */ }
  }, [username])

  // Persist on every change
  useEffect(() => {
    const cfg: InterviewConfig = {
      difficulty: difficulty as 'Easy' | 'Medium' | 'Hard' | 'Mixed',
      mode, selectedSubmissionIds: selectedSubs,
      topics: selectedTopics, numQuestions,
      style,
    }
    sessionStorage.setItem(STORAGE_KEY(username), JSON.stringify(cfg))
  }, [username, difficulty, mode, selectedSubs, selectedTopics, numQuestions, style])

  const toggleSub = (id: string) =>
    setSelectedSubs(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  const toggleTopic = (t: string) =>
    setSelectedTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const handleStart = () => {
    if (mode === 'custom-topics' && selectedTopics.length === 0) {
      setValidError('Select at least one topic.')
      return
    }
    if (mode === 'submitted-code' && selectedSubs.length === 0) {
      setValidError('Select at least one submission.')
      return
    }
    setValidError('')
    onStart({
      difficulty: difficulty as 'Easy' | 'Medium' | 'Hard' | 'Mixed',
      mode, selectedSubmissionIds: selectedSubs,
      topics: selectedTopics, numQuestions, style,
    })
  }

  const pill = (active: boolean) => ({
    background: active ? 'var(--accent)' : 'var(--surface2)',
    color:      active ? '#0a0a0f' : 'var(--muted)',
    border:     active ? 'none' : '1px solid var(--border)',
  })

  return (
    <div
      className="rounded-2xl border p-6 space-y-7 max-w-2xl mx-auto"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Configure Mock Interview</h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Powered by Gemini 2.5 Flash</p>
      </div>

      {/* 1. Difficulty */}
      <Section label="1. Difficulty">
        <div className="flex gap-2 flex-wrap">
          {(['Easy', 'Medium', 'Hard', 'Mixed'] as const).map(d => (
            <button key={d} onClick={() => setDifficulty(d)}
              className="px-4 py-2 rounded-xl mono text-sm font-semibold"
              style={pill(difficulty === d)}>
              {d}
            </button>
          ))}
        </div>
      </Section>

      {/* 2. Mode */}
      <Section label="2. Based on">
        <div
          className="inline-flex rounded-xl p-1"
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
        >
          {(['submitted-code', 'custom-topics'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className="px-4 py-2 rounded-lg mono text-sm font-semibold transition-all"
              style={pill(mode === m)}>
              {m === 'submitted-code' ? '● Submitted Code' : '○ Custom Topics'}
            </button>
          ))}
        </div>

        {mode === 'submitted-code' ? (
          <div className="mt-3 space-y-1.5">
            <div className="flex gap-3 mb-2">
              <button onClick={() => setSelectedSubs(submissions.map(s => s.id))}
                className="text-xs mono" style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Select All
              </button>
              <button onClick={() => setSelectedSubs([])}
                className="text-xs mono" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Clear All
              </button>
            </div>
            {submissions.map(sub => (
              <label
                key={sub.id}
                className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
              >
                <input
                  type="checkbox"
                  checked={selectedSubs.includes(sub.id)}
                  onChange={() => toggleSub(sub.id)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span className="text-sm flex-1" style={{ color: 'var(--text)' }}>{sub.title}</span>
                <span className="mono text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--surface)', color: 'var(--muted)' }}>
                  {sub.lang}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {TOPICS.map(t => (
              <button key={t} onClick={() => toggleTopic(t)}
                className="px-3 py-1.5 rounded-xl mono text-xs font-semibold"
                style={pill(selectedTopics.includes(t))}>
                {t}
              </button>
            ))}
          </div>
        )}
      </Section>

      {/* 3. Number of questions */}
      <Section label="3. Number of Questions">
        <div className="flex gap-2">
          {[3, 5, 7, 10].map(n => (
            <button key={n} onClick={() => setNumQuestions(n)}
              className="px-4 py-2 rounded-xl mono text-sm font-semibold"
              style={pill(numQuestions === n)}>
              {n}
            </button>
          ))}
        </div>
      </Section>

      {/* 4. Style */}
      <Section label="4. Style">
        <div
          className="inline-flex rounded-xl p-1"
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
        >
          {(['conversational', 'strict'] as const).map(s => (
            <button key={s} onClick={() => setStyle(s)}
              className="px-4 py-2 rounded-lg mono text-sm font-semibold transition-all"
              style={pill(style === s)}>
              {s === 'conversational' ? '● Conversational' : '○ Strict'}
            </button>
          ))}
        </div>
      </Section>

      {validError && <p className="text-sm mono" style={{ color: 'var(--hard)' }}>{validError}</p>}

      <button
        onClick={handleStart}
        className="w-full py-3 rounded-xl font-bold mono text-sm"
        style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#0a0a0f' }}
      >
        Start Interview →
      </button>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold mono mb-3" style={{ color: 'var(--muted)' }}>{label}</div>
      {children}
    </div>
  )
}
