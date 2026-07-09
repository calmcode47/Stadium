import { describe, expect, it } from 'vitest'
import { appRequest, loginAs, setupSeededDb } from './testUtils'

setupSeededDb()

describe('alerts routes', () => {
  it('gets alerts filtered by severity', async () => {
    const response = await appRequest().get('/api/alerts?severity=critical').expect(200)
    expect(response.body.data.some((alert: { level: string }) => alert.level === 'critical')).toBe(true)
  })

  it('creates and acknowledges alerts as operator', async () => {
    const token = await loginAs('operator')
    const created = await appRequest()
      .post('/api/alerts')
      .set('Authorization', `Bearer ${token}`)
      .send({ venueId: 'zone-west', severity: 'warning', message: 'Gate B queue check' })
      .expect(201)
    const acknowledged = await appRequest().patch(`/api/alerts/${created.body.data.id}/acknowledge`).set('Authorization', `Bearer ${token}`).expect(200)
    expect(acknowledged.body.data.isAcknowledged).toBe(true)
  })

  it('guards alert mutations', async () => {
    await appRequest().post('/api/alerts').send({ severity: 'warning', message: 'x' }).expect(401)
    const token = await loginAs('viewer')
    await appRequest().post('/api/alerts').set('Authorization', `Bearer ${token}`).send({ severity: 'warning', message: 'x' }).expect(403)
  })

  it('returns validation and not found errors', async () => {
    const token = await loginAs('operator')
    await appRequest().post('/api/alerts').set('Authorization', `Bearer ${token}`).send({ severity: 'bad', message: 'x' }).expect(400)
    await appRequest().patch('/api/alerts/NOPE/acknowledge').set('Authorization', `Bearer ${token}`).expect(404)
  })
})
