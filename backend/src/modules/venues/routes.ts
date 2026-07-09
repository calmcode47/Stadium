import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDatabase } from '../../db/client'
import { mapStandSection, mapVenueZone } from '../../db/mappers'
import { venues } from '../../db/schema'
import { isoNow } from '../../lib/ids'
import { notFound } from '../../lib/httpErrors'
import { getValidatedQuery, paginationSchema, validate } from '../../lib/validation'
import { requireAuth, requireRole } from '../../middleware/auth'
import { broadcast } from '../../realtime/broadcaster'

const router = Router()
const paramsSchema = z.object({ id: z.string().min(1) })
const listSchema = paginationSchema.extend({ kind: z.enum(['zone', 'section']).optional() })
const occupancySchema = z.object({ occupancy: z.number().int().min(0) })
const gateLockSchema = z.object({ gateLocked: z.boolean().optional(), locked: z.boolean().optional() })

router.get('/', validate('query', listSchema), (req, res) => {
  const query = getValidatedQuery<z.infer<typeof listSchema>>(req)
  const rows = getDatabase().db.select().from(venues).all().filter(row => (query.kind ? row.kind === query.kind : true))
  const page = rows.slice(query.offset, query.offset + query.limit)
  res.json({
    data: {
      zones: page.filter(row => row.kind === 'zone').map(mapVenueZone),
      sections: page.filter(row => row.kind === 'section').map(mapStandSection),
      venues: page.map(row => (row.kind === 'section' ? mapStandSection(row) : mapVenueZone(row)))
    }
  })
})

router.get('/:id', validate('params', paramsSchema), (req, res, next) => {
  try {
    const { id } = req.params as unknown as z.infer<typeof paramsSchema>
    const row = getDatabase().db.select().from(venues).where(eq(venues.id, id)).get()
    if (!row) throw notFound('Venue not found')
    res.json({ data: row.kind === 'section' ? mapStandSection(row) : mapVenueZone(row) })
  } catch (error) {
    next(error)
  }
})

router.patch('/:id/occupancy', requireAuth, requireRole('operator', 'admin'), validate('params', paramsSchema), validate('body', occupancySchema), (req, res, next) => {
  try {
    const { id } = req.params as unknown as z.infer<typeof paramsSchema>
    const row = getDatabase().db.select().from(venues).where(eq(venues.id, id)).get()
    if (!row) throw notFound('Venue not found')

    const { occupancy } = req.body as z.infer<typeof occupancySchema>
    getDatabase().db
      .update(venues)
      .set({ currentOccupancy: Math.min(occupancy, row.capacity), updatedAt: isoNow() })
      .where(eq(venues.id, row.id))
      .run()

    const updated = getDatabase().db.select().from(venues).where(eq(venues.id, row.id)).get()
    if (!updated) throw notFound('Venue not found after update')
    const payload = updated.kind === 'section' ? mapStandSection(updated) : mapVenueZone(updated)
    broadcast('venue:updated', payload)
    broadcast('assistant:recommendations-changed', { reason: 'venue-occupancy-updated' })
    res.json({ data: payload })
  } catch (error) {
    next(error)
  }
})

router.patch('/:id/gate-lock', requireAuth, requireRole('operator', 'admin'), validate('params', paramsSchema), validate('body', gateLockSchema), (req, res, next) => {
  try {
    const { id } = req.params as unknown as z.infer<typeof paramsSchema>
    const row = getDatabase().db.select().from(venues).where(eq(venues.id, id)).get()
    if (!row) throw notFound('Venue not found')

    const body = req.body as z.infer<typeof gateLockSchema>
    const gateLocked = body.gateLocked ?? body.locked ?? !row.gateLocked
    getDatabase().db.update(venues).set({ gateLocked, updatedAt: isoNow() }).where(eq(venues.id, row.id)).run()
    const updated = getDatabase().db.select().from(venues).where(eq(venues.id, row.id)).get()
    if (!updated) throw notFound('Venue not found after update')
    const payload = updated.kind === 'section' ? mapStandSection(updated) : mapVenueZone(updated)
    console.info({ venueId: row.id, gateLocked }, 'gate lock toggled')
    broadcast('venue:updated', payload)
    broadcast('assistant:recommendations-changed', { reason: 'venue-gate-lock-updated' })
    res.json({ data: payload })
  } catch (error) {
    next(error)
  }
})

export default router
