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

const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'] as const

async function callWithRetry<T>(
  prompt: string,
  config: { responseMimeType?: string },
  parse: (text: string) => T
): Promise<T> {
  for (const modelName of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const model = getClient().getGenerativeModel({
          model: modelName,
          generationConfig: config,
        })
        const result = await model.generateContent(prompt)
        return parse(result.response.text())
      } catch (e: unknown) {
        const msg = String(e)
        if (msg.includes('503') || msg.includes('429') || msg.includes('overloaded') || msg.includes('Service Unavailable')) {
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)))
          continue
        }
        throw e
      }
    }
  }
  throw new Error('Gemini API가 일시적으로 사용 불가합니다. 잠시 후 다시 시도해주세요.')
}

export async function callGeminiJson<T>(prompt: string): Promise<T> {
  return callWithRetry<T>(prompt, { responseMimeType: 'application/json' }, (text) => parseJson<T>(text))
}

export async function callGeminiText(prompt: string): Promise<string> {
  return callWithRetry(prompt, {}, (text) => text)
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
