'use client'

import { useState, useRef, useEffect } from 'react'
import { LeetCodeData } from '@/types/leetcode'

interface AIChatProps {
  username: string
  data: LeetCodeData
  studentName?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

const PRESETS = [
  { label: '📊 Full Analysis',  prompt: 'Give me a complete placement readiness analysis for this student.' },
  { label: '💪 Strengths',      prompt: "What are this student's key technical strengths based on their profile?" },
  { label: '🎯 What to Improve', prompt: 'What are the most critical gaps this student needs to address for placements?' },
  { label: '🏢 Target Companies', prompt: 'Which companies should this student realistically target right now, and why?' },
  { label: '📅 30-Day Plan',    prompt: 'Give me a specific 30-day study plan for this student to improve their placement chances.' },
  { label: '⚡ vs Industry',    prompt: 'How does this student compare to the industry standard for campus placements?' },
]

import { Markdown } from '@/components/Markdown'

export function AIChat({ username, data, studentName }: AIChatProps) {
  const [messages,   setMessages]   = useState<Message[]>([])
  const [input,      setInput]      = useState('')
  const [isLoading,  setIsLoading]  = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (prompt: string) => {
    if (!prompt.trim() || isLoading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: prompt }
    const asstMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '', streaming: true }

    setMessages(prev => [...prev, userMsg, asstMsg])
    setInput('')
    setIsLoading(true)

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
      const response = await fetch('/api/ai/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, data, studentName, conversationHistory: history }),
      })

      if (!response.ok) {
        setMessages(prev => prev.map(m =>
          m.id === asstMsg.id ? { ...m, content: '⚠️ Failed to get response.', streaming: false } : m
        ))
        return
      }

      const reader  = response.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        setMessages(prev => prev.map(m =>
          m.id === asstMsg.id ? { ...m, content: m.content + chunk } : m
        ))
      }
      setMessages(prev => prev.map(m =>
        m.id === asstMsg.id ? { ...m, streaming: false } : m
      ))
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === asstMsg.id ? { ...m, content: '⚠️ Network error.', streaming: false } : m
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div
      className="rounded-2xl border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="font-bold" style={{ color: 'var(--text)' }}>Ask About This Student</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
          AI powered by Gemini 2.5 Flash
        </div>
      </div>

      {/* Preset buttons */}
      <div className="px-6 pt-4 grid grid-cols-2 gap-2">
        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => sendMessage(p.prompt)}
            disabled={isLoading}
            className="text-left text-xs px-3 py-2 rounded-xl transition-all hover:opacity-80 disabled:opacity-40"
            style={{
              background: 'var(--surface2)',
              color: 'var(--muted)',
              border: '1px solid var(--border)',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Conversation */}
      {messages.length > 0 && (
        <div
          className="mx-6 mt-4 space-y-3 overflow-y-auto"
          style={{ maxHeight: 384 }}
        >
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[85%] px-4 py-3 rounded-2xl text-sm"
                style={{
                  background: msg.role === 'user'
                    ? 'rgba(240,180,41,0.12)'
                    : 'var(--surface2)',
                  color: 'var(--text)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(240,180,41,0.2)' : 'var(--border)'}`,
                  lineHeight: 1.6,
                }}
              >
                {msg.role === 'user' ? (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                ) : (
                  <Markdown content={msg.content} />
                )}
                {msg.streaming && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: '2px',
                      height: '0.9em',
                      background: 'var(--accent)',
                      marginLeft: 2,
                      verticalAlign: 'text-bottom',
                      animation: 'blink 1s step-end infinite',
                    }}
                  />
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div
        className="flex gap-2 items-end m-6 mt-4 rounded-xl p-2"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
      >
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Ask anything about this student… (Enter to send, Shift+Enter for newline)"
          rows={1}
          className="flex-1 bg-transparent resize-none text-sm p-2 mono"
          style={{
            color: 'var(--text)',
            outline: 'none',
            maxHeight: 80,
            caretColor: 'var(--accent)',
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isLoading || !input.trim()}
          className="flex-shrink-0 px-4 py-2 rounded-lg mono text-sm font-bold transition-all disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            color: '#0a0a0f',
          }}
        >
          {isLoading ? '…' : '→'}
        </button>
      </div>

      <style jsx>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  )
}
