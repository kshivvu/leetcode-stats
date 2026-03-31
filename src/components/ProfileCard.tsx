'use client'

import { useRef } from 'react'
import { LeetCodeData, StudentInfo } from '@/types/leetcode'
import { RingChart } from './RingChart'
import { TopicHeatmap } from './TopicHeatmap'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import {
  getSolvedCount, getAcceptanceRate, getTopTags,
  formatNumber, getRankLabel, getContestBadgeColor, getConsistencyScore,
} from '@/lib/utils'
import { getActivityStatus } from '@/lib/activityStatus'

interface ProfileCardProps {
  username: string
  data: LeetCodeData
  index: number
  studentInfo?: StudentInfo
}

export function ProfileCard({ username, data, index, studentInfo }: ProfileCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const user    = data.matchedUser
  const contest = data.userContestRanking

  // Activity status badge
  const activityStatus = getActivityStatus(user.userCalendar?.submissionCalendar)

  // Consistency score
  const consistencyScore = getConsistencyScore(data)

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

  // Apply 3D parallax on hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left // x position within the element
    const y = e.clientY - rect.top  // y position within the element
    
    // Calculate rotation (-15 to +15 deg based on mouse pos)
    const xRot = ((y / rect.height) - 0.5) * -20
    const yRot = ((x / rect.width) - 0.5) * 20

    gsap.to(cardRef.current, {
      rotateX: xRot,
      rotateY: yRot,
      transformPerspective: 1000,
      ease: 'power2.out',
      duration: 0.5
    })
    
    // Animate inner elements slightly
    gsap.to('.parallax-inner', {
      x: yRot,
      y: -xRot,
      ease: 'power2.out',
      duration: 0.5
    })
  }

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      ease: 'power3.out',
      duration: 0.8
    })
    gsap.to('.parallax-inner', {
      x: 0,
      y: 0,
      ease: 'power3.out',
      duration: 0.8
    })
  }

  // GSAP Counter Animations
  useGSAP(() => {
    // Number counting up animation for items using class 'gsap-counter'
    const counters = gsap.utils.toArray('.gsap-counter') as HTMLElement[]
    counters.forEach((el) => {
      const targetVal = parseFloat(el.getAttribute('data-value') || '0')
      const isPercent = el.getAttribute('data-suffix') === '%'
      
      gsap.fromTo(el, 
        { innerHTML: 0 },
        {
          innerHTML: targetVal,
          duration: 2,
          ease: 'power3.out',
          snap: { innerHTML: isPercent ? 0.1 : 1 },
          onUpdate: function() {
            if (isPercent) {
              el.innerHTML = Number(this.targets()[0].innerHTML).toFixed(1) + '%'
            } else {
              el.innerHTML = formatNumber(Math.floor(Number(this.targets()[0].innerHTML)))
            }
          }
        }
      )
    })
  }, { scope: cardRef })

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="profile-card rounded-2xl border glass-panel overflow-hidden transform-gpu"
      style={{
        borderColor: 'var(--border-glass)',
        transformStyle: 'preserve-3d',
        opacity: 0, // for page stagger
      }}
    >
      {/* Accent top bar */}
      <div
        className="h-1.5 w-full relative z-10"
        style={{ background: 'linear-gradient(90deg, var(--accent) 0%, var(--accent2) 100%)', opacity: 0.9 }}
      />

      <div className="p-6 relative z-10 p-inner">
        {/* Activity Status Badge - Top Right Corner */}
        <div className="absolute top-4 right-4 z-20">
          <span
            className="mono text-[10px] tracking-widest uppercase font-bold px-2.5 py-1 rounded-full shadow-lg"
            style={{
              background: `${activityStatus.color}20`,
              color: activityStatus.color,
              border: `1px solid ${activityStatus.color}50`,
            }}
          >
            {activityStatus.emoji} {activityStatus.label}
          </span>
        </div>

        {/* Header: avatar + name */}
        <div className="flex items-start gap-4 mb-6 parallax-inner" style={{ transform: 'translateZ(30px)' }}>
          <div className="relative flex-shrink-0">
            {user.profile.userAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profile.userAvatar}
                alt={username}
                className="w-16 h-16 rounded-full object-cover shadow-lg"
                style={{ border: '2px solid var(--border-glass)' }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg"
                style={{ background: 'var(--surface-glass)', color: 'var(--accent)', border: '1px solid var(--border-glass)' }}
              >
                {username[0].toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex flex-col items-start gap-0.5">
                <a
                  href={`https://leetcode.com/u/${username}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  <h3 className="text-xl font-black tracking-tight flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    {studentInfo?.name || user.profile.realName || username}
                    {contest && contest.attendedContestsCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                        RATED
                      </span>
                    )}
                  </h3>
                </a>
                <div className="flex items-center gap-3">
                  <p className="text-xs font-bold mono opacity-60" style={{ color: 'var(--accent)' }}>
                    @{username}
                  </p>
                  {studentInfo?.rollNo && (
                    <p className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--border-glass)] bg-[var(--surface-glass)] opacity-80 mono">
                      {studentInfo.rollNo} {studentInfo.section && `• Sec ${studentInfo.section}`}
                    </p>
                  )}
                </div>
              </div>
              {user.profile.ranking > 0 && (
                <span
                  className="mono text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm"
                  style={{ background: 'var(--surface-glass)', color: 'var(--text)', border: '1px solid var(--border-glass)' }}
                >
                  {getRankLabel(user.profile.ranking)}
                </span>
              )}
            </div>
            <div className="flex gap-3 mt-2 flex-wrap text-sm">
              {user.profile.countryCode && (
                <span style={{ color: 'var(--muted)' }} className="flex items-center gap-1">📍 <span style={{ color: 'var(--text)' }}>{user.profile.countryCode}</span></span>
              )}
              {user.profile.company && (
                <span style={{ color: 'var(--muted)' }} className="flex items-center gap-1">🏢 <span style={{ color: 'var(--text)' }}>{user.profile.company}</span></span>
              )}
            </div>
          </div>
        </div>

        {/* Ring chart + difficulty rows */}
        <div className="flex items-center gap-6 mb-7 parallax-inner" style={{ transform: 'translateZ(20px)' }}>
          <RingChart easy={easy} medium={medium} hard={hard} total={total} size={110} />
          <div className="flex-1 space-y-3">
            <DiffRow label="Easy"   count={easy}   beats={easyBeats} color="var(--easy)"   />
            <DiffRow label="Medium" count={medium} beats={medBeats}  color="var(--medium)" />
            <DiffRow label="Hard"   count={hard}   beats={hardBeats} color="var(--hard)"   />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-4 rounded-xl parallax-inner" style={{ background: 'var(--surface-glass)', border: '1px solid var(--border-glass)', transform: 'translateZ(10px)' }}>
          <StatItem label="Acceptance"  value={acceptance} suffix="%" />
          <StatItem label="Submissions" value={totalSubs} />
          <StatItem label="Streak"      value={user.userCalendar?.streak ?? 0} suffix="d" />
          <StatItem label="Active Days" value={user.userCalendar?.totalActiveDays ?? 0} />
          {contest && (
            <>
              <StatItem label="Contest Rating" value={Math.round(contest.rating)} highlight />
              <StatItem label="Contests"        value={contest.attendedContestsCount} />
              <StatItem label="Global Rank"     value={contest.globalRanking} />
              <StatItem label="Top"             value={contest.topPercentage || 0} suffix="%" />
            </>
          )}
          {user.profile.reputation > 0 && (
            <StatItem label="Reputation" value={user.profile.reputation} />
          )}
        </div>

        {/* Consistency Score */}
        <div className="mb-6 parallax-inner" style={{ transform: 'translateZ(10px)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] tracking-widest uppercase font-bold" style={{ color: 'var(--muted)' }}>Consistency Score</span>
            <span className="mono text-sm font-bold" style={{ color: 'var(--text)' }}>{consistencyScore} / 100</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${consistencyScore}%`,
                background: consistencyScore < 40 ? 'var(--hard)' : consistencyScore < 70 ? 'var(--medium)' : 'var(--easy)',
                boxShadow: `0 0 10px ${consistencyScore < 40 ? 'var(--hard)' : consistencyScore < 70 ? 'var(--medium)' : 'var(--easy)'}60`,
              }}
            />
          </div>
        </div>

        {/* Contest badge */}
        {contest?.badge && (
          <div className="mb-5 parallax-inner" style={{ transform: 'translateZ(15px)' }}>
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-full mono inline-flex items-center gap-1.5 shadow-md"
              style={{
                background: `${getContestBadgeColor(contest.badge.name)}25`,
                color:       getContestBadgeColor(contest.badge.name),
                border:      `1px solid ${getContestBadgeColor(contest.badge.name)}60`,
              }}
            >
              🏆 {contest.badge.name}
            </span>
          </div>
        )}

        {/* Top tags */}
        {topTags.length > 0 && (
          <div className="parallax-inner mb-5" style={{ transform: 'translateZ(10px)' }}>
            <div className="text-[10px] tracking-widest font-bold mb-3 uppercase" style={{ color: 'var(--muted)' }}>Top Topics</div>
            <div className="flex flex-wrap gap-2">
              {topTags.map(tag => (
                <span
                  key={tag.tagName}
                  className="mono text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors hover:bg-white/5"
                  style={{ background: 'var(--surface-glass)', color: 'var(--text)', border: '1px solid var(--border-glass)' }}
                >
                  {tag.tagName}
                  <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{tag.problemsSolved}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        {user.badges.length > 0 && (
          <div className="mt-5 parallax-inner" style={{ transform: 'translateZ(10px)' }}>
            <div className="text-[10px] tracking-widest font-bold mb-3 uppercase" style={{ color: 'var(--muted)' }}>
              Badges ({user.badges.length})
            </div>
            <div className="flex gap-2.5 flex-wrap">
              {user.badges.slice(0, 6).map(badge => (
                <div key={badge.id} title={badge.displayName} className="hover:scale-110 transition-transform cursor-pointer">
                  {badge.icon
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={badge.icon} alt={badge.displayName} className="w-9 h-9 object-contain drop-shadow-md" />
                    : <span className="text-2xl drop-shadow-md">🏅</span>
                  }
                </div>
              ))}
              {user.badges.length > 6 && (
                <span className="text-xs flex items-center justify-center font-bold px-2 rounded-lg" style={{ color: 'var(--muted)', background: 'var(--surface-glass)' }}>
                  +{user.badges.length - 6}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Topic Heatmap */}
        <TopicHeatmap data={data} />
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
    <div className="flex items-center justify-between gap-3">
      <span
        className="mono text-xs font-bold px-2.5 py-1 rounded shadow-inner"
        style={{ color, background: `${color}15`, minWidth: 56, textAlign: 'center', border: `1px solid ${color}30` }}
      >
        {label}
      </span>
      <span className="mono text-[15px] font-bold flex-1 text-right tracking-tight gsap-counter" data-value={count} style={{ color: 'var(--text)' }}>
        0
      </span>
      {beats != null && (
        <span className="mono text-xs text-right opacity-80" style={{ color: color, minWidth: 64 }}>
           <span className="opacity-60 text-[10px] mr-1">beats</span>
           <span className="font-semibold gsap-counter" data-value={beats} data-suffix="%">0%</span>
        </span>
      )}
    </div>
  )
}

function StatItem({ label, value, highlight, suffix }: { label: string; value: number; highlight?: boolean; suffix?: string }) {
  return (
    <div className="flex flex-col">
      <div className="text-[10px] tracking-wider uppercase mb-1 opacity-80" style={{ color: 'var(--muted)' }}>{label}</div>
      <div className="mono font-bold text-base flex items-baseline gap-0.5" style={{ color: highlight ? 'var(--accent)' : 'var(--text)' }}>
        {label === 'Global Rank' ? <span className="text-xs text-muted">#</span> : null}
        <span className="gsap-counter" data-value={value} data-suffix={suffix}>0</span>
        {suffix === 'd' && <span className="text-xs text-muted ml-0.5">d</span>}
      </div>
    </div>
  )
}
