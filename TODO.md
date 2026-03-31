# TODO.md — LeetCode Stats: Feature Roadmap for Claude Code

This file lists all pending features to be built into the existing Next.js project (`leetcode-stats`).
Read `CLAUDE.md` first to understand the existing codebase before implementing anything here.

---

## How to Use This File

Each feature below is a self-contained task. Work on them **one at a time**, in order.
After completing each feature, mark it done and move to the next.

---

## Feature 1 — Export to Excel/PDF Report

### What to build
A button that exports all currently loaded profiles into a downloadable Excel file (.xlsx) with one row per student.

### New files to create
- `src/lib/exportExcel.ts` — export logic
- Install `xlsx` package: `npm install xlsx`

### Columns in the Excel export
| Column | Value |
|---|---|
| Name | `student.name` if CSV mode, else `matchedUser.profile.realName` or username |
| Roll No | `student.rollNo` if available, else `—` |
| Section | `student.section` if available |
| Branch | `student.branch` if available |
| LeetCode Username | `username` |
| Easy Solved | `acSubmissionNum[Easy].count` |
| Medium Solved | `acSubmissionNum[Medium].count` |
| Hard Solved | `acSubmissionNum[Hard].count` |
| Total Solved | `acSubmissionNum[All].count` |
| Acceptance Rate | computed: `acSubmissions / totalSubmissions * 100` |
| Streak (days) | `userCalendar.streak` |
| Active Days | `userCalendar.totalActiveDays` |
| Contest Rating | `userContestRanking.rating` |
| Global Rank | `userContestRanking.globalRanking` |
| Top % | `userContestRanking.topPercentage` |
| Contest Badge | `userContestRanking.badge.name` |
| Badges Count | `badges.length` |
| Profile URL | `https://leetcode.com/u/{username}/` |

### Implementation notes
- Use the `xlsx` npm package (SheetJS) to generate the file client-side
- Trigger download via `URL.createObjectURL(blob)`
- Add an **"Export Excel"** button in the status bar (only visible when `successCount > 0`)
- Style the button with `var(--easy)` color
- Filename: `leetcode_report_{date}.xlsx` where date is `YYYY-MM-DD`
- Skip profiles that have `error` or are still `loading`

---

## Feature 2 — Leaderboard / Table View

### What to build
A toggle between the existing **Card View** and a new **Leaderboard View** — a ranked table sorted by total problems solved.

### UI changes
- Add a view toggle in the status bar: `⊞ Cards` | `☰ Leaderboard`
- Only show the toggle when results are loaded

### Leaderboard table columns
| # | Name / Roll No | Username | Easy | Medium | Hard | Total | Streak | Contest Rating | Status |
|---|---|---|---|---|---|---|---|---|---|

### Implementation notes
- Create `src/components/LeaderboardTable.tsx`
- Rank starts from 1, sorted by **Total Solved descending** by default
- Clicking a column header sorts by that column (toggle asc/desc)
- Each row: clicking the username opens the LeetCode profile in a new tab
- Highlight rank 1, 2, 3 rows with gold / silver / bronze left border
- Show a `—` for missing data (e.g. no contest rating)
- Error profiles still appear in the table, shown as a greyed-out row with "Profile not found" in the Total column
- Mobile: horizontally scrollable table

### Style
- Table background: `var(--surface)`
- Header background: `var(--surface2)`
- Row hover: subtle `var(--border)` background
- Font: `mono` for all numbers
- Rank 1 border-left: `var(--accent)`
- Rank 2 border-left: `#aaa`
- Rank 3 border-left: `#cd7f32`

---

## Feature 3 — Inactivity Alert / Status Badges

### What to build
Automatically flag students who haven't submitted anything recently. Show a colored badge on each card and in the leaderboard.

### Logic
| Status | Condition | Badge color |
|---|---|---|
| 🔥 Active | Submitted in last 7 days | `var(--easy)` green |
| 😐 Slowing | Submitted in last 30 days but not last 7 | `var(--medium)` yellow |
| ❌ Inactive | No submission in 30+ days | `var(--hard)` red |
| ❓ Unknown | `submissionCalendar` is empty or null | `var(--muted)` grey |

### Implementation notes
- `userCalendar.submissionCalendar` is a JSON string: `{ "1700000000": 3, "1700086400": 1, ... }` where keys are Unix timestamps
- Parse it and find the most recent timestamp
- Compare against `Date.now() / 1000`
- Create `src/lib/activityStatus.ts` with a `getActivityStatus(calendar: string)` function returning `{ label, color, emoji }`
- Show the badge:
  - On `ProfileCard`: top-right corner of the card, small pill
  - On `LeaderboardTable`: in a "Status" column
