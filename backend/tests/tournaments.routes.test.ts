import { describe, expect, it } from 'vitest'
import { appRequest, setupSeededDb } from './testUtils'

setupSeededDb()

describe('tournaments routes', () => {
  it('gets tournaments, bracket, and schedule', async () => {
    const list = await appRequest().get('/api/tournaments').expect(200)
    expect(list.body.data[0].id).toBe('T-CHAMPIONS-2026')
    const bracket = await appRequest().get('/api/tournaments/T-CHAMPIONS-2026/bracket').expect(200)
    expect(bracket.body.data).toHaveLength(3)
    const schedule = await appRequest().get('/api/tournaments/T-CHAMPIONS-2026/schedule').expect(200)
    expect(schedule.body.data.length).toBeGreaterThan(0)
  })

  it('returns not found for missing tournament', async () => {
    await appRequest().get('/api/tournaments/NOPE').expect(404)
  })
})
