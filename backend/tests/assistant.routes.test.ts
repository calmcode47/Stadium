import { describe, expect, it, vi } from 'vitest'
import { resetEnvForTests } from '../src/config/env'
import { appRequest, loginAs, setupSeededDb } from './testUtils'

describe('assistant routes', () => {
  setupSeededDb()

  it('answers chat through the backend Gemini key', async () => {
    process.env.GEMINI_API_KEY = 'TEST_GEMINI_KEY'
    resetEnvForTests()
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: 'Dispatch Gate B support and keep egress routes open.' }]
            }
          }
        ]
      })
    })
    vi.stubGlobal('fetch', fetchSpy)

    const token = await loginAs('operator')
    const response = await appRequest()
      .post('/api/assistant/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'What should I do next?', history: [] })
      .expect(200)

    expect(response.body.data.text).toBe('Dispatch Gate B support and keep egress routes open.')
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('models/gemini-3.1-flash-lite:generateContent'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-goog-api-key': 'TEST_GEMINI_KEY'
        }),
        body: expect.stringContaining('What should I do next?')
      })
    )

    vi.unstubAllGlobals()
  })

  it('reports when backend Gemini is not configured', async () => {
    const token = await loginAs('operator')

    const response = await appRequest()
      .post('/api/assistant/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Status?', history: [] })
      .expect(400)

    expect(response.body.error.message).toContain('Gemini API key is not configured')
  })
})
