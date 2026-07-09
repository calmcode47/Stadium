import compression from 'compression'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import pinoHttp from 'pino-http'
import { getDatabase } from './db/client'
import { getEnv } from './config/env'
import { errorHandler } from './middleware/errorHandler'
import { globalRateLimiter } from './middleware/rateLimiter'
import authRoutes from './modules/auth/routes'
import matchesRoutes from './modules/matches/routes'
import venuesRoutes from './modules/venues/routes'
import alertsRoutes from './modules/alerts/routes'
import tournamentsRoutes from './modules/tournaments/routes'
import assistantRoutes from './modules/assistant/routes'

export const createApp = (): express.Express => {
  const env = getEnv()
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }))
  app.use(compression())
  app.use(express.json({ limit: '1mb' }))
  app.use(
    pinoHttp({
      redact: ['req.headers.authorization', 'req.body.password', 'req.body.token']
    })
  )
  app.use(globalRateLimiter)

  app.get('/api/health', (_req, res) => {
    getDatabase().sqlite.prepare('SELECT 1').get()
    res.json({ data: { status: 'ok', database: 'ok', timestamp: new Date().toISOString() } })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/matches', matchesRoutes)
  app.use('/api/venues', venuesRoutes)
  app.use('/api/alerts', alertsRoutes)
  app.use('/api/tournaments', tournamentsRoutes)
  app.use('/api/assistant', assistantRoutes)
  app.use(errorHandler)

  return app
}
