import type WebSocket from 'ws'

export interface WsEnvelope<T = unknown> {
  type: string
  payload: T
  timestamp: string
}

const clients = new Set<WebSocket>()

export const registerClient = (client: WebSocket): void => {
  clients.add(client)
  client.on('close', () => clients.delete(client))
}

export const broadcast = <T>(type: string, payload: T): void => {
  const message: WsEnvelope<T> = {
    type,
    payload,
    timestamp: new Date().toISOString()
  }

  const serialized = JSON.stringify(message)
  for (const client of clients) {
    if (client.readyState === client.OPEN) {
      client.send(serialized)
    }
  }
}

export const clientCount = (): number => clients.size
