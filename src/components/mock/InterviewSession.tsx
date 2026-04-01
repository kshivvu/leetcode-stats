'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import hljs from 'highlight.js/lib/core'
import python from 'highlight.js/lib/languages/python'
import cpp from 'highlight.js/lib/languages/cpp'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import { LeetCodeData, InterviewConfig, SubmissionDetails, Message } from '@/types/leetcode'
import { Markdown } from '@/components/Markdown'

hljs.registerLanguage('python',  python)
hljs.registerLanguage('python3', python)
hljs.registerLanguage('cpp',     cpp)
hljs.registerLanguage('c',       cpp)
hljs.registerLanguage('java',    java)
hljs.registerLanguage('javascript', javascript)

interface InterviewSessionProps {
  username: string
  data: LeetCodeData
  studentName?: string
  config: InterviewConfig
  submissionDetails: SubmissionDetails[]
  onEnd: (history: Message[]) => void
}

const SESSION_KEY = (u: string) => `interview-session:${u}`

export function InterviewSession({
  username, data, studentName, config, submissionDetails, onEnd,
}: InterviewSessionProps) {
  const [history,      setHistory]      = useState<Message[]>([])
  const [qCount,       setQCount]       = useState(0)
  const [subIdx,       setSubIdx]       = useState(0)
  const [isStreaming,  setIsStreaming]  = useState(false)
  const [userInput,    setUserInput]    = useState('')
  const [showCode,     setShowCode]     = useState(true)
  const [phase,        setPhase]        = useState<'resume-prompt' | 'active' | 'ending'>('active')
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({})

  const bottomRef = useRef<HTMLDivElement>(null)

  // Build context string from submission details with ID prefix
  const submissionsContext = submissionDetails
    .map((d, i) => `[CODE_ID: ${i}] Problem: ${d.question?.title ?? '?'}\nCode (${d.lang?.name}):\n${d.code ?? '[unavailable]'}`)
    .join('\n\n---\n\n')

  // beforeunload guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (history.length > 0 && phase !== 'ending') {
        e.preventDefault(); e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [history, phase])

  const savedSessionRef = useRef<{ conversationHistory: Message[]; questionCount: number; currentSubIndex: number; revealed?: Record<number, boolean> } | null>(null)

  // Check for saved session
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY(username))
      if (saved) {
        const { conversationHistory, questionCount, currentSubIndex, revealed } = JSON.parse(saved)
        if (conversationHistory?.length > 0) {
          setPhase('resume-prompt')
          savedSessionRef.current = { conversationHistory, questionCount, currentSubIndex, revealed }
        }
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  const persistSession = useCallback((h: Message[], qc: number, si: number, rev: Record<number, boolean>) => {
    sessionStorage.setItem(SESSION_KEY(username), JSON.stringify({
      conversationHistory: h, questionCount: qc, currentSubIndex: si, revealed: rev,
    }))
  }, [username])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const callAI = useCallback(async (msgs: Message[]) => {
    setIsStreaming(true)
    const assistantMsg: Message = { role: 'assistant', content: '' }
    setHistory(prev => [...prev, assistantMsg])

    try {
      const response = await fetch('/api/ai/interview-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username, data, studentName, submissionsContext, config,
          conversationHistory: msgs,
        }),
      })

      if (!response.ok) { setIsStreaming(false); return }

      const reader  = response.body!.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      let hasParsedRef = false
      let currentSubIdx = subIdx

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        fullContent += chunk

        // Logic to parse ### REFERENCED CODE: [ID] and switch subIdx
        if (!hasParsedRef) {
          // Robust regex to find the ID even if AI adds brackets or "CODE_ID:" prefix
          const match = fullContent.match(/### REFERENCED CODE[:\s]*?(?:None|[^0-9\n]*(\d+))/i)
          if (match) {
            hasParsedRef = true
            if (match[1] !== undefined) {
              const idx = parseInt(match[1])
              if (!isNaN(idx) && idx >= 0 && idx < submissionDetails.length) {
                setSubIdx(idx)
                currentSubIdx = idx
              }
            }
          }
        }

        setHistory(prev => {
          const next = [...prev]
          next[next.length - 1] = { ...next[next.length - 1], content: fullContent }
          return next
        })
      }

      setHistory(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: fullContent }
        const newQ = qCount + 1
        setQCount(newQ)
        persistSession(next, newQ, currentSubIdx, revealedAnswers)
        return next
      })
    } finally {
      setIsStreaming(false)
    }
  }, [username, data, studentName, submissionsContext, config, qCount, subIdx, revealedAnswers, persistSession, submissionDetails])

  // Start interview on mount
  useEffect(() => {
    if (phase === 'active' && history.length === 0) {
      callAI([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const handleResume = () => {
    if (savedSessionRef.current) {
      const { conversationHistory, questionCount, currentSubIndex, revealed } = savedSessionRef.current
      setHistory(conversationHistory)
      setQCount(questionCount)
      setSubIdx(currentSubIndex)
      setRevealedAnswers(revealed || {})
    }
    setPhase('active')
  }

  const handleFresh = () => {
    sessionStorage.removeItem(SESSION_KEY(username))
    savedSessionRef.current = null
    setPhase('active')
  }

  const handleSubmit = async () => {
    if (!userInput.trim() || isStreaming) return
    const msg: Message = { role: 'user', content: userInput }
    const nextHistory = [...history, msg]
    setHistory(nextHistory)
    setUserInput('')
    await callAI(nextHistory)
  }

  const handleRate = (index: number, rating: Message['rating']) => {
    if (!rating) return
    setHistory(prev => {
      const next = [...prev]
      next[index] = { ...next[index], rating }
      
      // Auto-trigger next question on rating
      const msg: Message = { role: 'user', content: `Student performance on previous question: ${rating.toUpperCase()}. Please suggest the next question.` }
      const finalHistory = [...next, msg]
      setHistory(finalHistory) // Update again with the quiet message
      persistSession(finalHistory, qCount, subIdx, revealedAnswers)
      callAI(finalHistory) // Fire the API
      
      return finalHistory
    })
  }

  const toggleAnswer = (index: number) => {
    setRevealedAnswers(prev => {
      const next = { ...prev, [index]: !prev[index] }
      persistSession(history, qCount, subIdx, next)
      return next
    })
  }

  const handleEnd = () => {
    if (!confirm('End interview now and see results?')) return
    setPhase('ending')
    // Build final history including explicit ratings for the summary prompt
    const finalHistory: Message[] = history.map(m => {
      if (m.role === 'assistant' && m.rating) {
        return { ...m, content: `${m.content}\n\n[INTERVIEWER RATING: ${m.rating.toUpperCase()}]` }
      }
      return m
    })
    finalHistory.push({ role: 'user', content: 'GENERATE_SUMMARY_NOW' })
    
    sessionStorage.removeItem(SESSION_KEY(username))
    onEnd(finalHistory)
  }

  const currentSub = submissionDetails[subIdx]
  const highlighted = currentSub?.code
    ? hljs.highlightAuto(currentSub.code, [currentSub.lang?.name ?? 'python']).value
    : null

  // Resume prompt screen
  if (phase === 'resume-prompt') {
    const saved = savedSessionRef.current
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-5">
        <div className="text-center">
          <p className="font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>Resume Previous Interview?</p>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Q{saved?.questionCount ?? 0} of {config.numQuestions} answered
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleResume}
            className="px-5 py-2 rounded-xl mono font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#0a0a0f' }}>
            Resume →
          </button>
          <button onClick={handleFresh}
            className="px-5 py-2 rounded-xl mono text-sm"
            style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
            Start Fresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full min-h-screen-60">
      {/* LEFT — Code Reference */}
      {config.mode === 'submitted-code' && submissionDetails.length > 0 && (
        <div
          className="lg:w-[45%] rounded-2xl border overflow-hidden flex flex-col"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Code Reference</span>
            <button
              onClick={() => setShowCode(s => !s)}
              className="mono text-xs" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {showCode ? '👁 Hide' : '👁 Show'}
            </button>
          </div>

          {/* Submission switcher */}
          {submissionDetails.length > 1 && (
            <div
              className="flex items-center justify-between px-4 py-2 border-b"
              style={{ borderColor: 'var(--border)', background: 'var(--surface2)' }}
            >
              <button onClick={() => setSubIdx(i => Math.max(0, i - 1))}
                disabled={subIdx === 0} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', opacity: subIdx === 0 ? 0.3 : 1 }}>←</button>
              <span className="text-xs mono flex-1 text-center" style={{ color: 'var(--text)' }}>
                {currentSub?.question?.title ?? `Submission ${subIdx + 1}`}
              </span>
              <button onClick={() => setSubIdx(i => Math.min(submissionDetails.length - 1, i + 1))}
                disabled={subIdx === submissionDetails.length - 1} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', opacity: subIdx === submissionDetails.length - 1 ? 0.3 : 1 }}>→</button>
            </div>
          )}

          {showCode && (
            <div className="flex-1 overflow-y-auto">
              {highlighted ? (
                <pre className="p-4 text-xs overflow-x-auto m-0" style={{ background: '#0d0d14' }}>
                  <code className="hljs" dangerouslySetInnerHTML={{ __html: highlighted }} />
                </pre>
              ) : (
                <div className="p-4 text-sm" style={{ color: 'var(--muted)' }}>
                  {currentSub?.question?.title ?? 'Code unavailable'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* RIGHT — Interview Panel */}
      <div className="flex-1 flex flex-col rounded-2xl border overflow-hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        {/* Progress */}
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="mono text-xs" style={{ color: 'var(--muted)' }}>
                Question {Math.min(qCount, config.numQuestions)} / {config.numQuestions}
              </span>
              <span className="text-[10px] uppercase font-bold py-0.5 px-2 rounded bg-accent/10 text-accent">Helper Mode</span>
            </div>
            {qCount >= config.numQuestions && (
              <span className="mono text-[10px] animate-pulse" style={{ color: 'var(--accent)' }}>
                ✓ QUESTIONS COMPLETE
              </span>
            )}
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((qCount / config.numQuestions) * 100, 100)}%`,
                background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
              }}
            />
          </div>
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6" style={{ maxHeight: 600 }}>
          {history.map((msg, i) => {
            const isLastAssistant = msg.role === 'assistant' && i === history.length - 1;
            const content = msg.content;
            
            // Logic to split the internal tags, question and hidden answer
            let visibleContent = content;
            let hiddenContent = '';

            const refHeader = '### REFERENCED CODE';
            const answerHeader = '### EXPECTED ANSWER';
            
            // Cleanly remove internal tags from visible text using regex
            // This removes the header AND the value (ID or None) until the next double newline or header
            visibleContent = visibleContent
              .replace(/### REFERENCED CODE[\s\S]*?(?=### SUGGESTED QUESTION|$)/i, '')
              .replace(/### EXPECTED ANSWER[\s\S]*?(?=### EVALUATION CRITERIA|$)/i, '');

            // Also extract expected answer for the hidden toggle
            if (content.includes(answerHeader)) {
              const parts = content.split(answerHeader);
              if (parts[1]) {
                const answerParts = parts[1].split('### EVALUATION CRITERIA');
                hiddenContent = answerParts[0].trim();
              }
            }

            visibleContent = visibleContent.trim();

            return (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className="max-w-[95%] px-5 py-4 rounded-2xl text-sm"
                  style={{
                    background: msg.role === 'user' ? 'rgba(240,180,41,0.08)' : 'var(--surface2)',
                    color: 'var(--text)',
                    border: `1px solid ${msg.role === 'user' ? 'rgba(240,180,41,0.2)' : 'var(--border)'}`,
                    lineHeight: 1.6,
                  }}
                >
                  {msg.role === 'user' ? (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
                  ) : (
                    <>
                      <Markdown content={visibleContent} />
                      
                      {hiddenContent && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <button
                            onClick={() => toggleAnswer(i)}
                            className="mono text-[10px] font-bold px-3 py-1.5 rounded bg-surface border border-border hover:text-accent transition-colors mb-2"
                          >
                            {revealedAnswers[i] ? 'Hide Expected Answer' : 'Show Expected Answer'}
                          </button>
                          {revealedAnswers[i] && (
                            <div className="mt-2 text-easy text-sm bg-easy/5 p-3 rounded-lg">
                              <div className="font-bold text-[10px] mb-1 opacity-60 uppercase tracking-wider">Solution Logic</div>
                              <Markdown content={hiddenContent} />
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {isStreaming && isLastAssistant && (
                    <span
                      style={{
                        display: 'inline-block', width: 2, height: '0.9em',
                        background: 'var(--accent)', marginLeft: 2,
                        verticalAlign: 'text-bottom',
                        animation: 'blink 1s step-end infinite',
                      }}
                    />
                  )}
                </div>

                {/* Rating Controls - Only for assistant messages with questions */}
                {msg.role === 'assistant' && !isStreaming && content.includes('QUESTION') && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 px-1">
                    <span className="text-[10px] font-bold uppercase opacity-40 mr-1">Rate student answer:</span>
                    <RatingBtn active={msg.rating === 'bad'} color="#ff375f" onClick={() => handleRate(i, 'bad')}>🔴 Bad</RatingBtn>
                    <RatingBtn active={msg.rating === 'average'} color="#ffc01e" onClick={() => handleRate(i, 'average')}>🟠 Avg</RatingBtn>
                    <RatingBtn active={msg.rating === 'good'} color="#00b8a9" onClick={() => handleRate(i, 'good')}>🟢 Good</RatingBtn>
                    <RatingBtn active={msg.rating === 'perfect'} color="#f0b429" onClick={() => handleRate(i, 'perfect')}>🌟 Perfect</RatingBtn>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Controls */}
        <div className="p-4 border-t space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div className="flex gap-2 items-end">
            <textarea
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
              disabled={isStreaming}
              placeholder="Paste student's answer or your specific observation for evaluation…"
              rows={2}
              className="flex-1 rounded-xl px-4 py-3 text-sm mono resize-none"
              style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                color: 'var(--text)', outline: 'none',
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={isStreaming || !userInput.trim()}
              className="px-4 py-3 rounded-xl font-bold mono text-sm disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#0a0a0f' }}
            >
              →
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setUserInput("Student is struggling to understand. Give a nudge/hint for me to tell them.")}
              className="flex-1 py-1.5 rounded-lg mono text-[10px] font-bold border border-border bg-surface hover:border-accent transition-colors"
            >
              Request Hint
            </button>
            <button
              onClick={handleEnd}
              className="flex-1 py-1.5 rounded-lg mono text-[10px] font-bold border border-hard/20 bg-hard/5 text-hard hover:bg-hard/10 transition-colors"
            >
              Complete Interview
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .hljs { color: #abb2bf; }
        .hljs-keyword,.hljs-built_in { color: #c678dd; }
        .hljs-string { color: #98c379; }
        .hljs-number { color: #d19a66; }
        .hljs-comment { color: #5c6370; }
        .hljs-function,.hljs-title { color: #61afef; }
      `}</style>
    </div>
  )
}

function RatingBtn({ children, active, color, onClick }: { children: React.ReactNode, active: boolean, color: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-[9.5px] px-2 py-1 rounded border transition-all flex items-center gap-1 font-bold ${active ? 'scale-105' : 'opacity-50 hover:opacity-100'}`}
      style={{
        background: active ? `${color}20` : 'transparent',
        borderColor: active ? color : 'var(--border)',
        color: active ? color : 'var(--text)',
      }}
    >
      {children}
    </button>
  );
}
