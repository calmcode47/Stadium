import { Router } from 'express'
import { and, asc, eq, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { getDatabase } from '../../db/client'
import { mapMatch, mapMatchEvent } from '../../db/mappers'
import { matchEvents, matches } from '../../db/schema'
import { createId, isoNow } from '../../lib/ids'
import { notFound } from '../../lib/httpErrors'
import { getValidatedQuery, paginationSchema, validate } from '../../lib/validation'
import { requireAuth, requireRole } from '../../middleware/auth'
import { broadcast } from '../../realtime/broadcaster'

const router = Router()

const paramsSchema = z.object({ id: z.string().min(1) })
const listSchema = paginationSchema.extend({
  status: z.enum(['scheduled', 'live', 'delayed', 'completed', 'cancelled']).optional(),
  venueId: z.string().optional(),
  tournamentId: z.string().optional()
})

const patchSchema = z.object({
  scoreHome: z.number().int().min(0).optional(),
  scoreAway: z.number().int().min(0).optional(),
  status: z.enum(['scheduled', 'live', 'delayed', 'completed', 'cancelled']).optional(),
  clockSeconds: z.number().int().min(0).max(7200).optional(),
  period: z.string().min(1).max(20).optional(),
  statusLabel: z.string().min(1).max(80).optional()
})

const eventSchema = z.object({
  type: z.enum(['goal', 'card_yellow', 'card_red', 'substitution', 'timeout']),
  team: z.string().min(1).max(80).optional(),
  minute: z.number().int().min(0).max(130),
  description: z.string().min(1).max(240)
})

router.get('/', validate('query', listSchema), (req, res) => {
  const query = getValidatedQuery<z.infer<typeof listSchema>>(req)
  const filters: SQL[] = []
  if (query.status) filters.push(eq(matches.status, query.status))
  if (query.venueId) filters.push(eq(matches.venueId, query.venueId))
  if (query.tournamentId) filters.push(eq(matches.tournamentId, query.tournamentId))
  const where = filters.length > 0 ? and(...filters) : undefined
  const filtered = where
    ? getDatabase().db.select().from(matches).where(where).limit(query.limit).offset(query.offset).all()
    : getDatabase().db.select().from(matches).limit(query.limit).offset(query.offset).all()

  res.json({ data: filtered.map(mapMatch) })
})

router.get('/:id', validate('params', paramsSchema), (req, res, next) => {
  try {
    const { id } = req.params as unknown as z.infer<typeof paramsSchema>
    const row = getDatabase().db.select().from(matches).where(eq(matches.id, id)).get()
    if (!row) throw notFound('Match not found')
    const events = getDatabase().db.select().from(matchEvents).where(eq(matchEvents.matchId, row.id)).orderBy(asc(matchEvents.createdAt)).all()
    res.json({ data: { ...mapMatch(row), events: events.map(mapMatchEvent) } })
  } catch (error) {
    next(error)
  }
})

router.patch('/:id', requireAuth, requireRole('operator', 'admin'), validate('params', paramsSchema), validate('body', patchSchema), (req, res, next) => {
  try {
    const { id } = req.params as unknown as z.infer<typeof paramsSchema>
    const existing = getDatabase().db.select().from(matches).where(eq(matches.id, id)).get()
    if (!existing) throw notFound('Match not found')

    const body = req.body as z.infer<typeof patchSchema>
    getDatabase().db
      .update(matches)
      .set({
        teamHomeScore: body.scoreHome ?? existing.teamHomeScore,
        teamAwayScore: body.scoreAway ?? existing.teamAwayScore,
        status: body.status ?? existing.status,
        clockSeconds: body.clockSeconds ?? existing.clockSeconds,
        period: body.period ?? existing.period,
        statusLabel: body.statusLabel ?? existing.statusLabel,
        updatedAt: isoNow()
      })
      .where(eq(matches.id, existing.id))
      .run()

    const updated = getDatabase().db.select().from(matches).where(eq(matches.id, existing.id)).get()
    if (!updated) throw notFound('Match not found after update')
    const payload = mapMatch(updated)
    broadcast('match:updated', payload)
    broadcast('assistant:recommendations-changed', { reason: 'match-updated' })
    res.json({ data: payload })
  } catch (error) {
    next(error)
  }
})

router.post('/:id/events', requireAuth, requireRole('operator', 'admin'), validate('params', paramsSchema), validate('body', eventSchema), (req, res, next) => {
  try {
    const { id: matchId } = req.params as unknown as z.infer<typeof paramsSchema>
    const match = getDatabase().db.select().from(matches).where(eq(matches.id, matchId)).get()
    if (!match) throw notFound('Match not found')

    const body = req.body as z.infer<typeof eventSchema>
    const eventType = body.type === 'card_yellow' || body.type === 'card_red' ? 'card' : body.type
    const id = createId('E')
    getDatabase().db
      .insert(matchEvents)
      .values({
        id,
        matchId: match.id,
        type: eventType,
        team: body.team,
        minute: body.minute,
        description: body.description,
        createdAt: isoNow()
      })
      .run()

    if (body.type === 'goal') {
      const homeGoal = body.team === match.teamHomeName
      getDatabase().db
        .update(matches)
        .set({
          teamHomeScore: homeGoal ? match.teamHomeScore + 1 : match.teamHomeScore,
          teamAwayScore: !homeGoal ? match.teamAwayScore + 1 : match.teamAwayScore,
          updatedAt: isoNow()
        })
        .where(eq(matches.id, match.id))
        .run()
    }

    const updatedMatch = getDatabase().db.select().from(matches).where(eq(matches.id, match.id)).get()
    const eventRow = getDatabase().db
      .select()
      .from(matchEvents)
      .where(and(eq(matchEvents.id, id), eq(matchEvents.matchId, match.id)))
      .get()
    if (!eventRow || !updatedMatch) throw notFound('Match event not found after create')

    broadcast('match:updated', mapMatch(updatedMatch))
    broadcast('assistant:recommendations-changed', { reason: 'match-event-created' })
    res.status(201).json({ data: mapMatchEvent(eventRow) })
  } catch (error) {
    next(error)
  }
})

export default router
