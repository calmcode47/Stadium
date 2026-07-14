import { getDatabase } from '../db/client'
import type { Recommendation } from '../types/operations'

const TTL_MS = 2500

export type RecommendationPayload = Recommendation & { aiExplanation: string }

interface CacheEntry {
  fingerprint: string
  expiresAt: number
  data: RecommendationPayload[]
}

/**
 * Short-lived, invalidation-aware cache for GET /assistant/recommendations.
 *
 * Why this cache is safe:
 * - Results are keyed by a cheap DB state fingerprint (row counts + max timestamps on
 *   matches, venues, and alerts). Any write that changes recommendation inputs produces
 *   a new fingerprint, so we never serve stale recommendations after a real state change.
 * - A 2.5s TTL is a second bound: even if wall-clock-sensitive fields (e.g. "recent
 *   incident" windows) shift without a DB write, we recompute within that window.
 * - Correctness comes first: a fingerprint mismatch always forces a full recompute;
 *   the TTL only skips work when the fingerprint is unchanged and still fresh.
 */
let cache: CacheEntry | null = null

/** Cheap aggregate fingerprint of tables that feed the deterministic decision engine. */
export const getOperationsFingerprint = (): string => {
  const row = getDatabase().sqlite
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM matches) AS match_count,
        (SELECT COALESCE(MAX(updated_at), '') FROM matches) AS match_updated,
        (SELECT COUNT(*) FROM venues) AS venue_count,
        (SELECT COALESCE(MAX(updated_at), '') FROM venues) AS venue_updated,
        (SELECT COUNT(*) FROM alerts) AS alert_count,
        (SELECT COUNT(*) FROM alerts WHERE acknowledged = 1) AS alert_acked,
        (SELECT COALESCE(MAX(created_at), '') FROM alerts) AS alert_created,
        (SELECT COALESCE(MAX(acknowledged_at), '') FROM alerts) AS alert_acked_at`
    )
    .get() as {
    match_count: number
    match_updated: string
    venue_count: number
    venue_updated: string
    alert_count: number
    alert_acked: number
    alert_created: string
    alert_acked_at: string
  }

  return [
    row.match_count,
    row.match_updated,
    row.venue_count,
    row.venue_updated,
    row.alert_count,
    row.alert_acked,
    row.alert_created,
    row.alert_acked_at
  ].join('|')
}

export const getCachedRecommendations = (fingerprint: string): RecommendationPayload[] | null => {
  if (!cache) return null
  if (cache.fingerprint !== fingerprint) return null
  if (Date.now() > cache.expiresAt) return null
  return cache.data
}

export const setCachedRecommendations = (fingerprint: string, data: RecommendationPayload[]): void => {
  cache = {
    fingerprint,
    expiresAt: Date.now() + TTL_MS,
    data
  }
}

export const clearRecommendationCache = (): void => {
  cache = null
}
