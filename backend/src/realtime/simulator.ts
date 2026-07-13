import { eq } from 'drizzle-orm'
import { getDatabase } from '../db/client'
import { mapAlert, mapMatch } from '../db/mappers'
import { alerts, matchEvents, matches } from '../db/schema'
import { createId, isoNow } from '../lib/ids'
import { broadcast, clientCount } from './broadcaster'

export interface SimulatorHandle {
  stop: () => void
}

export const startSimulator = (): SimulatorHandle => {
  /*
   * Demo/evaluation convenience only: this lightweight simulator makes a fresh
   * clone feel alive without a judge manually PATCHing scores or creating events.
   * Disable ENABLE_SIMULATOR in real deployments and replace this with real telemetry.
   */
  const interval = setInterval(() => {
    const { db } = getDatabase()
    if (clientCount() === 0) return
    const match = db.select().from(matches).where(eq(matches.status, 'live')).limit(1).get()
    if (!match) return

    const nextClock = Math.min(match.clockSeconds + 60, 90 * 60)
    const nextStatus = nextClock >= 90 * 60 ? 'completed' : 'live'
    db.update(matches)
      .set({
        clockSeconds: nextClock,
        status: nextStatus,
        period: nextStatus === 'completed' ? 'FT' : match.period,
        statusLabel: nextStatus === 'completed' ? 'FINAL' : 'LIVE - 2ND HALF',
        updatedAt: isoNow()
      })
      .where(eq(matches.id, match.id))
      .run()

    const updated = db.select().from(matches).where(eq(matches.id, match.id)).get()
    if (updated && nextStatus !== match.status) {
      broadcast('match:updated', mapMatch(updated))
      broadcast('assistant:recommendations-changed', { reason: 'match-status-transition' })
    }

    if (Math.random() < 0.2) {
      const eventId = createId('E-SIM')
      db.insert(matchEvents)
        .values({
          id: eventId,
          matchId: match.id,
          type: 'timeout',
          team: null,
          minute: Math.floor(nextClock / 60),
          description: 'OFFICIAL TIMEOUT: Technical check on pitch sensors',
          createdAt: isoNow()
        })
        .run()
    }

    if (Math.random() < 0.15) {
      const alertId = createId('A-SIM')
      db.insert(alerts)
        .values({
          id: alertId,
          venueId: match.venueId,
          severity: 'warning',
          message: `Warning: Match ${match.id} live telemetry generated an operations review alert`,
          acknowledged: false,
          createdAt: isoNow(),
          acknowledgedAt: null
        })
        .run()
      const alert = db.select().from(alerts).where(eq(alerts.id, alertId)).get()
      if (alert) {
        broadcast('alert:created', mapAlert(alert))
        broadcast('assistant:recommendations-changed', { reason: 'simulator-alert-created' })
      }
    }
  }, 8000)

  return { stop: () => clearInterval(interval) }
}
