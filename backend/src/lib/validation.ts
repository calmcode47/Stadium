import type { Request, RequestHandler } from 'express'
import { z } from 'zod'

type RequestPart = 'body' | 'query' | 'params'

export const validate =
  <T extends z.ZodType>(part: RequestPart, schema: T): RequestHandler =>
  (req, _res, next) => {
    const parsed = schema.safeParse(req[part])
    if (!parsed.success) {
      const message = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ')
      next(new Error(`VALIDATION:${message}`))
      return
    }
    if (part === 'query') {
      ;(req as Request & { validatedQuery?: z.infer<T> }).validatedQuery = parsed.data
    } else {
      req[part] = parsed.data
    }
    next()
  }

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
})

export const getValidatedQuery = <T>(req: Request): T => {
  return (req as Request & { validatedQuery?: T }).validatedQuery as T
}
