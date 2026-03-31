'use client'

import { LeetCodeData } from '@/types/leetcode'
import { getSolvedCount, getAcceptanceRate, formatNumber } from '@/lib/utils'

interface StatsGridProps {
  data: LeetCodeData
}

export function StatsGrid({ data }: StatsGridProps) {
  const user    = data.matchedUser
  const contest = data.userContestRanking

  const easy   = getSolvedCount(user.submitStats.acSubmissionNum, 'Easy')
  const medium = getSolvedCount(user.submitStats.acSubmissionNum, 'Medium')
  const hard   = getSolvedCount(user.submitStats.acSubmissionNum, 'Hard')
  const total  = getSolvedCount(user.submitStats.acSubmissionNum, 'All')
  const totalSubs = getSolvedCount(user.submitStats.totalSubmissionNum, 'All')
  const acceptance = getAcceptanceRate(data)

  const easyBeats = user.problemsSolvedBeatsStats?.find(b => b.difficulty === 'Easy')?.percentage
  const medBeats  = user.problemsSolvedBeatsStats?.find(b => b.difficulty === 'Medium')?.percentage
  const hardBeats = user.problemsSolvedBeatsStats?.find(b => b.difficulty === 'Hard')?.percentage

  const maxProblems = 3400

  return (
    <div
      className="rounded-2xl p-6 border mb-6"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="text-xs font-semibold mb-4 mono" style={{ color: 'var(--muted)' }}>
        PROBLEM SOLVING STATS
      </div>

      {/* Difficulty bars */}
      <div className="space-y-3 mb-6">
        {[
          { label: 'Easy',   count: easy,   beats: easyBeats, color: 'var(--easy)',   max: 870  },
          { label: 'Medium', count: medium, beats: medBeats,  color: 'var(--medium)', max: 1840 },
          { label: 'Hard',   count: hard,   beats: hardBeats, color: 'var(--hard)',   max: 770  },
        ].map(({ label, count, beats, color, max }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1">
              <span className="mono text-xs font-semibold" style={{ color }}>{label}</span>
              <div className="flex items-center gap-3">
                <span className="mono text-sm font-bold" style={{ color: 'var(--text)' }}>{count}</span>
                {beats != null && (
                  <span className="mono text-xs" style={{ color: 'var(--muted)' }}>
                    beats {beats.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: 'var(--surface2)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min((count / max) * 100, 100)}%`,
                  background: color,
                  opacity: 0.8,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Solved"   value={total.toString()}            />
        <StatCard label="Acceptance"     value={`${acceptance}%`}            />
        <StatCard label="Submissions"    value={formatNumber(totalSubs)}      />
        <StatCard label="Streak"         value={`${user.userCalendar?.streak ?? 0} days`} highlight />
        <StatCard label="Active Days"    value={user.userCalendar?.totalActiveDays?.toString() ?? '0'} />
        {user.profile.reputation > 0 && (
          <StatCard label="Reputation" value={formatNumber(user.profile.reputation)} />
        )}
        {contest && (
          <>
            <StatCard label="Contest Rating" value={Math.round(contest.rating).toString()} highlight />
            <StatCard label="Contests"       value={contest.attendedContestsCount.toString()} />
            <StatCard label="Global Rank"    value={`#${formatNumber(contest.globalRanking)}`} />
            <StatCard label="Top %"          value={`${contest.topPercentage?.toFixed(1)}%`} />
          </>
        )}
      </div>

      {/* Progress towards 3400 */}
      <div className="mt-5">
        <div className="flex justify-between mb-1">
          <span className="mono text-xs" style={{ color: 'var(--muted)' }}>Overall Progress</span>
          <span className="mono text-xs" style={{ color: 'var(--muted)' }}>{total} / {maxProblems}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min((total / maxProblems) * 100, 100)}%`,
              background: 'linear-gradient(90deg, var(--easy), var(--medium), var(--hard))',
            }}
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
    >
      <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{label}</div>
      <div
        className="mono font-bold text-lg"
        style={{ color: highlight ? 'var(--accent)' : 'var(--text)' }}
      >
        {value}
      </div>
    </div>
  )
}
