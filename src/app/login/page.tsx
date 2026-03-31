'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const json = await res.json()
      if (json.ok) {
        const callback = searchParams.get('callback')
        router.push(callback || '/')
      } else {
        setError('Incorrect password')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Logo mark */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 mono text-xs px-3 py-1.5 rounded-full mb-6"
            style={{
              background: 'rgba(240,180,41,0.1)',
              border: '1px solid rgba(240,180,41,0.2)',
              color: 'var(--accent)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            LC Stats — Admin Access
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>
            Sign In
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
            Enter your admin password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold mb-2 mono"
              style={{ color: 'var(--muted)' }}
            >
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
              className="w-full rounded-xl px-4 py-3 mono text-sm"
              style={{
                background: 'var(--surface2)',
                border: `1px solid ${error ? 'var(--hard)' : 'var(--border)'}`,
                color: 'var(--text)',
                outline: 'none',
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs mono" style={{ color: 'var(--hard)' }}>
              ✕ {error}
            </p>
          )}

          <button
            id="login-submit"
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-xl font-bold mono text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              color: '#0a0a0f',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="mono text-sm animate-pulse" style={{ color: 'var(--muted)' }}>Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
