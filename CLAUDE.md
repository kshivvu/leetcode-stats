@AGENTS.md
# LeetCode Stats — CLAUDE.md

You are building a **Next.js 14 (App Router) web application** that fetches and displays LeetCode profile statistics. The user pastes one or more LeetCode profile URLs or usernames, and the app fetches all profiles in parallel and renders them as beautiful stat cards.

Read this file completely before writing any code. Follow every instruction exactly.

---

## Project Overview

**Name:** `leetcode-stats`  
**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS  
**Purpose:** Accept a list of LeetCode profile URLs/usernames → fetch stats from LeetCode's public GraphQL API via a Next.js API proxy route → display rich profile cards side by side.

---

## Implemented Features

1. **Export to Excel**: Download an `.xlsx` report of user stats.
2. **Leaderboard Table View**: A fully-sortable alternative to the Grid view.
3. **Class Summary Dashboard**: Aggregates averages, top streaks, and activities across the entire searched batch.
4. **Problem Assignment Checker**: Check if the loaded profiles have solved a specified LeetCode problem in their recent submissions.
5. **Save & Load Batches**: Persist frequent batch configurations to `window.localStorage`.
6. **Shareable Report Link**: Easily construct dynamic `/?users=...` links generated via a 'Share Link' button + `<Toast>` UI.
7. **Topic Coverage Heatmap**: Expandable visualization of topic completion on an individual's Profile Card.

---

## Setup Commands

After scaffolding all files, run:

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

---

## Complete File Tree

Scaffold **exactly** these files:

```
leetcode-stats/
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/
│   │       ├── leetcode/
│   │       │   └── route.ts
│   │       └── recent-submissions/
│   │           └── route.ts
│   ├── components/
│   │   ├── ClassSummary.tsx
│   │   ├── ErrorCard.tsx
│   │   ├── LeaderboardTable.tsx
│   │   ├── ProblemChecker.tsx
│   │   ├── ProfileCard.tsx
│   │   ├── RingChart.tsx
│   │   ├── SavedBatches.tsx
│   │   ├── SkeletonCard.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── Toast.tsx
│   │   └── TopicHeatmap.tsx
│   ├── lib/
│   │   ├── activityStatus.ts
│   │   ├── batchStorage.ts
│   │   ├── exportExcel.ts
│   │   └── utils.ts
│   └── types/
│       └── leetcode.ts
```

---

## File Contents

### `package.json`

```json
{
  "name": "leetcode-stats",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3.4.0",
    "postcss": "^8",
    "autoprefixer": "^10"
  }
}
```

---

### `next.config.js`

```js
/** @type {import('next').NextConfig} */
const nextConfig = {}
module.exports = nextConfig
```

---

### `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: { extend: {} },
  plugins: [],
}
```

---

### `postcss.config.js`

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

### `src/app/globals.css`

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Syne:wght@400;500;600;700;800&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #0a0a0f;
  --surface: #111118;
  --surface2: #1a1a26;
  --border: #2a2a3d;
  --accent: #f0b429;
  --accent2: #e85d04;
  --easy: #00b8a9;
  --medium: #ffc01e;
  --hard: #ff375f;
  --text: #e8e8f0;
  --muted: #6b6b8a;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Syne', sans-serif;
  min-height: 100vh;
}

body {
  background-image:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(240, 180, 41, 0.08) 0%, transparent 60%),
    repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.015) 39px, rgba(255,255,255,0.015) 40px),
    repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.015) 39px, rgba(255,255,255,0.015) 40px);
}

.mono { font-family: 'JetBrains Mono', monospace; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

.animate-fade-up {
  animation: fadeUp 0.5s ease forwards;
}

.skeleton {
  background: linear-gradient(90deg, var(--surface) 25%, var(--surface2) 50%, var(--surface) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.card-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.card-hover:hover {
  transform: translateY(-2px);
  border-color: rgba(240, 180, 41, 0.3);
  box-shadow: 0 8px 32px rgba(240, 180, 41, 0.08);
}

.ring-chart {
  transform: rotate(-90deg);
  transform-origin: center;
}

textarea:focus { outline: none; }
button:focus   { outline: none; }
```

---

### `src/app/layout.tsx`

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LC Stats — LeetCode Profile Analyzer',
  description: 'Compare and analyze LeetCode profiles side by side',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

---

### `src/types/leetcode.ts`

