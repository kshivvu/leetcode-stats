'use client'

import { useState } from 'react'

interface SessionCookieModalProps {
  reason: 'missing' | 'expired'
  onSaved: () => void
}

export function SessionCookieModal({ reason, onSaved }: SessionCookieModalProps) {
  const [value, setValue] = useState('')
  const [show,  setShow]  = useState(false)
  const [open,  setOpen]  = useState(false)

  const handleSave = () => {
    if (!value.trim()) return
    localStorage.setItem('lc_session_cookie', value.trim())
    onSaved()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="text-xl font-bold mb-1" style={{ color: 'var(--accent)' }}>
          {reason === 'missing' ? '🔐 LeetCode Session Required' : '⏱ Session Expired'}
        </div>
        <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
          {reason === 'expired'
            ? 'Your LeetCode session has expired. Please paste a fresh cookie.'
            : 'To view submission code, we need your LeetCode session cookie.'}
        </p>

        {/* Steps */}
        <ol className="space-y-2 mb-5">
          {[
            'Go to leetcode.com and make sure you\'re logged in',
            'Press F12 → Application tab → Cookies → https://leetcode.com',
            'Find the cookie named LEETCODE_SESSION',
            'Copy its full value (it\'s a long string)',
            'Paste it below',
          ].map((step, i) => (
            <li key={i} className="flex gap-3 text-sm" style={{ color: 'var(--text)' }}>
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mono text-xs font-bold"
                style={{ background: 'var(--surface2)', color: 'var(--accent)' }}
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        {/* Input */}
        <div className="relative mb-4">
          <input
            id="lc-session-input"
            type={show ? 'text' : 'password'}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Paste LEETCODE_SESSION value here…"
            className="w-full rounded-xl px-4 py-3 mono text-xs pr-12"
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              outline: 'none',
            }}
          />
          <button
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-lg"
            style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            title={show ? 'Hide' : 'Show'}
          >
            {show ? '🙈' : '👁️'}
          </button>
        </div>

        <button
          id="lc-session-save"
          onClick={handleSave}
          disabled={!value.trim()}
          className="w-full py-3 rounded-xl font-bold mono text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed mb-4"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            color: '#0a0a0f',
          }}
        >
          Save &amp; Continue →
        </button>

        {/* Collapsible why */}
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full text-left text-xs flex items-center gap-2"
          style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <span>{open ? '▾' : '▸'}</span>
          Why is this needed?
        </button>
        {open && (
          <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
            This lets the app read submission data on your behalf, exactly like your browser does
            when you&apos;re logged in. The cookie is stored only in your browser and never sent
            anywhere except LeetCode.
          </p>
        )}
      </div>
    </div>
  )
}
