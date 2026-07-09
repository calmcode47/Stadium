import type { Server as HttpServer } from 'node:http'
import { WebSocketServer } from 'ws'
import { registerClient } from './broadcaster'

export const attachWebSocketServer = (server: HttpServer): WebSocketServer => {
  const wsServer = new WebSocketServer({ server, path: '/ws' })
  wsServer.on('connection', socket => {
    registerClient(socket)
    socket.send(
      JSON.stringify({
        type: 'connection:ready',
        payload: { ok: true },
        timestamp: new Date().toISOString()
      })
    )
  })
  return wsServer
}
