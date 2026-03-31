import { LeetCodeData } from '@/types/leetcode'
import { getSolvedCount, getAcceptanceRate, getTopTags } from '@/lib/utils'

// Suffix appended to every prompt that expects JSON output
export const JSON_SUFFIX = `

You must respond with ONLY a valid JSON object.
No markdown. No explanation. No code fences.
The first character of your response must be { and the last must be }.`

// ── Profile context builder ────────────────────────────────────────────────

export function buildProfileContext(
  username: string,
  data: LeetCodeData,
  studentName?: string
): string {
  const user    = data.matchedUser
  const contest = data.userContestRanking
  const easy    = getSolvedCount(user.submitStats.acSubmissionNum, 'Easy')
  const medium  = getSolvedCount(user.submitStats.acSubmissionNum, 'Medium')
  const hard    = getSolvedCount(user.submitStats.acSubmissionNum, 'Hard')
  const total   = getSolvedCount(user.submitStats.acSubmissionNum, 'All')
  const tags    = getTopTags(data, 10).map(t => `${t.tagName}(${t.problemsSolved})`).join(', ')

  return `STUDENT PROFILE:
Name: ${studentName || user.profile.realName || username}
LeetCode Username: ${username}
Country: ${user.profile.countryCode || 'N/A'}
Company/School: ${user.profile.company || user.profile.school || 'N/A'}

PROBLEM SOLVING:
Easy: ${easy} | Medium: ${medium} | Hard: ${hard} | Total: ${total}
Hard ratio: ${total > 0 ? ((hard / total) * 100).toFixed(1) : 0}%
Acceptance Rate: ${getAcceptanceRate(data)}%
Streak: ${user.userCalendar?.streak ?? 0} days | Active Days: ${user.userCalendar?.totalActiveDays ?? 0}
Top Topics: ${tags}

CONTEST:
Rating: ${contest?.rating ? Math.round(contest.rating) : 'N/A'}
Global Rank: ${contest?.globalRanking ?? 'N/A'}
Top Percentile: ${contest?.topPercentage ?? 'N/A'}%
Contests Attended: ${contest?.attendedContestsCount ?? 0}
Contest Badge: ${contest?.badge?.name ?? 'None'}`
}

// ── Scorecard (streaming, plain text) ─────────────────────────────────────

export function scorecardStreamPrompt(profileContext: string): string {
  return `You are an elite Tech Placement Officer. Your task is to provide a high-impact, short, and crisp analysis of this student's LeetCode profile.

${profileContext}

CONSTRAINTS:
- Be extremely punchy and direct.
- Use bullet points for everything.
- Total response length should not exceed 250 words.
- Focus strictly on: Skill Level, Consistency, Problem Diversity, and Placement Readiness.
- No introductory or concluding filler. Start directly with the analysis.`
}

// ── AI Chat (conversational, streaming) ───────────────────────────────────

export function chatSystemPrompt(profileContext: string): string {
  return `You are a helpful, senior technical mentor. Answer questions about this LeetCode profile.

${profileContext}

STYLE RULES:
- Keep responses short, crisp, and to the point.
- Use bullet points for readability.
- If a question is simple, give a 1-2 sentence answer.
- Avoid corporate fluff. Be technical and direct.`
}

// ── Code Review (streaming) ────────────────────────────────────────────────

export function codeReviewSystemPrompt(
  profileContext: string,
  problemTitle: string,
  problemStatement: string,
  code: string,
  language: string,
  runtime: string,
  memory: string
): string {
  return `You are an expert Code Reviewer. Analyze the student's code for: ${problemTitle}.

STRICT RULES:
- Be brutally concise.
- List exactly 3-4 most critical improvement points or logic bugs.
- Use single-sentence bullet points.
- Provide a brief optimized code snippet ONLY if it significantly improves the logic.

Code (${language}):
${code}

Output format:
### ⚡ Quick Review
- [Point 1]
- [Point 2]
- [Point 3]

### 💡 Refined Logic
[Brief Snippet / Explanation]

Be technical and direct.`
}

// ── Mock Interview (streaming, conversational) ─────────────────────────────

export function mockInterviewSystemPrompt(
  profileContext: string,
  submissionsContext: string,
  config: {
    difficulty: string
    topics: string[]
    mode: 'submitted-code' | 'custom-topics'
    style: 'conversational' | 'strict'
    numQuestions: number
  }
): string {
  return `You are a world-class Technical Interview Assistant helping a human interviewer conduct a mock interview for a student.
Your role is to guide the interviewer by suggesting high-quality questions and providing expected answers.

${profileContext}

${config.mode === 'submitted-code'
  ? `STUDENT'S RECENT SUBMISSIONS (base your suggestions on these):\n${submissionsContext}`
  : `TOPICS TO COVER: ${config.topics.join(', ')}`
}

INTERVIEW RULES:
- Suggest EXACTLY ONE question per turn. Be short and direct.
- Question should be 1-2 sentences max.
- Expected Answer should be a short, crisp bulleted list of logic points.
- ${config.mode === 'submitted-code'
    ? 'MANDATORY: For every question about a specific problem, specify the [CODE_ID] from the provided context (e.g. 0, 1, 2).'
    : 'Suggest fresh coding/conceptual problems on the specified topics.'
  }
- Difficulty: ${config.difficulty}
- Style: ${config.style === 'strict' ? 'STRICT' : 'MENTOR'}
- Total questions to suggest: ${config.numQuestions}

RESPONSE FORMAT (Short & Crisp Markdown):
### REFERENCED CODE
[CODE_ID (e.g. 0, 1, 2) OR "None" if general/conceptual]

### SUGGESTED QUESTION
[One sentence question]

### EXPECTED ANSWER
- [Logic point 1]
- [Logic point 2]

### EVALUATION CRITERIA
- [Point 1 to look for]
- [Point 2 to look for]

Wait for the interviewer to provide the student's response (or their own observation/rating) before suggesting the next question.
When the message "GENERATE_SUMMARY_NOW" is received, stop and output the JSON summary.

Start by introducing yourself to the interviewer and suggesting the first question.`
}

// ── Interview Summary (JSON, non-streaming) ────────────────────────────────

export function interviewSummaryPrompt(
  profileContext: string,
  conversationHistory: string
): string {
  return `Analyze this completed mock interview conducted by a human interviewer with your assistance.
Use the student's responses AND the interviewer's explicit ratings provided in the history to produce a final evaluation summary.

${profileContext}

FULL INTERVIEW TRANSCRIPT (Includes interviewer ratings for each turn):
${conversationHistory}

Respond with a JSON object with exactly these keys:
- overallScore: number 0-10 (Calculate based on the average of interviewer ratings: bad=2, average=5, good=8, perfect=10)
- totalQuestions: number
- questionResults: array of objects each with:
    { question: string, performance: "strong"|"partial"|"missed", feedback: string (reference why the interviewer gave that rating) }
- overallFeedback: string (2-3 sentences based on the pattern of ratings)
- topStrength: string
- topImprovement: string
- interviewReadiness: "Not Ready" | "Needs Work" | "Almost There" | "Ready"
${JSON_SUFFIX}`
}
