'use client'

import { useState, useEffect } from 'react'
import { loadBatches, deleteBatch } from '@/lib/batchStorage'

interface SavedBatchesProps {
  onLoadBatch: (urls: string[]) => void
}

export function SavedBatches({ onLoadBatch }: SavedBatchesProps) {
  const [batches, setBatches] = useState<Record<string, string[]>>({})

  useEffect(() => {
    const triggerRefresh = () => setBatches(loadBatches())
    
    // Initial load
    triggerRefresh()
    
    // Watch custom event
    window.addEventListener('lc_batches_updated', triggerRefresh)
    return () => window.removeEventListener('lc_batches_updated', triggerRefresh)
  }, [])

  const entries = Object.entries(batches)
  if (entries.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-4 max-w-3xl mx-auto px-2">
      <div className="text-xs uppercase tracking-wider font-bold text-muted my-auto mr-2" style={{ color: 'var(--muted)' }}>
        Saved Batches:
      </div>
      {entries.map(([name, urls]) => (
        <div 
          key={name}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-transform hover:scale-105 shadow-sm bg-opacity-50"
          style={{ background: 'var(--surface-glass)', color: 'var(--text)', border: '1px solid var(--border-glass)' }}
        >
          <button onClick={() => onLoadBatch(urls)} className="hover:underline opacity-90 transition-opacity">
            {name}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); deleteBatch(name); }}
            className="opacity-50 hover:opacity-100 hover:text-red-500 transition-colors ml-1 px-1"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
