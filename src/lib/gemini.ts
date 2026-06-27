const MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3-flash-preview',
  'gemini-2.5-pro',
  'gemini-flash-latest',
  'gemini-pro-latest'
]

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function convertMessagesToGemini(messages: Message[]) {
  const systemMessage = messages.find(m => m.role === 'system')
  const systemInstruction = systemMessage
    ? {
        parts: [{ text: systemMessage.content }],
      }
    : undefined

  const rawContents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
      parts: [{ text: m.content }],
    }))

  // Gemini requires that the first message is 'user', and roles alternate.
  // It also requires at least one message in contents.
  let contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = []

  if (rawContents.length === 0) {
    contents = [{
      role: 'user',
      parts: [{ text: 'Please introduce yourself and suggest the first interview question.' }],
    }]
  } else {
    // Collapse consecutive messages with the same role
    for (const m of rawContents) {
      if (contents.length > 0 && contents[contents.length - 1].role === m.role) {
        contents[contents.length - 1].parts[0].text += '\n\n' + m.parts[0].text
      } else {
        contents.push(m)
      }
    }
  }

  return { systemInstruction, contents }
}

/**
 * Returns a ReadableStream of text chunks.
 * Pipe this directly from a Next.js API route to the frontend.
 */
export async function streamCompletion(
  messages: Message[],
  maxTokens = 1500
): Promise<ReadableStream> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set')
  }

  const { systemInstruction, contents } = convertMessagesToGemini(messages)
  let lastError: Error | null = null

  for (const model of MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            systemInstruction,
            generationConfig: {
              maxOutputTokens: maxTokens,
              temperature: 0.3,
            },
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        const status = response.status

        if (status === 429 || status >= 500) {
          lastError = new Error(`Gemini stream error (${model}): ${status} - ${errorText}`)
          console.warn(`[Gemini Stream] Model ${model} failed with ${status}. Falling back...`)
          continue
        }

        throw new Error(`Gemini stream error (${model}): ${status} - ${errorText}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      return new ReadableStream({
        async pull(controller) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              // Process remaining buffer
              if (buffer.trim()) {
                const line = buffer.trim()
                if (line.startsWith('data: ')) {
                  try {
                    const parsed = JSON.parse(line.slice(6))
                    const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
                    if (text) controller.enqueue(new TextEncoder().encode(text))
                  } catch { /* ignore */ }
                }
              }
              controller.close()
              break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            // Keep the last chunk (potentially partial) in the buffer
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed.startsWith('data: ')) continue
              const data = trimmed.slice(6).trim()
              try {
                const parsed = JSON.parse(data)
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
                if (text) {
                  controller.enqueue(new TextEncoder().encode(text))
                }
              } catch {
                /* skip malformed chunks */
              }
            }
          }
        },
      })
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.warn(`[Gemini Stream] Model ${model} failed with error: ${lastError.message}. Falling back...`)
    }
  }

  throw new Error(`All models failed to start streaming. Last error: ${lastError?.message}`)
}

/**
 * Returns a complete string response (non-streaming).
 * Use this when you need to parse structured JSON from the AI.
 */
export async function completeCompletion(
  messages: Message[],
  maxTokens = 1500
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set')
  }

  const { systemInstruction, contents } = convertMessagesToGemini(messages)
  let lastError: Error | null = null

  for (const model of MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            systemInstruction,
            generationConfig: {
              maxOutputTokens: maxTokens,
              temperature: 0.3,
            },
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        const status = response.status

        if (status === 429 || status >= 500) {
          lastError = new Error(`Gemini error (${model}): ${status} - ${errorText}`)
          console.warn(`[Gemini] Model ${model} failed with ${status}. Falling back...`)
          continue
        }

        throw new Error(`Gemini error (${model}): ${status} - ${errorText}`)
      }

      const data = await response.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.warn(`[Gemini] Model ${model} failed with error: ${lastError.message}. Falling back...`)
    }
  }

  throw new Error(`All models failed. Last error: ${lastError?.message}`)
}
