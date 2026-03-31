const BASE_URL = 'https://openrouter.ai/api/v1'
const MODEL    = 'google/gemini-2.0-flash-001'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Returns a ReadableStream of text chunks.
 * Pipe this directly from a Next.js API route to the frontend.
 */
export async function streamCompletion(
  messages: Message[],
  maxTokens = 1500
): Promise<ReadableStream> {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type':  'application/json',
      'HTTP-Referer':  'http://localhost:3000',
      'X-Title':       'LeetCode Stats Analyzer',
    },
    body: JSON.stringify({
      model:      MODEL,
      stream:     true,
      max_tokens: maxTokens,
      messages,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.status}`)
  }

  const reader  = response.body!.getReader()
  const decoder = new TextDecoder()

  return new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) { controller.close(); break }

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') { controller.close(); return }
          try {
            const parsed = JSON.parse(data)
            const text   = parsed.choices?.[0]?.delta?.content
            if (text) controller.enqueue(new TextEncoder().encode(text))
          } catch { /* skip malformed chunks */ }
        }
      }
    },
  })
}

/**
 * Returns a complete string response (non-streaming).
 * Use this when you need to parse structured JSON from the AI.
 */
export async function completeCompletion(
  messages: Message[],
  maxTokens = 1500
): Promise<string> {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type':  'application/json',
      'HTTP-Referer':  'http://localhost:3000',
      'X-Title':       'LeetCode Stats Analyzer',
    },
    body: JSON.stringify({
      model:      MODEL,
      stream:     false,
      max_tokens: maxTokens,
      messages,
    }),
  })

  if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`)
  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}
