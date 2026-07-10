import { getEnv } from './env.js'

/** Lite model default — higher free-tier daily limits than gemini-2.5-flash. */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite-preview'

export const getGeminiModel = (): string => {
  const configured = getEnv().GEMINI_MODEL.trim()
  return configured || DEFAULT_GEMINI_MODEL
}

export const getGeminiGenerateUrl = (): string => {
  return `https://generativelanguage.googleapis.com/v1beta/models/${getGeminiModel()}:generateContent`
}

export const getGeminiApiKey = (): string => getEnv().GEMINI_API_KEY.trim()
