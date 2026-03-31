export interface ActivityStatus {
  label: string
  color: string
  emoji: string
}

/**
 * Determines activity status based on submissionCalendar data.
 * @param calendar - JSON string of { timestamp: count } pairs
 * @returns ActivityStatus object with label, color, and emoji
 */
export function getActivityStatus(calendar: string | null | undefined): ActivityStatus {
  // Unknown if calendar is empty or null
  if (!calendar || calendar.trim() === '') {
    return { label: 'Unknown', color: 'var(--muted)', emoji: '❓' }
  }

  try {
    const calendarData = JSON.parse(calendar) as Record<string, number>
    const timestamps = Object.keys(calendarData).map(Number)

    if (timestamps.length === 0) {
      return { label: 'Unknown', color: 'var(--muted)', emoji: '❓' }
    }

    // Find the most recent submission timestamp
    const latestTimestamp = Math.max(...timestamps)
    const now = Date.now() / 1000 // Convert to Unix seconds
    const daysSinceLastSubmission = (now - latestTimestamp) / (60 * 60 * 24)

    if (daysSinceLastSubmission <= 7) {
      return { label: 'Active', color: 'var(--easy)', emoji: '🔥' }
    } else if (daysSinceLastSubmission <= 30) {
      return { label: 'Slowing', color: 'var(--medium)', emoji: '😐' }
    } else {
      return { label: 'Inactive', color: 'var(--hard)', emoji: '❌' }
    }
  } catch {
    return { label: 'Unknown', color: 'var(--muted)', emoji: '❓' }
  }
}
