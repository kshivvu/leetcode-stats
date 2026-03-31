'use client'

import { useEffect, useState } from 'react'

export function Toast({ message, visible, onClose }: { message: string, visible: boolean, onClose: () => void }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      const t = setTimeout(() => {
        setShow(false)
        setTimeout(onClose, 300) // allow exit animation to finish
      }, 2000)
      return () => clearTimeout(t)
    } else {
      setShow(false)
    }
  }, [visible, onClose])

  if (!visible && !show) return null

  return (
    <div 
      className={`fixed bottom-6 right-6 px-4 py-3 rounded shadow-xl transition-all duration-300 transform ${show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      style={{ 
        background: 'var(--surface2)', 
        color: 'var(--text)', 
        borderLeft: '4px solid var(--easy)',
        zIndex: 9999
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">✅</span>
        <span className="text-sm font-bold tracking-wide mono">{message}</span>
      </div>
    </div>
  )
}
