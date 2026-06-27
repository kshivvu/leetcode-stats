import { LeetCodeData, SubmissionStat } from '@/types/leetcode'

export function extractUsername(url: string): string | null {
  const trimmed = url.trim()
  const match = trimmed.match(/leetcode\.com\/(?:u\/)?([a-zA-Z0-9_-]+)\/?/)
  if (match) return match[1]
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed
  return null
}

export function getSolvedCount(stats: SubmissionStat[] | undefined, difficulty: string): number {
  return stats?.find(s => s.difficulty === difficulty)?.count ?? 0
}

export function getAcceptanceRate(data: LeetCodeData): number {
  const ac    = data?.matchedUser?.submitStats?.acSubmissionNum?.find(s => s.difficulty === 'All')
  const total = data?.matchedUser?.submitStats?.totalSubmissionNum?.find(s => s.difficulty === 'All')
  if (!ac || !total || total.submissions === 0) return 0
  return Math.round((ac.submissions / total.submissions) * 100 * 10) / 10
}

export function getTopTags(data: LeetCodeData, limit = 5) {
  const all = [
    ...(data?.matchedUser?.tagProblemCounts?.advanced || []),
    ...(data?.matchedUser?.tagProblemCounts?.intermediate || []),
    ...(data?.matchedUser?.tagProblemCounts?.fundamental || []),
  ]
  return all.sort((a, b) => b.problemsSolved - a.problemsSolved).slice(0, limit)
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

export function getRankLabel(ranking: number): string {
  if (ranking <= 100)   return 'Top 100 🔥'
  if (ranking <= 1000)  return 'Top 1K'
  if (ranking <= 10000) return 'Top 10K'
  return `#${formatNumber(ranking)}`
}

export function getContestBadgeColor(badge?: string): string {
  switch (badge) {
    case 'Guardian': return '#ff375f'
    case 'Knight':   return '#f0b429'
    default:         return '#6b6b8a'
  }
}

/**
 * Computes a consistency score (0-100) based on streak, active days, solve volume, and acceptance rate.
 */
export function getConsistencyScore(data: LeetCodeData): number {
  const user = data?.matchedUser
  if (!user) return 0
  const contest = data?.userContestRanking

  const streak = user.userCalendar?.streak ?? 0
  const totalActiveDays = user.userCalendar?.totalActiveDays ?? 0
  const totalSolved = getSolvedCount(user.submitStats?.acSubmissionNum, 'All')
  const acceptanceRate = getAcceptanceRate(data)

  const score =
    (streak / 365) * 40 +
    (totalActiveDays / 365) * 30 +
    (totalSolved / 1000) * 20 +
    (acceptanceRate / 100) * 10

  return Math.min(100, Math.round(score))
}
