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
