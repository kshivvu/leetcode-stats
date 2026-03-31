'use client'

import { LeetCodeData } from '@/types/leetcode'
import { useState } from 'react'

const HEATMAP_TOPICS = [
  'array', 'string', 'hash-table', 'dynamic-programming', 'math', 'sorting',
  'greedy', 'depth-first-search', 'breadth-first-search', 'binary-search',
  'two-pointers', 'sliding-window', 'tree', 'graph', 'heap-priority-queue',
  'backtracking', 'stack', 'linked-list', 'trie', 'union-find'
]

function getIntensityColor(count: number) {
  if (count === 0) return 'var(--surface2)'
  if (count <= 5) return 'color-mix(in srgb, var(--accent) 20%, transparent)'
  if (count <= 15) return 'color-mix(in srgb, var(--accent) 50%, transparent)'
  if (count <= 30) return 'color-mix(in srgb, var(--accent) 80%, transparent)'
  return 'var(--accent)'
}

export function TopicHeatmap({ data }: { data: LeetCodeData }) {
  const [expanded, setExpanded] = useState(false)
  
  const counts = data.matchedUser.tagProblemCounts
  const allTags = [...counts.advanced, ...counts.intermediate, ...counts.fundamental]
  
  const heatmapData = HEATMAP_TOPICS.map(slug => {
    const tag = allTags.find(t => t.tagSlug === slug)
    return {
      slug,
      name: tag?.tagName || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      count: tag?.problemsSolved || 0
    }
  })

  return (
    <div className="mt-4 pt-4 border-t parallax-inner" style={{ borderColor: 'var(--border-glass)', transform: 'translateZ(5px)' }}>
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-[10px] tracking-widest font-bold uppercase transition-colors"
        style={{ color: expanded ? 'var(--text)' : 'var(--muted)' }}
        title="Toggle Top Coverage Details"
      >
        <span>Topic Coverage</span>
        <span className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
      </button>
      
      {expanded && (
        <div className="grid grid-cols-4 gap-2 mt-4 animate-fade-up">
          {heatmapData.map(topic => (
            <div 
              key={topic.slug} 
              className="flex flex-col items-center justify-center gap-1 group relative cursor-help"
              title={`${topic.name}: ${topic.count} solved`}
            >
              <div 
                className="w-8 h-8 rounded-md transition-all group-hover:scale-110 flex items-center justify-center"
                style={{ 
                  background: getIntensityColor(topic.count),
                  border: `1px solid ${topic.count > 0 ? 'var(--accent)' : 'var(--border-glass)'}`,
                  opacity: topic.count === 0 ? 0.3 : 1
                }}
              >
                {topic.count > 0 && <span className="text-[10px] mono font-bold text-white mix-blend-difference opacity-80">{topic.count}</span>}
              </div>
              <span className="text-[9px] text-center leading-tight opacity-70 group-hover:opacity-100 line-clamp-2" style={{ color: 'var(--text)', minHeight: '22px' }}>
                {topic.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
