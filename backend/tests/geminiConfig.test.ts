import { describe, expect, it } from 'vitest'
import { DEFAULT_GEMINI_MODEL, normalizeGeminiModel } from '../src/config/gemini'

describe('gemini config', () => {
  it('defaults to the supported flash-lite model', () => {
    expect(DEFAULT_GEMINI_MODEL).toBe('gemini-3.1-flash-lite')
    expect(normalizeGeminiModel()).toBe('gemini-3.1-flash-lite')
  })

  it('normalizes retired preview model names', () => {
    expect(normalizeGeminiModel('gemini-2.0-flash-lite')).toBe('gemini-3.1-flash-lite')
    expect(normalizeGeminiModel('gemini-3.1-flash-lite-preview')).toBe('gemini-3.1-flash-lite')
    expect(normalizeGeminiModel(' gemini-3.1-flash-lite-preview ')).toBe('gemini-3.1-flash-lite')
    expect(normalizeGeminiModel('gemini-3.1-pro-preview')).toBe('gemini-3.1-pro-preview')
  })
})
