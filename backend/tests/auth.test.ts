import { describe, expect, it } from 'vitest'
import { appRequest, loginAs, setupSeededDb } from './testUtils'

setupSeededDb()

describe('auth routes', () => {
  it('logs in and returns an operator profile without password hash', async () => {
    const response = await appRequest().post('/api/auth/login').send({ email: 'operator@stadium.local', password: 'Stadium123!' }).expect(200)
    expect(response.body.data.token).toBeTruthy()
    expect(response.body.data.operator.passwordHash).toBeUndefined()
    expect(response.body.data.operator.role).toBe('operator')
  })

  it('rejects wrong password', async () => {
    await appRequest().post('/api/auth/login').send({ email: 'operator@stadium.local', password: 'wrong' }).expect(401)
  })

  it('returns me for a valid token', async () => {
    const token = await loginAs('admin')
    const response = await appRequest().get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(200)
    expect(response.body.data.email).toBe('admin@stadium.local')
  })

  it('rejects invalid tokens', async () => {
    await appRequest().get('/api/auth/me').set('Authorization', 'Bearer invalid').expect(401)
  })
})
