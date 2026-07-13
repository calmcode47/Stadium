import http from 'node:http'
import WebSocket from 'ws'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { closeDatabase, setDatabaseForTests } from '../src/db/client'
import { resetEnvForTests } from '../src/config/env'
import { seedDatabase } from '../src/db/seed'
import { attachWebSocketServer } from '../src/realtime/wsServer'
import { configureTestEnv, loginAs } from './testUtils'

describe('websocket broadcasts', () => {
  let server: http.Server | null
  let baseUrl: string

  beforeEach(async () => {
    configureTestEnv()
    setDatabaseForTests(':memory:')
    await seedDatabase()
    const testServer = http.createServer(createApp())
    server = testServer
    attachWebSocketServer(testServer)
    await new Promise<void>(resolve => testServer.listen(0, resolve))
    const address = testServer.address()
    if (!address || typeof address === 'string') throw new Error('Missing test server address')
    baseUrl = `http://127.0.0.1:${address.port}`
  })

  afterEach(async () => {
    if (server) {
      await new Promise<void>(resolve => server?.close(() => resolve()))
      server = null
    }
    closeDatabase()
    resetEnvForTests()
  })

  it('receives match:updated after REST patch', async () => {
    const token = await loginAs('operator')
    const wsUrl = baseUrl.replace('http', 'ws') + '/ws'
    let socket: WebSocket | null = null
    const subscribed = new Promise<void>((resolve, reject) => {
      socket = new WebSocket(wsUrl)
      const timeout = setTimeout(() => reject(new Error('Timed out waiting for websocket open')), 5000)
      socket.on('open', () => {
        socket?.send(JSON.stringify({ action: 'subscribe', type: 'match:updated' }))
        clearTimeout(timeout)
        setTimeout(resolve, 25)
      })
    })

    const messagePromise = new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket?.close()
        reject(new Error('Timed out waiting for match update'))
      }, 5000)
      socket?.on('message', data => {
        const message = JSON.parse(data.toString()) as { type: string; payload: unknown }
        if (message.type === 'match:updated') {
          clearTimeout(timeout)
          socket?.close()
          resolve(message.payload)
        }
      })
    })

    await subscribed
    await request(baseUrl).patch('/api/matches/M-101').set('Authorization', `Bearer ${token}`).send({ scoreHome: 4 }).expect(200)
    const payload = (await messagePromise) as { id: string; scoreHome: number }
    expect(payload).toMatchObject({ id: 'M-101', scoreHome: 4 })
  })
})
