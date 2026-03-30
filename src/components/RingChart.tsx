'use client'

interface RingChartProps {
  easy: number
  medium: number
  hard: number
  total: number
  size?: number
}

export function RingChart({ easy, medium, hard, total, size = 120 }: RingChartProps) {
  const r = 40
  const circumference = 2 * Math.PI * r
  const maxProblems = Math.max(total, 3400)

  const segments = [
    { color: '#00b8a9', frac: easy   / maxProblems },
    { color: '#ffc01e', frac: medium / maxProblems },
    { color: '#ff375f', frac: hard   / maxProblems },
  ]

  // Fill the remainder with the background track color
  const used = segments.reduce((s, seg) => s + seg.frac, 0)
  segments.push({ color: '#2a2a3d', frac: Math.max(0, 1 - used) })

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

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size}>
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={60} cy={60} r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth="10"
            strokeDasharray={arc.strokeDasharray}
            strokeDashoffset={arc.strokeDashoffset}
            className="ring-chart"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="mono text-xl font-bold" style={{ color: 'var(--text)' }}>
          {easy + medium + hard}
        </span>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>solved</span>
      </div>
    </div>
  )
}
