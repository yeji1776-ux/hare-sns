import { GoogleGenerativeAI } from '@google/generative-ai'

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.')
  return new GoogleGenerativeAI(apiKey)
}

function parseJson<T>(text: string): T {
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  if (!match) throw new Error('JSON을 파싱할 수 없습니다.')
  return JSON.parse(match[0]) as T
}

export async function callGeminiJson<T>(prompt: string): Promise<T> {
  const model = getClient().getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  })
  const result = await model.generateContent(prompt)
  return parseJson<T>(result.response.text())
}

export async function callGeminiText(prompt: string): Promise<string> {
  const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' })
  const result = await model.generateContent(prompt)
  return result.response.text()
}

export async function streamGeminiText(
  prompt: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
): Promise<() => void> {
  let cancelled = false
  try {
    const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContentStream(prompt)
    for await (const chunk of result.stream) {
      if (cancelled) break
      const text = chunk.text()
      if (text) onChunk(text)
    }
    if (!cancelled) onDone()
  } catch (err) {
    if (!cancelled) onError(err instanceof Error ? err : new Error(String(err)))
  }
  return () => { cancelled = true }
}
