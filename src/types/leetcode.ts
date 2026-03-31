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

// ── Submissions ────────────────────────────────────────────────────────────

export interface Submission {
  id: string
  title: string
  titleSlug: string
  timestamp: string
  lang: string
}

export interface SubmissionDetails {
  runtime: string
  runtimePercentile: number
  memory: string
  memoryPercentile: number
  code: string
  lang: { name: string; verboseName: string }
  question: {
    title: string
    titleSlug: string
    difficulty: string
    questionFrontendId: string
    topicTags: { name: string; slug: string }[]
  }
  timestamp: string
  codeUnavailable?: boolean
}

export interface Question {
  questionFrontendId: string
  title: string
  titleSlug: string
  difficulty: string
  content: string
  topicTags: { name: string; slug: string }[]
  hints: string[]
  exampleTestcases: string
}

// ── AI / Interview ─────────────────────────────────────────────────────────

export interface Message {
  role: 'user' | 'assistant'
  content: string
  rating?: 'bad' | 'average' | 'good' | 'perfect'
}

export interface InterviewConfig {
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed'
  mode: 'submitted-code' | 'custom-topics'
  selectedSubmissionIds: string[]
  topics: string[]
  numQuestions: number
  style: 'conversational' | 'strict'
}

export interface QuestionResult {
  question: string
  performance: 'strong' | 'partial' | 'missed'
  feedback: string
}

export interface InterviewSummaryResult {
  overallScore: number
  totalQuestions: number
  questionResults: QuestionResult[]
  overallFeedback: string
  topStrength: string
  topImprovement: string
  interviewReadiness: 'Not Ready' | 'Needs Work' | 'Almost There' | 'Ready'
}
