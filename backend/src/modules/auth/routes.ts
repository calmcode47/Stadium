import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getEnv } from '../../config/env'
import { getDatabase } from '../../db/client'
import { operators } from '../../db/schema'
import { badRequest, unauthorized } from '../../lib/httpErrors'
import { validate } from '../../lib/validation'
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth'
import { authRateLimiter } from '../../middleware/rateLimiter'

const router = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

router.post('/login', authRateLimiter, validate('body', loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>
    const operator = getDatabase().db.select().from(operators).where(eq(operators.email, email.toLowerCase())).get()
    if (!operator) throw unauthorized('Invalid email or password')

    const isValid = await bcrypt.compare(password, operator.passwordHash)
    if (!isValid) throw unauthorized('Invalid email or password')

    const env = getEnv()
    const token = jwt.sign({ sub: operator.id, role: operator.role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN
    } as jwt.SignOptions)

    res.json({
      data: {
        token,
        expiresIn: env.JWT_EXPIRES_IN,
        operator: { id: operator.id, name: operator.name, email: operator.email, role: operator.role }
      }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/me', requireAuth, (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.operator) throw badRequest('Missing authenticated operator')
    res.json({ data: req.operator })
  } catch (error) {
    next(error)
  }
})

export default router
