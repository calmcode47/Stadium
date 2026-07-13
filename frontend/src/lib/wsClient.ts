import type { Alert, Match, StandSection, VenueZone } from '@/types/operations'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/ws'

export interface WsEnvelope<T = unknown> {
  type: string
  payload: T
  timestamp: string
}

export type WsEventMap = {
  'match:updated': Match
  'venue:updated': VenueZone | StandSection
  'alert:created': Alert
  'alert:acknowledged': Alert
  'assistant:recommendations-changed': { reason: string }
  'connection:ready': { ok: boolean }
}

type Handler<T> = (payload: T, envelope: WsEnvelope<T>) => void

export class StadiumWsClient {
  private socket: WebSocket | null = null
  private reconnectTimer: number | null = null
  private reconnectAttempts = 0
  private handlers = new Map<string, Set<Handler<unknown>>>()

  connect(): void {
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return
    this.socket = new WebSocket(WS_URL)

    this.socket.onopen = () => {
      this.reconnectAttempts = 0
      this.sendSubscriptions()
    }

    this.socket.onmessage = event => {
      const envelope = JSON.parse(event.data) as WsEnvelope
      const handlers = this.handlers.get(envelope.type)
      handlers?.forEach(handler => handler(envelope.payload, envelope))
    }

    this.socket.onclose = () => {
      this.scheduleReconnect()
    }
  }

  subscribe<K extends keyof WsEventMap>(type: K, handler: Handler<WsEventMap[K]>): () => void {
    const handlers = this.handlers.get(type) ?? new Set<Handler<unknown>>()
    handlers.add(handler as Handler<unknown>)
    this.handlers.set(type, handlers)
    this.connect()
    this.sendSubscription(type)
    return () => {
      handlers.delete(handler as Handler<unknown>)
      if (handlers.size === 0) {
        this.handlers.delete(type)
        this.sendUnsubscription(type)
      }
    }
  }

  close(): void {
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer)
    this.socket?.close()
    this.socket = null
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 10000)
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.reconnectAttempts += 1
      this.connect()
    }, delay)
  }

  private sendSubscriptions(): void {
    for (const type of this.handlers.keys()) {
      this.sendSubscription(type)
    }
  }

  private sendSubscription(type: string): void {
    this.sendControlMessage('subscribe', type)
  }

  private sendUnsubscription(type: string): void {
    this.sendControlMessage('unsubscribe', type)
  }

  private sendControlMessage(action: 'subscribe' | 'unsubscribe', type: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return
    this.socket.send(JSON.stringify({ action, type }))
  }
}

export const wsClient = new StadiumWsClient()
