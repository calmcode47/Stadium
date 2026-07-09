import { describe, expect, it } from 'vitest'
import { appRequest, loginAs, setupSeededDb } from './testUtils'

setupSeededDb()

describe('matches routes', () => {
  it('gets matches and a single match', async () => {
    const list = await appRequest().get('/api/matches?status=live').expect(200)
    expect(list.body.data[0].id).toBe('M-101')
    await appRequest().get('/api/matches/M-101').expect(200)
  })

  it('mutates as operator', async () => {
    const token = await loginAs('operator')
    const response = await appRequest().patch('/api/matches/M-101').set('Authorization', `Bearer ${token}`).send({ scoreHome: 3 }).expect(200)
    expect(response.body.data.scoreHome).toBe(3)
  })

  it('guards match mutations', async () => {
    await appRequest().patch('/api/matches/M-101').send({ scoreHome: 3 }).expect(401)
    const token = await loginAs('viewer')
    await appRequest().patch('/api/matches/M-101').set('Authorization', `Bearer ${token}`).send({ scoreHome: 3 }).expect(403)
  })

  it('returns validation and not found errors', async () => {
    const token = await loginAs('operator')
    await appRequest().patch('/api/matches/M-101').set('Authorization', `Bearer ${token}`).send({ scoreHome: -1 }).expect(400)
    await appRequest().get('/api/matches/NOPE').expect(404)
  })

  it('creates match events as operator', async () => {
    const token = await loginAs('operator')
    const response = await appRequest()
      .post('/api/matches/M-101/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'timeout', minute: 77, description: 'Official timeout' })
      .expect(201)
    expect(response.body.data.type).toBe('timeout')
  })
})
