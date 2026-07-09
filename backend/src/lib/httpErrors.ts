export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message)
  }
}

export const notFound = (message = 'Resource not found'): HttpError => new HttpError(404, 'NOT_FOUND', message)
export const badRequest = (message = 'Invalid request'): HttpError => new HttpError(400, 'BAD_REQUEST', message)
export const unauthorized = (message = 'Authentication required'): HttpError =>
  new HttpError(401, 'UNAUTHORIZED', message)
export const forbidden = (message = 'Insufficient role for this action'): HttpError =>
  new HttpError(403, 'FORBIDDEN', message)
export const conflict = (message = 'Conflict'): HttpError => new HttpError(409, 'CONFLICT', message)
