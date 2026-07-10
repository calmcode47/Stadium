/**
 * Gemini API configuration tuned for the free tier.
 *
 * gemini-3.1-flash-lite-preview offers higher daily throughput than gemini-2.5-flash
 * and remains available to new Google AI Studio accounts (2.5 Flash-Lite is restricted).
 * Override via VITE_GEMINI_MODEL when your project has access to a different model.
 */
export const GEMINI_MODEL =
  (import.meta.env.VITE_GEMINI_MODEL as string | undefined)?.trim() || 'gemini-3.1-flash-lite-preview'

export const GEMINI_GENERATE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

/** Free-tier Flash-Lite models are capped at ~15 RPM; pace client requests accordingly. */
export const GEMINI_MIN_REQUEST_INTERVAL_MS = 4_000

/** Keep chat history short to reduce token usage per turn. */
export const GEMINI_MAX_CHAT_HISTORY = 8

/** Maximum automatic retries when Google returns a rate-limit response. */
export const GEMINI_MAX_RETRIES = 2

let lastGeminiRequestAt = 0

export const resetGeminiRateLimiterForTests = (): void => {
  lastGeminiRequestAt = 0
}

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

export const waitForGeminiRateLimit = async (): Promise<void> => {
  if (import.meta.env.MODE === 'test') return

  const elapsed = Date.now() - lastGeminiRequestAt
  if (elapsed < GEMINI_MIN_REQUEST_INTERVAL_MS) {
    await sleep(GEMINI_MIN_REQUEST_INTERVAL_MS - elapsed)
  }
  lastGeminiRequestAt = Date.now()
}

export const parseGeminiRetryDelayMs = (message: string): number | null => {
  const match = message.match(/retry in ([\d.]+)s/i)
  if (!match) return null
  return Math.ceil(Number.parseFloat(match[1]) * 1000)
}

export const formatGeminiError = (status: number, message: string): string => {
  if (status === 429 || message.toLowerCase().includes('quota')) {
    return 'Gemini rate limit reached. Please wait a moment before sending another message. Free-tier projects have daily request caps per model.'
  }
  if (status === 400 && message.toLowerCase().includes('api key not valid')) {
    return 'Gemini API key is invalid. Check VITE_GEMINI_API_KEY in frontend/.env or reset the key in Assistant Settings.'
  }
  return `API error: ${status} - ${message}`
}
