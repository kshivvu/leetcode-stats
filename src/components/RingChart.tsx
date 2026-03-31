'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

interface RingChartProps {
  easy: number
  medium: number
  hard: number
  total: number
  size?: number
}

export function RingChart({ easy, medium, hard, total, size = 120 }: RingChartProps) {
  const container = useRef<HTMLDivElement>(null)
  
  const r = 40
  const circumference = 2 * Math.PI * r
  const maxProblems = Math.max(total, 3800) // approximate total leetcode problems

  const segments = [
    { color: '#00b8a9', frac: easy   / maxProblems, id: 'easy' },
    { color: '#ffc01e', frac: medium / maxProblems, id: 'medium' },
    { color: '#ff375f', frac: hard   / maxProblems, id: 'hard' },
  ]

  // Fill the remainder with the background track color
  const used = segments.reduce((s, seg) => s + seg.frac, 0)
  segments.push({ color: 'var(--border-glass)', frac: Math.max(0, 1 - used), id: 'bg' })

  let offset = 0
  const arcs = segments.map(seg => {
    const dash   = seg.frac * circumference
    const gap    = circumference - dash
    const result = {
      ...seg,
      strokeDasharray:  `${dash} ${gap}`,
      strokeDashoffset: -offset * circumference,
    }
    offset += seg.frac
    return result
  })

  useGSAP(() => {
    // Animate the arcs drawing in
    gsap.fromTo('.anim-arc', 
      { strokeDasharray: `0 ${circumference}` },
      {
        strokeDasharray: (i, el) => el.getAttribute('data-dasharray'),
        duration: 2,
        ease: 'power3.out',
        stagger: 0.2
      }
    )
    
    // Animate the counter for total
    gsap.fromTo('.anim-total',
      { textContent: '0' },
      { 
        textContent: `${easy + medium + hard}`,
        duration: 2,
        ease: 'power3.out',
        snap: { textContent: 1 }
      }
    )
  }, { scope: container })

  return (
    <div ref={container} className="relative group" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} className="drop-shadow-xl">
        {arcs.map((arc, i) => (
          <circle
            key={arc.id}
            cx={60} cy={60} r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth="12"
            strokeDasharray={arc.strokeDasharray}
            strokeDashoffset={arc.strokeDashoffset}
            data-dasharray={arc.strokeDasharray}
            strokeLinecap="round"
            className={`ring-chart ${arc.id !== 'bg' ? 'anim-arc' : ''}`}
            style={{ filter: arc.id !== 'bg' ? `drop-shadow(0 0 6px ${arc.color}80)` : 'none' }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="mono text-2xl font-bold anim-total" style={{ color: 'var(--text)' }}>
          {easy + medium + hard}
        </span>
        <span className="text-[10px] tracking-wider uppercase mt-1" style={{ color: 'var(--muted)' }}>solved</span>
      </div>
    </div>
  )
}