```ts
export interface SubmissionStat {
  difficulty: string
  count: number
  submissions: number
}

export interface Badge {
  id: string
  displayName: string
  icon: string
  creationDate?: string
}

export interface UserCalendar {
  streak: number
  totalActiveDays: number
  submissionCalendar: string
}

export interface TagCount {
  tagName: string
  tagSlug: string
  problemsSolved: number
}

export interface BeatsStat {
  difficulty: string
  percentage: number
}

export interface ContestRanking {
  attendedContestsCount: number
  rating: number
  globalRanking: number
  totalParticipants: number
  topPercentage: number
  badge?: { name: string }
}

export interface LeetCodeUser {
  username: string
  profile: {
    realName: string
    aboutMe: string
    userAvatar: string
    reputation: number
    ranking: number
    starRating: number
    countryCode: string
    company: string
    school: string
    skillTags: string[]
    websites: string[]
  }
  submitStats: {
    acSubmissionNum: SubmissionStat[]
    totalSubmissionNum: SubmissionStat[]
  }
  badges: Badge[]
  activeBadge?: Badge
  userCalendar: UserCalendar
  problemsSolvedBeatsStats: BeatsStat[]
  tagProblemCounts: {
    advanced: TagCount[]
    intermediate: TagCount[]
    fundamental: TagCount[]
  }
}

export interface LeetCodeData {
  matchedUser: LeetCodeUser
  userContestRanking: ContestRanking | null
}

export interface ProfileResult {
  username: string
  url: string
  data?: LeetCodeData
  error?: string
  loading: boolean
}
```

---

### `src/lib/utils.ts`

```ts
import { LeetCodeData, SubmissionStat } from '@/types/leetcode'

export function extractUsername(url: string): string | null {
  const trimmed = url.trim()
  const match = trimmed.match(/leetcode\.com\/(?:u\/)?([a-zA-Z0-9_-]+)\/?/)
  if (match) return match[1]
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed
  return null
}

export function getSolvedCount(stats: SubmissionStat[], difficulty: string): number {
  return stats.find(s => s.difficulty === difficulty)?.count ?? 0
}

export function getAcceptanceRate(data: LeetCodeData): number {
  const ac    = data.matchedUser.submitStats.acSubmissionNum.find(s => s.difficulty === 'All')
  const total = data.matchedUser.submitStats.totalSubmissionNum.find(s => s.difficulty === 'All')
  if (!ac || !total || total.submissions === 0) return 0
  return Math.round((ac.submissions / total.submissions) * 100 * 10) / 10
}

export function getTopTags(data: LeetCodeData, limit = 5) {
  const all = [
    ...data.matchedUser.tagProblemCounts.advanced,
    ...data.matchedUser.tagProblemCounts.intermediate,
    ...data.matchedUser.tagProblemCounts.fundamental,
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
```

---

### `src/app/api/leetcode/route.ts`

This is the **server-side proxy** that forwards requests to LeetCode's GraphQL API. It prevents CORS errors in the browser.

