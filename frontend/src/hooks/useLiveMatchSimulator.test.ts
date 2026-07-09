import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useLiveMatchSimulator } from './useLiveMatchSimulator'
import { mockMatches, mockMatchEvents } from '@/mocks/operationsData'
import type { Match, MatchEvent } from '@/types/operations'

const mockState = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  unsubscribeMock: vi.fn(),
  wsHandler: null as ((match: Match) => void) | null
}))

vi.mock('@/lib/apiClient', () => ({
  apiRequest: mockState.apiRequestMock
}))

vi.mock('@/lib/wsClient', () => ({
  wsClient: {
    subscribe: vi.fn((_type: string, handler: (match: Match) => void) => {
      mockState.wsHandler = handler
      return mockState.unsubscribeMock
    })
  }
}))

const backendMatches: Match[] = [
  {
    id: 'M-900',
    teamHome: 'HOME',
    teamAway: 'AWAY',
    scoreHome: 1,
    scoreAway: 2,
    timeElapsed: 64,
    isLive: true,
    status: 'live',
    statusLabel: 'LIVE'
  }
]

const backendEvents: MatchEvent[] = [
  {
    id: 'E-900',
    matchId: 'M-900',
    time: "63'",
    type: 'goal',
    detail: 'HOME GOAL',
    timestamp: '12:00:00'
  }
]

describe('useLiveMatchSimulator Hook', () => {
  beforeEach(() => {
    mockState.apiRequestMock.mockReset()
    mockState.unsubscribeMock.mockReset()
    mockState.wsHandler = null
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes with mock data before backend hydration completes', () => {
    mockState.apiRequestMock.mockReturnValue(new Promise(() => undefined))
    const { result } = renderHook(() => useLiveMatchSimulator())
    expect(result.current.matches).toEqual(mockMatches)
    expect(result.current.events).toEqual(mockMatchEvents)
  })

  it('hydrates matches and events from the backend', async () => {
    mockState.apiRequestMock
      .mockResolvedValueOnce(backendMatches)
      .mockResolvedValueOnce({ ...backendMatches[0], events: backendEvents })

    const { result } = renderHook(() => useLiveMatchSimulator())

    await waitFor(() => {
      expect(result.current.matches).toEqual(backendMatches)
      expect(result.current.events).toEqual(backendEvents)
    })
    expect(mockState.apiRequestMock).toHaveBeenCalledWith('/matches?limit=100')
    expect(mockState.apiRequestMock).toHaveBeenCalledWith('/matches/M-900')
  })

  it('falls back to mock data when backend hydration fails', async () => {
    mockState.apiRequestMock.mockRejectedValue(new Error('offline'))

    const { result } = renderHook(() => useLiveMatchSimulator())

    await waitFor(() => {
      expect(result.current.matches).toEqual(mockMatches)
      expect(result.current.events).toEqual(mockMatchEvents)
    })
  })

  it('updates match state from WebSocket broadcasts and refetches detail', async () => {
    mockState.apiRequestMock
      .mockResolvedValueOnce(backendMatches)
      .mockResolvedValueOnce({ ...backendMatches[0], events: backendEvents })
      .mockResolvedValueOnce([{ ...backendMatches[0], scoreHome: 3 }])
      .mockResolvedValueOnce({ ...backendMatches[0], scoreHome: 3, events: backendEvents })

    const { result } = renderHook(() => useLiveMatchSimulator())
    await waitFor(() => expect(result.current.matches[0]?.id).toBe('M-900'))

    mockState.wsHandler?.({ ...backendMatches[0], scoreHome: 3 })

    await waitFor(() => {
      expect(result.current.matches[0]?.scoreHome).toBe(3)
    })
  })

  it('unsubscribes from WebSocket updates on unmount', () => {
    mockState.apiRequestMock.mockReturnValue(new Promise(() => undefined))
    const { unmount } = renderHook(() => useLiveMatchSimulator())

    unmount()

    expect(mockState.unsubscribeMock).toHaveBeenCalled()
  })

  it('does not produce duplicate event IDs from backend event data', async () => {
    mockState.apiRequestMock
      .mockResolvedValueOnce(backendMatches)
      .mockResolvedValueOnce({ ...backendMatches[0], events: backendEvents })

    const { result } = renderHook(() => useLiveMatchSimulator())

    await waitFor(() => {
      const eventIds = result.current.events.map(event => event.id)
      expect(new Set(eventIds).size).toBe(eventIds.length)
    })
  })
})
