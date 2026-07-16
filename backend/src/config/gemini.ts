import { getEnv } from './env.js'

/** Lite model default for low-latency text generation. */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite'
export const RETIRED_GEMINI_MODELS = new Set(['gemini-2.0-flash-lite', 'gemini-3.1-flash-lite-preview'])

export const normalizeGeminiModel = (model?: string): string => {
  const configured = model?.trim()
  if (!configured || RETIRED_GEMINI_MODELS.has(configured)) return DEFAULT_GEMINI_MODEL
  return configured
}

export const getGeminiModel = (): string => {
  return normalizeGeminiModel(getEnv().GEMINI_MODEL)
}

export const getGeminiGenerateUrl = (): string => {
  return `https://generativelanguage.googleapis.com/v1beta/models/${getGeminiModel()}:generateContent`
}

export const getGeminiApiKey = (): string => getEnv().GEMINI_API_KEY.trim()
