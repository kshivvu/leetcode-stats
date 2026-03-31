'use client'

import { useState, useMemo } from 'react'
import { ProfileResult } from '@/types/leetcode'
import { getSolvedCount, getRankLabel, getConsistencyScore } from '@/lib/utils'
import { getActivityStatus } from '@/lib/activityStatus'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

interface LeaderboardTableProps {
  results: ProfileResult[]
}

type SortField = 'rank' | 'name' | 'username' | 'easy' | 'medium' | 'hard' | 'total' | 'streak' | 'rating' | 'score'
type SortOrder = 'asc' | 'desc'

export function LeaderboardTable({ results }: LeaderboardTableProps) {
  const [sortField, setSortField] = useState<SortField>('total')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Staggering rows animate-in effect
  useGSAP(() => {
    if (results.length > 0) {
      gsap.fromTo('.leaderboard-row', 
        { y: 20, opacity: 0 },
        { 
          y: 0, opacity: 1, 
          duration: 0.4, 
          ease: 'power2.out',
          stagger: 0.05 
        }
      )
    }
  }, { dependencies: [results] })

  const sortedResults = useMemo(() => {
    const sorted = [...results].sort((a, b) => {
      // Always put loading at the bottom
      if (a.loading && !b.loading) return 1
      if (!a.loading && b.loading) return -1
      
      // We will sort errors behind loaded
      if (a.error && !b.error) return 1
      if (!a.error && b.error) return -1
      if (a.error && b.error) return 0 // keep original order

      if (!a.data || !b.data) return 0

      const aUser = a.data.matchedUser
      const bUser = b.data.matchedUser

      let aVal: any = 0
      let bVal: any = 0

      switch (sortField) {
        case 'name':
          aVal = (a.studentInfo?.name || aUser.profile.realName || a.username).toLowerCase()
          bVal = (b.studentInfo?.name || bUser.profile.realName || b.username).toLowerCase()
          break
        case 'username':
          aVal = a.username.toLowerCase()
          bVal = b.username.toLowerCase()
          break
        case 'easy':
          aVal = getSolvedCount(aUser.submitStats.acSubmissionNum, 'Easy')
          bVal = getSolvedCount(bUser.submitStats.acSubmissionNum, 'Easy')
          break
        case 'medium':
          aVal = getSolvedCount(aUser.submitStats.acSubmissionNum, 'Medium')
          bVal = getSolvedCount(bUser.submitStats.acSubmissionNum, 'Medium')
          break
        case 'hard':
          aVal = getSolvedCount(aUser.submitStats.acSubmissionNum, 'Hard')
          bVal = getSolvedCount(bUser.submitStats.acSubmissionNum, 'Hard')
          break
        case 'total':
          aVal = getSolvedCount(aUser.submitStats.acSubmissionNum, 'All')
          bVal = getSolvedCount(bUser.submitStats.acSubmissionNum, 'All')
          break
        case 'streak':
          aVal = aUser.userCalendar?.streak || 0
          bVal = bUser.userCalendar?.streak || 0
          break
        case 'rating':
          aVal = a.data.userContestRanking?.rating || 0
          bVal = b.data.userContestRanking?.rating || 0
          break
        case 'score':
          aVal = getConsistencyScore(a.data)
          bVal = getConsistencyScore(b.data)
          break
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [results, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <span className="opacity-20 ml-1">↕</span>
    return <span className="ml-1 text-accent">{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="overflow-x-auto w-full rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead>
          <tr style={{ background: 'var(--surface2)', color: 'var(--muted)' }} className="text-xs uppercase tracking-wider">
            <th className="px-4 py-3 font-semibold cursor-pointer whitespace-nowrap" onClick={() => handleSort('rank')}>
              # {getSortIcon('rank')}
            </th>
            <th className="px-4 py-3 font-semibold cursor-pointer whitespace-nowrap" onClick={() => handleSort('name')}>
              Name / Roll No {getSortIcon('name')}
            </th>
            <th className="px-4 py-3 font-semibold cursor-pointer whitespace-nowrap" onClick={() => handleSort('username')}>
              Username {getSortIcon('username')}
            </th>
            <th className="px-4 py-3 font-semibold cursor-pointer whitespace-nowrap text-right" onClick={() => handleSort('easy')}>
              Easy <span style={{ color: 'var(--easy)' }}>●</span> {getSortIcon('easy')}
            </th>
            <th className="px-4 py-3 font-semibold cursor-pointer whitespace-nowrap text-right" onClick={() => handleSort('medium')}>
              Medium <span style={{ color: 'var(--medium)' }}>●</span> {getSortIcon('medium')}
            </th>
            <th className="px-4 py-3 font-semibold cursor-pointer whitespace-nowrap text-right" onClick={() => handleSort('hard')}>
              Hard <span style={{ color: 'var(--hard)' }}>●</span> {getSortIcon('hard')}
            </th>
            <th className="px-4 py-3 font-semibold cursor-pointer whitespace-nowrap text-right" onClick={() => handleSort('total')}>
              Total {getSortIcon('total')}
            </th>
            <th className="px-4 py-3 font-semibold cursor-pointer whitespace-nowrap text-right" onClick={() => handleSort('streak')}>
              Streak {getSortIcon('streak')}
            </th>
            <th className="px-4 py-3 font-semibold cursor-pointer whitespace-nowrap text-right" onClick={() => handleSort('rating')}>
              Rating {getSortIcon('rating')}
            </th>
            <th className="px-4 py-3 font-semibold cursor-pointer whitespace-nowrap text-right" onClick={() => handleSort('score')}>
              Score {getSortIcon('score')}
            </th>
            <th className="px-4 py-3 font-semibold whitespace-nowrap">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {sortedResults.map((result, index) => {
            const rank = index + 1
            const isTop3 = rank <= 3 && result.data && !result.error
            
            let rankBorder = 'transparent'
            if (isTop3) {
              if (rank === 1) rankBorder = 'var(--accent)'
              else if (rank === 2) rankBorder = '#aaa'
              else if (rank === 3) rankBorder = '#cd7f32'
            }

            if (result.loading) {
              return (
                <tr key={`${result.username}-${index}`} className="border-t leaderboard-row opacity-60" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-4"><div className="skeleton h-4 w-6 rounded" /></td>
                  <td className="px-4 py-4"><div className="skeleton h-4 w-24 rounded" /></td>
                  <td className="px-4 py-4"><div className="skeleton h-4 w-20 rounded" /></td>
                  <td className="px-4 py-4" colSpan={8}><div className="skeleton h-4 w-32 rounded" /></td>
                </tr>
              )
            }

            if (result.error || !result.data) {
              return (
                <tr key={`${result.username}-${index}`} className="border-t leaderboard-row opacity-50 bg-black/10" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-4 mono" style={{ borderLeft: '4px solid transparent' }}>{rank}</td>
                  <td className="px-4 py-4 blur-[1px]">---</td>
                  <td className="px-4 py-4">
                    <a href={`https://leetcode.com/u/${result.username}/`} target="_blank" rel="noopener noreferrer" className="hover:underline font-bold" style={{ color: 'var(--muted)' }}>
                      {result.username}
                    </a>
                  </td>
                  <td className="px-4 py-4 text-center mono text-xs font-bold" colSpan={8} style={{ color: 'var(--hard)' }}>
                    ❌ Profile not found or error ({result.error})
                  </td>
                </tr>
              )
            }

            const user = result.data.matchedUser
            const contest = result.data.userContestRanking
            
            const easy = getSolvedCount(user.submitStats.acSubmissionNum, 'Easy')
            const medium = getSolvedCount(user.submitStats.acSubmissionNum, 'Medium')
            const hard = getSolvedCount(user.submitStats.acSubmissionNum, 'Hard')
            const total = getSolvedCount(user.submitStats.acSubmissionNum, 'All')
            const streak = user.userCalendar?.streak || 0
            const rating = contest?.rating ? Math.round(contest.rating) : null
            const score = getConsistencyScore(result.data)
            const status = getActivityStatus(user.userCalendar?.submissionCalendar)

            return (
              <tr 
                key={`${result.username}-${index}`} 
                className="border-t transition-colors leaderboard-row hover:bg-white/5" 
                style={{ borderColor: 'var(--border)' }}
              >
                <td className="px-4 py-4 mono font-bold" style={{ borderLeft: `4px solid ${rankBorder}` }}>
                  {rank}
                </td>
                <td className="px-4 py-4">
                  <div className="font-bold flex items-center gap-2">
                    {user.profile.userAvatar && (
                      <img src={user.profile.userAvatar} alt={result.username} className="w-6 h-6 rounded-full object-cover" style={{ border: '1px solid var(--border)' }} />
                    )}
                    <div className="flex flex-col">
                      <span className="font-bold truncate max-w-[150px]" title={result.studentInfo?.name || user.profile.realName || result.username}>
                        {result.studentInfo?.name || user.profile.realName || result.username}
                      </span>
                      {result.studentInfo?.rollNo && (
                        <span className="text-[10px] opacity-60 mono font-medium">
                          {result.studentInfo.rollNo} {result.studentInfo.section && `• Sec ${result.studentInfo.section}`}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <a href={`https://leetcode.com/u/${result.username}/`} target="_blank" rel="noopener noreferrer" className="hover:underline mono text-xs" style={{ color: 'var(--accent)' }}>
                    @{result.username}
                  </a>
                </td>
                <td className="px-4 py-4 mono text-right">{easy}</td>
                <td className="px-4 py-4 mono text-right">{medium}</td>
                <td className="px-4 py-4 mono text-right">{hard}</td>
                <td className="px-4 py-4 mono text-right font-bold" style={{ color: 'var(--accent)' }}>{total}</td>
                <td className="px-4 py-4 mono text-right">{streak > 0 ? `${streak}d` : '—'}</td>
                <td className="px-4 py-4 mono text-right">{rating ? rating : '—'}</td>
                <td className="px-4 py-4 mono text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-12 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
                      <div className="h-full rounded-full" style={{ width: `${score}%`, background: score < 40 ? 'var(--hard)' : score < 70 ? 'var(--medium)' : 'var(--easy)' }} />
                    </div>
                    <span>{score}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span 
                    className="mono text-[10px] tracking-widest uppercase font-bold px-2 py-1 rounded-full whitespace-nowrap"
                    style={{ background: `${status.color}20`, color: status.color, border: `1px solid ${status.color}50` }}
                    title={status.label}
                  >
                    {status.emoji} {status.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
