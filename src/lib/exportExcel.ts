import * as XLSX from 'xlsx'
import { ProfileResult } from '@/types/leetcode'
import { getSolvedCount, getAcceptanceRate, formatNumber } from './utils'

export interface ExcelRow {
  'Name': string
  'Roll No': string
  'Section': string
  'Branch': string
  'LeetCode Username': string
  'Easy Solved': number
  'Medium Solved': number
  'Hard Solved': number
  'Total Solved': number
  'Acceptance Rate': string
  'Streak (days)': number
  'Active Days': number
  'Contest Rating': string
  'Global Rank': string
  'Top %': string
  'Contest Badge': string
  'Badges Count': number
  'Profile URL': string
}

/**
 * Exports profile results to an Excel file.
 * Note: Roll No, Section, Branch are placeholders since we don't have CSV upload yet.
 */
export function exportToExcel(results: ProfileResult[]): void {
  // Filter out loading and error profiles
  const validResults = results.filter(r => !r.loading && r.data)

  if (validResults.length === 0) return

  const rows: ExcelRow[] = validResults.map(result => {
    const data = result.data!
    const user = data.matchedUser
    const contest = data.userContestRanking

    const easy = getSolvedCount(user.submitStats.acSubmissionNum, 'Easy')
    const medium = getSolvedCount(user.submitStats.acSubmissionNum, 'Medium')
    const hard = getSolvedCount(user.submitStats.acSubmissionNum, 'Hard')
    const total = getSolvedCount(user.submitStats.acSubmissionNum, 'All')
    const acceptance = getAcceptanceRate(data)

    const sInfo = result.studentInfo
    return {
      'Name': sInfo?.name || user.profile.realName || result.username,
      'Roll No': sInfo?.rollNo || '—',
      'Section': sInfo?.section || '—',
      'Branch': sInfo?.branch || '—',
      'LeetCode Username': result.username,
      'Easy Solved': easy,
      'Medium Solved': medium,
      'Hard Solved': hard,
      'Total Solved': total,
      'Acceptance Rate': `${acceptance}%`,
      'Streak (days)': user.userCalendar?.streak ?? 0,
      'Active Days': user.userCalendar?.totalActiveDays ?? 0,
      'Contest Rating': contest ? Math.round(contest.rating).toString() : '—',
      'Global Rank': contest ? `#${formatNumber(contest.globalRanking)}` : '—',
      'Top %': contest ? `${contest.topPercentage?.toFixed(1)}%` : '—',
      'Contest Badge': contest?.badge?.name || '—',
      'Badges Count': user.badges.length,
      'Profile URL': `https://leetcode.com/u/${result.username}/`,
    }
  })

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(rows)

  // Set column widths
  const colWidths = [
    { wch: 20 }, // Name
    { wch: 10 }, // Roll No
    { wch: 10 }, // Section
    { wch: 10 }, // Branch
    { wch: 20 }, // Username
    { wch: 12 }, // Easy Solved
    { wch: 12 }, // Medium Solved
    { wch: 12 }, // Hard Solved
    { wch: 12 }, // Total Solved
    { wch: 15 }, // Acceptance Rate
    { wch: 12 }, // Streak
    { wch: 12 }, // Active Days
    { wch: 15 }, // Contest Rating
    { wch: 12 }, // Global Rank
    { wch: 10 }, // Top %
    { wch: 15 }, // Contest Badge
    { wch: 12 }, // Badges Count
    { wch: 40 }, // Profile URL
  ]
  worksheet['!cols'] = colWidths

  // Create workbook and append worksheet
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'LeetCode Profiles')

  // Generate filename with current date
  const date = new Date()
  const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
  const filename = `leetcode_report_${dateStr}.xlsx`

  // Download the file
  XLSX.writeFile(workbook, filename)
}
