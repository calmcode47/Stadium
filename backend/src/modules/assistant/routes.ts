import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getEnv } from '../../config/env'
import { getDatabase } from '../../db/client'
import { decisionLogEntries, operators } from '../../db/schema'
import { explainWithAI, generateRecommendations } from '../../lib/assistantEngine'
import { createId, isoNow, timeOfDay } from '../../lib/ids'
import { badRequest, notFound } from '../../lib/httpErrors'
import { paginationSchema, validate } from '../../lib/validation'
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth'
import { getOperationsState } from '../operationsService'
import { broadcast } from '../../realtime/broadcaster'

const router = Router()
const paramsSchema = z.object({ id: z.string().min(1) })
const decisionSchema = z.object({
  action: z.enum(['accepted', 'dismissed']),
  operatorId: z.string().min(1).optional()
})

router.get('/recommendations', async (_req, res, next) => {
  try {
    const recommendations = generateRecommendations(getOperationsState())
    const apiKey = getEnv().GEMINI_API_KEY
    const data = await Promise.all(
      recommendations.map(async recommendation => ({
        ...recommendation,
        aiExplanation: await explainWithAI(recommendation, apiKey)
      }))
    )
    res.json({ data })
  } catch (error) {
    next(error)
  }
})

router.post('/recommendations/:id/decision', requireAuth, validate('params', paramsSchema), validate('body', decisionSchema), (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.operator) throw badRequest('Missing authenticated operator')
    const { id } = req.params as unknown as z.infer<typeof paramsSchema>
    const body = req.body as z.infer<typeof decisionSchema>
    const operatorId = body.operatorId ?? req.operator.id
    if (operatorId !== req.operator.id && req.operator.role !== 'admin') {
      throw badRequest('operatorId must match authenticated operator unless admin')
    }

    const operator = getDatabase().db.select().from(operators).where(eq(operators.id, operatorId)).get()
    if (!operator) throw notFound('Operator not found')
    const recommendation = generateRecommendations(getOperationsState()).find(item => item.id === id)
    if (!recommendation) throw notFound('Recommendation not found in current operations state')

    const logId = createId('DL')
    getDatabase().db
      .insert(decisionLogEntries)
      .values({
        id: logId,
        recommendationId: recommendation.id,
        operatorId: operator.id,
        action: body.action,
        recommendationTitle: recommendation.title,
        suggestedAction: body.action === 'accepted' ? recommendation.suggestedAction : 'Ignored or manually resolved.',
        reasoningSnapshot: JSON.stringify(recommendation.reasoning),
        createdAt: isoNow()
      })
      .run()

    const payload = {
      id: logId,
      operator: operator.name,
      action: body.action.toUpperCase(),
      timestamp: timeOfDay(isoNow()),
      recId: recommendation.id,
      title: recommendation.title,
      suggestedAction: body.action === 'accepted' ? recommendation.suggestedAction : 'Ignored or manually resolved.'
    }
    broadcast('assistant:recommendations-changed', { reason: 'assistant-decision-recorded' })
    res.status(201).json({ data: payload })
  } catch (error) {
    next(error)
  }
})

router.get('/decision-log', requireAuth, validate('query', paginationSchema), (req, res) => {
  const query = req.query as unknown as z.infer<typeof paginationSchema>
  const operatorRows = getDatabase().db.select().from(operators).all()
  const names = new Map(operatorRows.map(operator => [operator.id, operator.name]))
  const rows = getDatabase().db
    .select()
    .from(decisionLogEntries)
    .all()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(query.offset, query.offset + query.limit)

  res.json({
    data: rows.map(row => ({
      id: row.id,
      operator: names.get(row.operatorId) ?? 'UNKNOWN OPERATOR',
      action: row.action.toUpperCase(),
      timestamp: timeOfDay(row.createdAt),
      recId: row.recommendationId,
      title: row.recommendationTitle,
      suggestedAction: row.suggestedAction
    }))
  })
})

export default router
