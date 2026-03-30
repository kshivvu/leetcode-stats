'use client'

import { LeetCodeData } from '@/types/leetcode'
import { RingChart } from './RingChart'
import {
  getSolvedCount, getAcceptanceRate, getTopTags,
  formatNumber, getRankLabel, getContestBadgeColor,
} from '@/lib/utils'

interface ProfileCardProps {
  username: string
  data: LeetCodeData
  index: number
}

export function ProfileCard({ username, data, index }: ProfileCardProps) {
  const user    = data.matchedUser
  const contest = data.userContestRanking

  const easy    = getSolvedCount(user.submitStats.acSubmissionNum, 'Easy')
  const medium  = getSolvedCount(user.submitStats.acSubmissionNum, 'Medium')
  const hard    = getSolvedCount(user.submitStats.acSubmissionNum, 'Hard')
  const total   = getSolvedCount(user.submitStats.acSubmissionNum, 'All')
  const totalSubs = getSolvedCount(user.submitStats.totalSubmissionNum, 'All')
  const acceptance = getAcceptanceRate(data)
  const topTags    = getTopTags(data, 6)

  const easyBeats = user.problemsSolvedBeatsStats?.find(b => b.difficulty === 'Easy')?.percentage
  const medBeats  = user.problemsSolvedBeatsStats?.find(b => b.difficulty === 'Medium')?.percentage
  const hardBeats = user.problemsSolvedBeatsStats?.find(b => b.difficulty === 'Hard')?.percentage

  return (
    <div
      className="rounded-2xl border card-hover animate-fade-up overflow-hidden"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        animationDelay: `${index * 80}ms`,
        animationFillMode: 'both',
      }}
    >
      {/* Accent top bar */}
      <div
        className="h-1 w-full"
        style={{ background: 'linear-gradient(90deg, var(--accent) 0%, var(--accent2) 100%)', opacity: 0.7 }}
      />

      <div className="p-6">
        {/* Header: avatar + name */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative flex-shrink-0">
            {user.profile.userAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profile.userAvatar}
                alt={username}
                className="w-14 h-14 rounded-full object-cover"
                style={{ border: '2px solid var(--border)' }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                style={{ background: 'var(--surface2)', color: 'var(--accent)' }}
              >
                {username[0].toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={`https://leetcode.com/u/${username}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-lg truncate hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                {user.profile.realName || username}
              </a>
              {user.profile.ranking > 0 && (
                <span
                  className="mono text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'var(--surface2)', color: 'var(--muted)' }}
                >
                  {getRankLabel(user.profile.ranking)}
                </span>
              )}
            </div>
            <div className="mono text-xs mt-0.5" style={{ color: 'var(--muted)' }}>@{username}</div>
            <div className="flex gap-3 mt-2 flex-wrap">
              {user.profile.countryCode && (
                <span className="text-xs" style={{ color: 'var(--muted)' }}>📍 {user.profile.countryCode}</span>
              )}
              {user.profile.company && (
                <span className="text-xs" style={{ color: 'var(--muted)' }}>🏢 {user.profile.company}</span>
              )}
            </div>
          </div>
        </div>

        {/* Ring chart + difficulty rows */}
        <div className="flex items-center gap-6 mb-6">
          <RingChart easy={easy} medium={medium} hard={hard} total={total} size={110} />
          <div className="flex-1 space-y-2">
            <DiffRow label="Easy"   count={easy}   beats={easyBeats} color="var(--easy)"   />
            <DiffRow label="Medium" count={medium} beats={medBeats}  color="var(--medium)" />
            <DiffRow label="Hard"   count={hard}   beats={hardBeats} color="var(--hard)"   />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-5 p-3 rounded-xl" style={{ background: 'var(--surface2)' }}>
          <StatItem label="Acceptance"  value={`${acceptance}%`} />
          <StatItem label="Submissions" value={formatNumber(totalSubs)} />
          <StatItem label="Streak"      value={`${user.userCalendar?.streak ?? 0}d`} />
          <StatItem label="Active Days" value={`${user.userCalendar?.totalActiveDays ?? 0}`} />
          {contest && (
            <>
              <StatItem label="Contest Rating" value={Math.round(contest.rating).toString()} highlight />
              <StatItem label="Contests"        value={contest.attendedContestsCount.toString()} />
              <StatItem label="Global Rank"     value={`#${formatNumber(contest.globalRanking)}`} />
              <StatItem label="Top %"           value={`${contest.topPercentage?.toFixed(1)}%`} />
            </>
          )}
          {user.profile.reputation > 0 && (
            <StatItem label="Reputation" value={formatNumber(user.profile.reputation)} />
          )}
        </div>

        {/* Contest badge */}
        {contest?.badge && (
          <div className="mb-4">
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full mono"
              style={{
                background: `${getContestBadgeColor(contest.badge.name)}20`,
                color:       getContestBadgeColor(contest.badge.name),
                border:      `1px solid ${getContestBadgeColor(contest.badge.name)}40`,
              }}
            >
              🏆 {contest.badge.name}
            </span>
          </div>
        )}

        {/* Top tags */}
        {topTags.length > 0 && (
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>TOP TOPICS</div>
            <div className="flex flex-wrap gap-2">
              {topTags.map(tag => (
                <span
                  key={tag.tagName}
                  className="mono text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                  style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' }}
                >
                  {tag.tagName}
                  <span style={{ color: 'var(--accent)', opacity: 0.8 }}>{tag.problemsSolved}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        {user.badges.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
              BADGES ({user.badges.length})
            </div>
            <div className="flex gap-2 flex-wrap">
              {user.badges.slice(0, 6).map(badge => (
                <div key={badge.id} title={badge.displayName}>
                  {badge.icon
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={badge.icon} alt={badge.displayName} className="w-8 h-8 object-contain" />
                    : <span className="text-lg">🏅</span>
                  }
                </div>
              ))}
              {user.badges.length > 6 && (
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  +{user.badges.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────── */

function DiffRow({
  label, count, beats, color,
}: {
  label: string; count: number; beats?: number; color: string
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span
        className="mono text-xs font-semibold px-2 py-0.5 rounded"
        style={{ color, background: `${color}15`, minWidth: 52, textAlign: 'center' }}
      >
        {label}
      </span>
      <span className="mono text-sm font-bold flex-1 text-right" style={{ color: 'var(--text)' }}>
        {count}
      </span>
      {beats != null && (
        <span className="mono text-xs" style={{ color: 'var(--muted)', minWidth: 60, textAlign: 'right' }}>
          beats {beats.toFixed(1)}%
        </span>
      )}
    </div>
  )
}

function StatItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs" style={{ color: 'var(--muted)' }}>{label}</div>
      <div className="mono font-bold text-sm" style={{ color: highlight ? 'var(--accent)' : 'var(--text)' }}>
        {value}
      </div>
    </div>
  )
}
