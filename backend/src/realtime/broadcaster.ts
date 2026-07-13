import type WebSocket from 'ws'

export interface WsEnvelope<T = unknown> {
  type: string
  payload: T
  timestamp: string
}

const clients = new Map<WebSocket, Set<string>>()

export const registerClient = (client: WebSocket): void => {
  clients.set(client, new Set())
  client.on('message', data => {
    handleControlMessage(client, data.toString())
  })
  client.on('close', () => clients.delete(client))
}

export const broadcast = <T>(type: string, payload: T): void => {
  const message: WsEnvelope<T> = {
    type,
    payload,
    timestamp: new Date().toISOString()
  }

  const serialized = JSON.stringify(message)
  for (const [client, subscriptions] of clients.entries()) {
    if (client.readyState === client.OPEN && subscriptions.has(type)) {
      client.send(serialized)
    }
  }
}

export const clientCount = (): number => clients.size

const handleControlMessage = (client: WebSocket, raw: string): void => {
  let message: { action?: unknown; type?: unknown }
  try {
    message = JSON.parse(raw) as { action?: unknown; type?: unknown }
  } catch {
    return
  }

  if (typeof message.type !== 'string') return
  const subscriptions = clients.get(client)
  if (!subscriptions) return
  if (message.action === 'subscribe') subscriptions.add(message.type)
  if (message.action === 'unsubscribe') subscriptions.delete(message.type)
}
