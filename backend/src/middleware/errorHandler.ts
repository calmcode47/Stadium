import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { HttpError } from '../lib/httpErrors'

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (typeof error?.message === 'string' && error.message.startsWith('VALIDATION:')) {
    res.status(400).json({ error: { message: error.message.replace('VALIDATION:', ''), code: 'VALIDATION_ERROR' } })
    return
  }

  if (error instanceof ZodError) {
    res.status(400).json({ error: { message: error.issues.map(issue => issue.message).join('; '), code: 'VALIDATION_ERROR' } })
    return
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ error: { message: error.message, code: error.code } })
    return
  }

  reqLogError(error)
  res.status(500).json({ error: { message: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' } })
}

const reqLogError = (error: unknown): void => {
  if (error instanceof Error) {
    console.error(error.message)
  }
}
