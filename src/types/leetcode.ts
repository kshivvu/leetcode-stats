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
  studentInfo?: StudentInfo
}

export interface StudentInfo {
  name: string
  rollNo: string
  leetcodeUrl: string
  section?: string
  branch?: string
}