- Add to `src/lib/utils.ts` or a new file — do not inline in components

---

## Feature 4 — Class Summary Dashboard

### What to build
A summary panel that appears **above the results grid** after profiles are loaded, showing aggregate stats for the entire batch.

### Create
- `src/components/ClassSummary.tsx`

### Stats to show
| Stat | How to compute |
|---|---|
| Total Students | `results.length` |
| Successfully Loaded | `successCount` |
| Avg Total Solved | mean of all `Total Solved` |
| Avg Contest Rating | mean of all `contest.rating` (exclude nulls) |
| Highest Streak | max `userCalendar.streak` across all profiles |
| Active This Week | count where activity status = "Active" |
| Inactive (30d+) | count where activity status = "Inactive" |
| Total Hard Solved | sum of all `hard` counts |
| Best Performer | username/name with highest total solved |
| Most Consistent | username/name with highest streak |

### Style
- Horizontal scrollable row of stat cards (like a mini dashboard)
- Each stat card: label on top in `var(--muted)`, value below in large `mono` bold
- Highlight "Active This Week" in `var(--easy)`, "Inactive" in `var(--hard)`
- "Best Performer" and "Most Consistent" show the student's name with a small trophy emoji

---

## Feature 5 — Problem Assignment Checker

### What to build
A panel where the dean can enter a LeetCode problem URL or slug and check which students have solved it recently (last 20 accepted submissions).

### New API route
- `src/app/api/recent-submissions/route.ts`

### GraphQL query to add
```graphql
query recentAcSubmissions($username: String!, $limit: Int!) {
  recentAcSubmissionList(username: $username, limit: $limit) {
    id
    title
    titleSlug
    timestamp
  }
}
```
- Call with `limit: 20`
- Endpoint: `https://leetcode.com/graphql` (same proxy pattern as existing API route)

### UI
- Create `src/components/ProblemChecker.tsx`
- Show it below the Class Summary (only when profiles are loaded)
- Input: a text field accepting either:
  - Full URL: `https://leetcode.com/problems/two-sum/`
  - Just the slug: `two-sum`
- Extract the slug from the URL with a regex
- On submit: fire `recentAcSubmissionList` for every loaded (non-error) profile in parallel
- Show a result table:

| Student | Roll No | Solved? | When |
|---|---|---|---|
| Rahul Sharma | 21CS001 | ✅ Yes | 3 days ago |
| Priya Singh | 21CS002 | ❌ Not in recent | — |

- "Not in recent" means not found in last 20 submissions — add a tooltip: "Only checks last 20 accepted submissions"
- Show a summary line: "X / Y students solved this problem"

### Implementation notes
- Parse problem slug: `/problems\/([a-z0-9-]+)/` from the input
- Re-use the same fetch + proxy pattern from the existing API route
- `timestamp` is Unix seconds — convert to relative time ("2 days ago", "1 week ago")

---

## Feature 6 — Save & Load Batches (Local Storage)

### What to build
Let the dean save a loaded batch of student URLs under a name (e.g. "CSE Section A — 2025") and reload it instantly next time.

### UI
- Add a small **"Save Batch"** button in the status bar (only when results are loaded)
- Clicking it opens a small inline input: "Batch name:" → Save
- Saved batches appear as clickable chips below the input area
- Clicking a chip re-fetches that batch immediately
- An ✕ on each chip deletes it

### Storage
- Use `localStorage` key: `lc_batches`
- Value: `{ [batchName]: string[] }` where the array is the list of LeetCode URLs
- If loaded from CSV, store the URLs (not the full student info — that comes from the CSV re-upload)

### Implementation notes
- Create `src/lib/batchStorage.ts` with:
  - `saveBatch(name: string, urls: string[]): void`
  - `loadBatches(): Record<string, string[]>`
  - `deleteBatch(name: string): void`
- Create `src/components/SavedBatches.tsx` for the chips UI
- Show chips between the input area and the results grid
- Max 10 saved batches — if over limit, show a warning

---

## Feature 7 — Shareable Report Link

### What to build
Generate a URL like:
`http://localhost:3000/?users=lee215,tourist,neal_wu`

That anyone can open to automatically fetch those profiles — no need to re-paste.

### Implementation notes
- On page load, check `window.location.search` for a `?users=` param
- If found, parse the comma-separated usernames and auto-fetch them
- Add a **"Share Link"** button in the status bar (only when results are loaded)
- On click: construct the URL and copy it to clipboard
- Show a brief "Copied!" toast notification (auto-dismiss after 2 seconds)
- Create `src/components/Toast.tsx` — a small fixed notification at bottom-right
- Toast style: `var(--surface2)` background, `var(--easy)` left border, slide-in animation