```ts
import { NextRequest, NextResponse } from 'next/server'

const LEETCODE_API = 'https://leetcode.com/graphql'

const USER_QUERY = `
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      realName
      aboutMe
      userAvatar
      reputation
      ranking
      starRating
      countryCode
      company
      school
      skillTags
      websites
    }
    submitStats {
      acSubmissionNum {
        difficulty
        count
        submissions
      }
      totalSubmissionNum {
        difficulty
        count
        submissions
      }
    }
    badges {
      id
      displayName
      icon
      creationDate
    }
    activeBadge {
      id
      displayName
      icon
    }
    userCalendar {
      streak
      totalActiveDays
      submissionCalendar
    }
    problemsSolvedBeatsStats {
      difficulty
      percentage
    }
    tagProblemCounts {
      advanced {
        tagName
        tagSlug
        problemsSolved
      }
      intermediate {
        tagName
        tagSlug
        problemsSolved
      }
      fundamental {
        tagName
        tagSlug
        problemsSolved
      }
    }
  }
  userContestRanking(username: $username) {
    attendedContestsCount
    rating
    globalRanking
    totalParticipants
    topPercentage
    badge {
      name
    }
  }
}
`

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json()

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const response = await fetch(LEETCODE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0 (compatible)',
      },
      body: JSON.stringify({ query: USER_QUERY, variables: { username } }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `LeetCode API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (data.errors) {
      return NextResponse.json(
        { error: data.errors[0]?.message || 'GraphQL error' },
        { status: 400 }
      )
    }

    if (!data.data?.matchedUser) {
      return NextResponse.json(
        { error: `User "${username}" not found` },
        { status: 404 }
      )
    }

    return NextResponse.json(data.data)
  } catch (err) {
    console.error('LeetCode fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch from LeetCode' }, { status: 500 })
  }
}
```

---

### `src/components/RingChart.tsx`

SVG donut chart showing Easy / Medium / Hard breakdown.

```tsx
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
```

---

### `src/components/SkeletonCard.tsx`

Shimmer placeholder shown while a profile is loading.

```tsx
export function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-6 border card-hover"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="skeleton rounded-full w-14 h-14" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 w-32 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
      </div>
      <div className="flex items-center gap-6 mb-6">
        <div className="skeleton rounded-full w-28 h-28" />
        <div className="flex-1 space-y-3">
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-4 w-5/6 rounded" />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton h-6 w-16 rounded-full" />
        ))}
      </div>
    </div>
  )
}
```

---

### `src/components/ErrorCard.tsx`

```tsx
export function ErrorCard({ username, error }: { username: string; error: string }) {
  return (
    <div
      className="rounded-2xl p-6 border flex flex-col items-center justify-center gap-3 text-center"
      style={{
        background: 'var(--surface)',
        borderColor: 'rgba(255,55,95,0.25)',
        minHeight: 160,
      }}
    >
      <div className="text-3xl">⚠️</div>
      <div>
        <div className="mono font-bold" style={{ color: 'var(--hard)' }}>@{username}</div>
        <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{error}</div>
      </div>
    </div>
  )
}
```

---

### `src/components/ProfileCard.tsx`

The main stats card. Displays avatar, difficulty ring, beats %, acceptance rate, streak, contest ranking, top tags, and badges.

```tsx
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
```

---

### `src/app/page.tsx`

Main page: textarea input → parallel fetching → responsive grid of cards.

```tsx
'use client'

import { useState, useCallback } from 'react'
import { ProfileCard }  from '@/components/ProfileCard'
import { SkeletonCard } from '@/components/SkeletonCard'
import { ErrorCard }    from '@/components/ErrorCard'
import { ProfileResult } from '@/types/leetcode'
import { extractUsername } from '@/lib/utils'

const PLACEHOLDER = `https://leetcode.com/u/neal_wu/\nhttps://leetcode.com/u/tourist/\nlee215`

