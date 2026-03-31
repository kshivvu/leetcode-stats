'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Check localStorage on mount
    const savedTheme = localStorage.getItem('lc_theme')
    const isDarkMode = savedTheme !== 'light'
    setIsDark(isDarkMode)
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    document.documentElement.setAttribute('data-theme', newIsDark ? 'dark' : 'light')
    localStorage.setItem('lc_theme', newIsDark ? 'dark' : 'light')
  }

  // Avoid flash of wrong theme
  if (!mounted) return null

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-glass)',
        color: 'var(--accent)',
      }}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <span className="text-xl">🌙</span>
      ) : (
        <span className="text-xl">☀️</span>
      )}
    </button>
  )
}
