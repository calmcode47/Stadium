import { describe, expect, it } from 'vitest'
import {
  clearRecommendationCache,
  getCachedRecommendations,
  getOperationsFingerprint,
  setCachedRecommendations
} from '../src/lib/recommendationCache'
import { setupSeededDb } from './testUtils'

setupSeededDb()

describe('recommendationCache', () => {
  it('returns cached payload only for matching fingerprint before TTL expiry', () => {
    clearRecommendationCache()
    const fingerprint = getOperationsFingerprint()
    const payload = [
      {
        id: 'REC-TEST',
        priority: 'high' as const,
        title: 'Test',
        reasoning: ['reason'],
        suggestedAction: 'act',
        relatedEntityId: 'zone',
        aiExplanation: 'Explain.'
      }
    ]

    expect(getCachedRecommendations(fingerprint)).toBeNull()
    setCachedRecommendations(fingerprint, payload)
    expect(getCachedRecommendations(fingerprint)).toEqual(payload)
    expect(getCachedRecommendations('other-fingerprint')).toBeNull()
  })

  it('changes fingerprint after a relevant alerts write', async () => {
    const before = getOperationsFingerprint()
    const { getDatabase } = await import('../src/db/client')
    getDatabase().sqlite
      .prepare(
        `INSERT INTO alerts (id, venue_id, severity, message, acknowledged, created_at, acknowledged_at)
         VALUES (?, ?, ?, ?, 0, ?, NULL)`
      )
      .run('AL-FINGERPRINT', 'zone-west', 'warning', 'fingerprint probe', new Date().toISOString())

    expect(getOperationsFingerprint()).not.toBe(before)
  })
})
