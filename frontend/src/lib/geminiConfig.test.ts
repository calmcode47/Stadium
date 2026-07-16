import { describe, expect, it } from 'vitest'
import {
  formatGeminiError,
  GEMINI_MODEL,
  normalizeGeminiModel,
  parseGeminiRetryDelayMs,
  resetGeminiRateLimiterForTests
} from './geminiConfig'

describe('geminiConfig', () => {
  it('defaults to the supported flash-lite model', () => {
    expect(GEMINI_MODEL).toBe('gemini-3.1-flash-lite')
  })

  it('normalizes retired preview model names to the supported flash-lite model', () => {
    expect(normalizeGeminiModel('gemini-2.0-flash-lite')).toBe('gemini-3.1-flash-lite')
    expect(normalizeGeminiModel('gemini-3.1-flash-lite-preview')).toBe('gemini-3.1-flash-lite')
    expect(normalizeGeminiModel(' gemini-3.1-flash-lite-preview ')).toBe('gemini-3.1-flash-lite')
    expect(normalizeGeminiModel('gemini-3.1-pro-preview')).toBe('gemini-3.1-pro-preview')
  })

  it('parses retry delays from quota error messages', () => {
    expect(parseGeminiRetryDelayMs('Please retry in 11.45s.')).toBe(11450)
    expect(parseGeminiRetryDelayMs('No retry hint')).toBeNull()
  })

  it('formats quota errors for operators', () => {
    expect(formatGeminiError(429, 'Quota exceeded')).toContain('rate limit')
  })

  it('formats invalid key errors clearly', () => {
    expect(formatGeminiError(400, 'API key not valid. Please pass a valid API key.')).toContain('API key is invalid')
  })

  it('resets the client rate limiter in tests', () => {
    resetGeminiRateLimiterForTests()
    expect(true).toBe(true)
  })
})
