import crypto from 'node:crypto'

export const createId = (prefix: string): string => `${prefix}-${crypto.randomUUID()}`

export const isoNow = (): string => new Date().toISOString()

export const timeOfDay = (isoDate: string): string => new Date(isoDate).toTimeString().split(' ')[0] ?? '00:00:00'
