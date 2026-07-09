import { describe, expect, it } from 'vitest'
import { appRequest, loginAs, setupSeededDb } from './testUtils'

setupSeededDb()

describe('venues routes', () => {
  it('gets venues and a section', async () => {
    const list = await appRequest().get('/api/venues').expect(200)
    expect(list.body.data.zones.length).toBeGreaterThan(0)
    await appRequest().get('/api/venues/sect-west').expect(200)
  })

  it('updates occupancy as operator', async () => {
    const token = await loginAs('operator')
    const response = await appRequest().patch('/api/venues/sect-west/occupancy').set('Authorization', `Bearer ${token}`).send({ occupancy: 15000 }).expect(200)
    expect(response.body.data.occupancy).toBe(15000)
  })

  it('guards gate lock mutations', async () => {
    await appRequest().patch('/api/venues/sect-west/gate-lock').send({ gateLocked: false }).expect(401)
    const token = await loginAs('viewer')
    await appRequest().patch('/api/venues/sect-west/gate-lock').set('Authorization', `Bearer ${token}`).send({ gateLocked: false }).expect(403)
  })

  it('returns validation and not found errors', async () => {
    const token = await loginAs('operator')
    await appRequest().patch('/api/venues/sect-west/occupancy').set('Authorization', `Bearer ${token}`).send({ occupancy: -1 }).expect(400)
    await appRequest().get('/api/venues/NOPE').expect(404)
  })
})