---

## Feature 8 — Consistency Score

### What to build
A single computed score (0–100) per student that represents how consistently they practice. Show it on the card and leaderboard.

### Formula
```
consistencyScore = (
  (streak / 365 * 40)           // up to 40 pts for streak
+ (totalActiveDays / 365 * 30)  // up to 30 pts for active days
+ (totalSolved / 1000 * 20)     // up to 20 pts for solve volume
+ (acceptanceRate / 100 * 10)   // up to 10 pts for quality
)
```
Cap at 100. Round to nearest integer.

### Implementation notes
- Add `getConsistencyScore(data: LeetCodeData): number` to `src/lib/utils.ts`
- Show on `ProfileCard`: a small horizontal progress bar below the stats grid
  - Label: "Consistency Score"
  - Bar fill color: gradient from `var(--hard)` (low) → `var(--medium)` → `var(--easy)` (high)
  - Show the number on the right: e.g. `73 / 100`
- Add as a sortable column in `LeaderboardTable`

---

## Feature 9 — Topic Coverage Heatmap

### What to build
A visual grid showing how well a student covers major DSA topics, shown inside the ProfileCard (collapsed by default, expandable).

### Topics to cover (use these exact slugs to match `tagProblemCounts`)
```
array, string, hash-table, dynamic-programming, math, sorting,
greedy, depth-first-search, breadth-first-search, binary-search,
two-pointers, sliding-window, tree, graph, heap-priority-queue,
backtracking, stack, linked-list, trie, union-find
```

### Implementation notes
- Create `src/components/TopicHeatmap.tsx`
- For each topic, find its `problemsSolved` from `tagProblemCounts` (search all three tiers)
- Color intensity based on count:
  - 0 problems: `var(--surface2)` (empty)
  - 1–5: very faint accent
  - 6–15: medium accent
  - 16–30: strong accent
  - 30+: full `var(--accent)` gold
- Layout: 4-column grid of small squares with topic name below each
- Show a "▼ Topic Coverage" toggle button at the bottom of ProfileCard to expand/collapse
- Tooltip on hover: "{topic}: {count} solved"

---

## Feature 10 — Dark / Light Mode Toggle

### What to build
A theme toggle button (🌙 / ☀️) in the top-right corner of the page that switches between the existing dark theme and a light theme.

### Light theme CSS variables (add to `globals.css`)
```css
[data-theme="light"] {
  --bg: #f5f5f0;
  --surface: #ffffff;
  --surface2: #f0f0ea;
  --border: #ddddd5;
  --accent: #d4920a;
  --accent2: #c04a00;
  --easy: #008f83;
  --medium: #d4920a;
  --hard: #d42048;
  --text: #1a1a1a;
  --muted: #6b6b6b;
}
```

### Implementation notes
- Add a floating button fixed at `top: 1rem; right: 1rem`
- On click: toggle `data-theme` attribute on `document.documentElement`
- Persist preference in `localStorage` key: `lc_theme`
- On page load: read from localStorage and apply before first render (add to `layout.tsx` via a `<script>` tag to avoid flash)
- Create `src/components/ThemeToggle.tsx`
- Add `<ThemeToggle />` to `layout.tsx`

---

## General Implementation Rules

Follow these rules for every feature above:

1. **Never break existing features.** Test that CSV upload, manual URL input, and card rendering still work after each change.

2. **Reuse existing patterns.** All API calls go through Next.js proxy routes in `src/app/api/`. Never call `leetcode.com` directly from client components.

3. **TypeScript strict.** No `any` types. Extend `src/types/leetcode.ts` if new types are needed.

4. **CSS variables only.** Never hardcode colors. Always use `var(--accent)`, `var(--surface)`, etc.

5. **`'use client'` directive.** Add it to any component that uses `useState`, `useEffect`, `useCallback`, `useRef`, or browser APIs.

6. **Graceful degradation.** If a field is missing (e.g. `userContestRanking` is null, or `submissionCalendar` is empty), show `—` or `0`, never crash.

7. **Loading states.** Any async action (export, problem check, batch load) must show a loading indicator while in progress.

8. **Mobile friendly.** All new components must be usable on a phone screen. Use `overflow-x-auto` for tables, `flex-wrap` for tag rows.

9. **One feature at a time.** Complete and verify each feature before starting the next.

10. **Update `CLAUDE.md`** after finishing all features to reflect the final file structure and component list.
