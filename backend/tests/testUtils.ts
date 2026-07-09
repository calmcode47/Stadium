import { afterEach, beforeEach } from 'vitest'
import request from 'supertest'
import { closeDatabase, setDatabaseForTests } from '../src/db/client'
import { resetEnvForTests } from '../src/config/env'
import { seedDatabase } from '../src/db/seed'
import { createApp } from '../src/app'

export const configureTestEnv = (): void => {
  process.env.PORT = '4001'
  process.env.DATABASE_FILE = ':memory:'
  process.env.JWT_SECRET = 'test-secret-that-is-long-enough'
  process.env.JWT_EXPIRES_IN = '1h'
  process.env.FRONTEND_ORIGIN = 'http://localhost:5173'
  process.env.GEMINI_API_KEY = ''
  process.env.ENABLE_SIMULATOR = 'false'
  resetEnvForTests()
}

export const setupSeededDb = (): void => {
  beforeEach(async () => {
    configureTestEnv()
    setDatabaseForTests(':memory:')
    await seedDatabase()
  })

  afterEach(() => {
    closeDatabase()
    resetEnvForTests()
  })
}

export const appRequest = (): request.Agent => request(createApp())

export const loginAs = async (role: 'admin' | 'operator' | 'viewer'): Promise<string> => {
  const email = `${role}@stadium.local`
  const response = await appRequest().post('/api/auth/login').send({ email, password: 'Stadium123!' }).expect(200)
  return response.body.data.token as string
}
