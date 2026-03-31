'use client'

import { useMemo } from 'react'
import { ProfileResult } from '@/types/leetcode'
import { getSolvedCount, formatNumber } from '@/lib/utils'
import { getActivityStatus } from '@/lib/activityStatus'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

export function ClassSummary({ results }: { results: ProfileResult[] }) {
  const stats = useMemo(() => {
    const valid = results.filter(r => !r.loading && r.data)
    const successCount = valid.length
    
    if (successCount === 0) return null

    let sumTotalSolved = 0
    let sumContestRating = 0
    let ratedCount = 0
    let highestStreak = 0
    let activeWeekCount = 0
    let inactiveCount = 0
    let totalHardSolved = 0

    let bestPerformer = { name: '—', score: -1 }
    let mostConsistent = { name: '—', streak: -1 }

    valid.forEach(r => {
      const data = r.data!
      const user = data.matchedUser
      const contest = data.userContestRanking

      const nameToDisplay = user.profile.realName || r.username
      
      const total = getSolvedCount(user.submitStats.acSubmissionNum, 'All')
      const hard = getSolvedCount(user.submitStats.acSubmissionNum, 'Hard')
      const streak = user.userCalendar?.streak || 0
      
      sumTotalSolved += total
      totalHardSolved += hard
      
      if (contest?.rating) {
        sumContestRating += contest.rating
        ratedCount++
      }

      const status = getActivityStatus(user.userCalendar?.submissionCalendar)
      if (status.label === 'Active') activeWeekCount++
      if (status.label === 'Inactive') inactiveCount++

      if (streak > highestStreak) highestStreak = streak

      if (total > bestPerformer.score) {
        bestPerformer = { name: nameToDisplay, score: total }
      }
      
      if (streak > mostConsistent.streak) {
        mostConsistent = { name: nameToDisplay, streak }
      }
    })

    const avgTotalSolved = Math.round(sumTotalSolved / successCount)
    const avgContestRating = ratedCount > 0 ? Math.round(sumContestRating / ratedCount) : null

    return {
      totalStudents: results.length,
      successCount,
      avgTotalSolved,
      avgContestRating,
      highestStreak,
      activeWeekCount,
      inactiveCount,
      totalHardSolved,
      bestPerformer,
      mostConsistent
    }
  }, [results])

  useGSAP(() => {
    gsap.fromTo('.summary-card', 
      { y: 20, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)', stagger: 0.05 }
    )
  }, { dependencies: [stats] })

  if (!stats) return null

  return (
    <div className="mb-10 w-full overflow-x-auto pb-4 custom-scrollbar">
      <div className="flex gap-4 min-w-max px-2">
        <SummaryCard label="Total Students" value={stats.totalStudents} />
        <SummaryCard label="Successfully Loaded" value={stats.successCount} />
        <SummaryCard label="Avg Total Solved" value={stats.avgTotalSolved} />
        {stats.avgContestRating && (
          <SummaryCard label="Avg Contest Rating" value={stats.avgContestRating} />
        )}
        <SummaryCard label="Highest Streak" value={stats.highestStreak} suffix="d" />
        <SummaryCard label="Active This Week" value={stats.activeWeekCount} color="var(--easy)" />
        <SummaryCard label="Inactive (30d+)" value={stats.inactiveCount} color="var(--hard)" />
        <SummaryCard label="Total Hard Solved" value={stats.totalHardSolved} color="var(--hard)" />
        <SummaryCard label="Best Performer" value={stats.bestPerformer.name} icon="🏆" isText />
        <SummaryCard label="Most Consistent" value={stats.mostConsistent.name} icon="🔥" isText />
      </div>
    </div>
  )
}

function SummaryCard({ label, value, suffix, color, icon, isText }: any) {
  return (
    <div 
      className="summary-card flex-shrink-0 p-4 rounded-2xl border"
      style={{ 
        background: 'var(--surface-glass)', 
        borderColor: 'var(--border-glass)',
        minWidth: 160
      }}
    >
      <div className="text-[10px] tracking-wider uppercase mb-2 opacity-80" style={{ color: 'var(--muted)' }}>
        {label}
      </div>
      <div 
        className={`text-xl flex items-center gap-2 ${isText ? 'font-bold' : 'mono font-bold'}`} 
        style={{ color: color || 'var(--text)' }}
      >
        {icon && <span>{icon}</span>}
        <span className="truncate max-w-[150px]" title={String(value)}>
          {typeof value === 'number' && !isText ? formatNumber(value) : value}
        </span>
        {suffix && <span className="text-sm opacity-60 ml-0.5">{suffix}</span>}
      </div>
    </div>
  )
}
