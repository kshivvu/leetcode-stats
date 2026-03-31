'use client'

import { LeetCodeData } from '@/types/leetcode'
import { StudentInfo } from '@/types/leetcode'
import { formatNumber, getRankLabel, getContestBadgeColor } from '@/lib/utils'

interface ProfileHeaderProps {
  username: string
  data: LeetCodeData
  student?: StudentInfo | null
}

export function ProfileHeader({ username, data, student }: ProfileHeaderProps) {
  const user    = data.matchedUser
  const contest = data.userContestRanking

  return (
    <div
      className="rounded-2xl p-6 border mb-6"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-start gap-5 flex-wrap">
        {/* Avatar */}
        {user.profile.userAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.profile.userAvatar}
            alt={username}
            className="w-18 h-18 rounded-full object-cover flex-shrink-0"
            style={{ width: 72, height: 72, border: '2px solid var(--border)' }}
          />
        ) : (
          <div
            className="flex-shrink-0 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ width: 72, height: 72, background: 'var(--surface2)', color: 'var(--accent)' }}
          >
            {username[0].toUpperCase()}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <span className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>
              {student?.name || user.profile.realName || username}
            </span>
            {user.profile.ranking > 0 && (
              <span
                className="mono text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'var(--surface2)', color: 'var(--muted)' }}
              >
                {getRankLabel(user.profile.ranking)}
              </span>
            )}
            {contest?.badge && (
              <span
                className="mono text-xs px-3 py-0.5 rounded-full font-semibold"
                style={{
                  background: `${getContestBadgeColor(contest.badge.name)}20`,
                  color:       getContestBadgeColor(contest.badge.name),
                  border:      `1px solid ${getContestBadgeColor(contest.badge.name)}40`,
                }}
              >
                🏆 {contest.badge.name}
              </span>
            )}
          </div>

          {/* Username */}
          <a
            href={`https://leetcode.com/u/${username}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="mono text-sm hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            @{username}
          </a>

          {/* Student badges from CSV */}
          {student && (
            <div className="flex gap-2 flex-wrap mt-2">
              {student.rollNo && (
                <span
                  className="mono text-xs px-2 py-0.5 rounded-md font-semibold"
                  style={{ background: 'rgba(240,180,41,0.12)', color: 'var(--accent)', border: '1px solid rgba(240,180,41,0.25)' }}
                >
                  {student.rollNo}
                </span>
              )}
              {student.section && (
                <span
                  className="mono text-xs px-2 py-0.5 rounded-md"
                  style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' }}
                >
                  Sec {student.section}
                </span>
              )}
              {student.branch && (
                <span
                  className="mono text-xs px-2 py-0.5 rounded-md"
                  style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' }}
                >
                  {student.branch}
                </span>
              )}
            </div>
          )}

          {/* Country / Company */}
          <div className="flex gap-4 mt-2 flex-wrap">
            {user.profile.countryCode && (
              <span className="text-sm" style={{ color: 'var(--muted)' }}>📍 {user.profile.countryCode}</span>
            )}
            {user.profile.company && (
              <span className="text-sm" style={{ color: 'var(--muted)' }}>🏢 {user.profile.company}</span>
            )}
            {user.profile.school && (
              <span className="text-sm" style={{ color: 'var(--muted)' }}>🎓 {user.profile.school}</span>
            )}
            {contest && (
              <span className="text-sm mono" style={{ color: 'var(--muted)' }}>
                ⚡ Rating: <span style={{ color: 'var(--accent)' }}>{Math.round(contest.rating)}</span>
                &nbsp;· Global #{formatNumber(contest.globalRanking)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