export default function Home() {
  const [input,     setInput]     = useState('')
  const [results,   setResults]   = useState<ProfileResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchProfile = useCallback(async (url: string): Promise<ProfileResult> => {
    const username = extractUsername(url)
    if (!username) return { username: url, url, error: 'Invalid URL or username', loading: false }

    try {
      const res  = await fetch('/api/leetcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      const json = await res.json()
      if (!res.ok || json.error) return { username, url, error: json.error || 'Failed to fetch', loading: false }
      return { username, url, data: json, loading: false }
    } catch {
      return { username, url, error: 'Network error', loading: false }
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    const lines = input.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) return

    // Deduplicate
    const seen = new Set<string>()
    const unique = lines.filter(line => {
      const key = (extractUsername(line) || line).toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    setResults(unique.map(url => ({ username: extractUsername(url) || url, url, loading: true })))
    setIsLoading(true)

    const fetched = await Promise.all(unique.map(url => fetchProfile(url)))
    setResults(fetched)
    setIsLoading(false)
  }, [input, fetchProfile])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit()
  }

  const loadingCount = results.filter(r =>  r.loading).length
  const successCount = results.filter(r => !r.loading && r.data).length
  const errorCount   = results.filter(r => !r.loading && r.error).length

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 pt-16 pb-10">

        {/* Hero */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 mono text-xs px-3 py-1.5 rounded-full mb-6"
            style={{ background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.2)', color: 'var(--accent)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            LeetCode Profile Analyzer
          </div>

          <h1 className="text-5xl font-extrabold mb-4 leading-tight" style={{ letterSpacing: '-0.02em' }}>
            <span style={{ color: 'var(--text)' }}>Decode any </span>
            <span style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              LeetCode
            </span>
            <span style={{ color: 'var(--text)' }}> profile</span>
          </h1>

          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--muted)' }}>
            Paste one or more LeetCode profile URLs or usernames to fetch and compare stats side by side.
          </p>
        </div>

        {/* Input */}
        <div
          className="max-w-2xl mx-auto rounded-2xl p-1 mb-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <textarea
            className="w-full bg-transparent p-4 text-sm resize-none mono"
            style={{ color: 'var(--text)', minHeight: 120, caretColor: 'var(--accent)' }}
            placeholder={PLACEHOLDER}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
          />
          <div className="flex items-center justify-between px-4 pb-3">
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              One URL or username per line · Ctrl+Enter to fetch
            </span>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
              className="mono text-sm font-bold px-5 py-2 rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: isLoading ? 'var(--surface2)' : 'linear-gradient(135deg, var(--accent), var(--accent2))',
                color: isLoading ? 'var(--muted)' : '#0a0a0f',
              }}
            >
              {isLoading ? '...' : 'Fetch →'}
            </button>
          </div>
        </div>

        {/* Status bar */}
        {results.length > 0 && (
          <div className="max-w-2xl mx-auto flex items-center gap-4 mb-8 px-1">
            <span className="mono text-xs" style={{ color: 'var(--muted)' }}>
              {results.length} profile{results.length > 1 ? 's' : ''}
            </span>
            {loadingCount > 0 && <span className="mono text-xs" style={{ color: 'var(--accent)' }}>⏳ {loadingCount} loading</span>}
            {successCount > 0 && <span className="mono text-xs" style={{ color: 'var(--easy)'   }}>✓ {successCount} loaded</span>}
            {errorCount   > 0 && <span className="mono text-xs" style={{ color: 'var(--hard)'   }}>✕ {errorCount} failed</span>}
          </div>
        )}

        {/* Cards grid */}
        {results.length > 0 && (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
            {results.map((result, i) =>
              result.loading  ? <SkeletonCard key={`${result.username}-${i}`} /> :
              result.error    ? <ErrorCard    key={`${result.username}-${i}`} username={result.username} error={result.error} /> :
              result.data     ? <ProfileCard  key={`${result.username}-${i}`} username={result.username} data={result.data} index={i} /> :
              null
            )}
          </div>
        )}

        {/* Empty state */}
        {results.length === 0 && (
          <div className="max-w-2xl mx-auto mt-8 text-center">
            <div
              className="inline-flex flex-col items-center gap-3 p-8 rounded-2xl"
              style={{ border: '1px dashed var(--border)' }}
            >
              <div className="text-4xl">{'</>'}</div>
              <div className="font-semibold" style={{ color: 'var(--muted)' }}>Paste URLs above to get started</div>
              <div className="text-xs mono" style={{ color: 'var(--border)' }}>
                Supports leetcode.com/u/username or plain usernames
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-8 mt-8">
        <span className="mono text-xs" style={{ color: 'var(--border)' }}>
          Data fetched live from LeetCode&apos;s GraphQL API
        </span>
      </div>
    </main>
  )
}
```

---

## How It Works

```
User pastes URLs/usernames
        │
        ▼
page.tsx → extractUsername() parses each line
        │
        ▼
fetch('/api/leetcode', { username }) × N  ← all parallel
        │
        ▼
route.ts → POST https://leetcode.com/graphql
           (server-side, no CORS issue)
        │
        ▼
GraphQL response → matchedUser + userContestRanking
        │
        ▼
ProfileCard renders: ring chart, beats %, stats grid,
                     top tags, badges, contest rank
```

---

## Data Fetched Per Profile

| Field | Source |
|---|---|
| Avatar, name, countryCode, company | `profile` |
| Easy / Medium / Hard solved | `submitStats.acSubmissionNum` |
| Acceptance rate | `acSubmissions / totalSubmissions` |
| Beats X% | `problemsSolvedBeatsStats` |
| Streak, active days | `userCalendar` |
| Top topics | `tagProblemCounts` (all tiers merged) |
| Badges | `badges` + `activeBadge` |
| Contest rating, global rank, top % | `userContestRanking` |
| Contest badge (Knight / Guardian) | `userContestRanking.badge` |

---

## Notes & Caveats

- **LeetCode rate limits** — if many profiles are fetched rapidly, some may return 429. Handle gracefully (the error card shows the error message).
- **Private profiles** — LeetCode returns `null` for `matchedUser` if the profile is private or doesn't exist; the API route returns a 404 with a clear message.
- **No API key needed** — LeetCode's GraphQL endpoint is public. The `Referer` and `User-Agent` headers are set to mimic a browser.
- **`'use client'`** is required on any component that uses React hooks (`useState`, `useCallback`).
- Do **not** add `images.domains` to `next.config.js`; avatar images are rendered with a plain `<img>` tag (not Next.js `<Image>`) to avoid the hostname configuration requirement.
- **API field change (2026)** — LeetCode changed `country` to `countryCode` in their GraphQL schema. Use `countryCode` in queries and types.

---

## Done

After writing all files and running `npm install && npm run dev`, the app is fully functional. No additional configuration is required.

