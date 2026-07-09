import type { Request, RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { getEnv } from '../config/env'
import { getDatabase } from '../db/client'
import { operators } from '../db/schema'
import { forbidden, unauthorized } from '../lib/httpErrors'
import type { OperatorProfile, OperatorRole } from '../types/operations'

interface JwtPayload {
  sub: string
  role: OperatorRole
}

export interface AuthenticatedRequest extends Request {
  operator?: OperatorProfile
}

export const requireAuth: RequestHandler = (req: AuthenticatedRequest, _res, next) => {
  const header = req.header('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
  if (!token) {
    next(unauthorized('Missing bearer token'))
    return
  }

  try {
    const decoded = jwt.verify(token, getEnv().JWT_SECRET) as JwtPayload
    const operator = getDatabase().db.select().from(operators).where(eq(operators.id, decoded.sub)).get()
    if (!operator) {
      next(unauthorized('Operator no longer exists'))
      return
    }
    req.operator = {
      id: operator.id,
      name: operator.name,
      email: operator.email,
      role: operator.role
    }
    next()
  } catch {
    next(unauthorized('Invalid or expired token'))
  }
}

export const requireRole =
  (...roles: OperatorRole[]): RequestHandler =>
  (req: AuthenticatedRequest, _res, next) => {
    if (!req.operator) {
      next(unauthorized('Authentication required'))
      return
    }
    if (!roles.includes(req.operator.role)) {
      next(forbidden())
      return
    }
    next()
  }
