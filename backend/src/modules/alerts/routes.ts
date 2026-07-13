import { Router } from 'express'
import { and, desc, eq, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { getDatabase } from '../../db/client'
import { mapAlert } from '../../db/mappers'
import { alerts } from '../../db/schema'
import { createId, isoNow } from '../../lib/ids'
import { notFound } from '../../lib/httpErrors'
import { getValidatedQuery, paginationSchema, validate } from '../../lib/validation'
import { requireAuth, requireRole } from '../../middleware/auth'
import { broadcast } from '../../realtime/broadcaster'

const router = Router()
const paramsSchema = z.object({ id: z.string().min(1) })
const listSchema = paginationSchema.extend({
  acknowledged: z.coerce.boolean().optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  venueId: z.string().optional()
})
const createSchema = z.object({
  venueId: z.string().optional(),
  severity: z.enum(['info', 'warning', 'critical']),
  message: z.string().min(1).max(280)
})

router.get('/', validate('query', listSchema), (req, res) => {
  const query = getValidatedQuery<z.infer<typeof listSchema>>(req)
  const filters: SQL[] = []
  if (query.acknowledged !== undefined) filters.push(eq(alerts.acknowledged, query.acknowledged))
  if (query.severity) filters.push(eq(alerts.severity, query.severity))
  if (query.venueId) filters.push(eq(alerts.venueId, query.venueId))
  const where = filters.length > 0 ? and(...filters) : undefined
  const filtered = where
    ? getDatabase().db.select().from(alerts).where(where).orderBy(desc(alerts.createdAt)).limit(query.limit).offset(query.offset).all()
    : getDatabase().db.select().from(alerts).orderBy(desc(alerts.createdAt)).limit(query.limit).offset(query.offset).all()
  res.json({ data: filtered.map(mapAlert) })
})

router.post('/', requireAuth, requireRole('operator', 'admin'), validate('body', createSchema), (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof createSchema>
    const id = createId('A')
    getDatabase().db
      .insert(alerts)
      .values({ id, venueId: body.venueId, severity: body.severity, message: body.message, acknowledged: false, createdAt: isoNow(), acknowledgedAt: null })
      .run()
    const row = getDatabase().db.select().from(alerts).where(eq(alerts.id, id)).get()
    if (!row) throw notFound('Alert not found after create')
    const payload = mapAlert(row)
    broadcast('alert:created', payload)
    broadcast('assistant:recommendations-changed', { reason: 'alert-created' })
    res.status(201).json({ data: payload })
  } catch (error) {
    next(error)
  }
})

router.patch('/:id/acknowledge', requireAuth, requireRole('operator', 'admin'), validate('params', paramsSchema), (req, res, next) => {
  try {
    const { id } = req.params as unknown as z.infer<typeof paramsSchema>
    const row = getDatabase().db.select().from(alerts).where(eq(alerts.id, id)).get()
    if (!row) throw notFound('Alert not found')
    getDatabase().db.update(alerts).set({ acknowledged: true, acknowledgedAt: isoNow() }).where(eq(alerts.id, row.id)).run()
    const updated = getDatabase().db.select().from(alerts).where(eq(alerts.id, row.id)).get()
    if (!updated) throw notFound('Alert not found after update')
    const payload = mapAlert(updated)
    broadcast('alert:acknowledged', payload)
    broadcast('assistant:recommendations-changed', { reason: 'alert-acknowledged' })
    res.json({ data: payload })
  } catch (error) {
    next(error)
  }
})

export default router
