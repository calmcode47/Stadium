import http from 'node:http'
import { getEnv } from './config/env'
import { createApp } from './app'
import { getDatabase } from './db/client'
import { attachWebSocketServer } from './realtime/wsServer'
import { startSimulator } from './realtime/simulator'
import { seedDatabase } from './db/seed'
import { operators } from './db/schema'

const env = getEnv()
const { db } = getDatabase()

const bootstrap = async (): Promise<void> => {
  // Auto-seed on first boot (empty DB — fresh Railway deployment)
  const existingOperators = db.select().from(operators).all()
  if (existingOperators.length === 0) {
    console.info('No operators found — seeding demo database...')
    await seedDatabase()
    console.info('Database seeded successfully.')
  }

  const server = http.createServer(createApp())
  attachWebSocketServer(server)

  if (env.ENABLE_SIMULATOR) {
    startSimulator()
  }

  server.listen(env.PORT, () => {
    console.info(`Smart Stadium backend listening on http://localhost:${env.PORT}`)
  })
}

bootstrap().catch(err => {
  console.error('Fatal startup error:', err)
  process.exit(1)
})
