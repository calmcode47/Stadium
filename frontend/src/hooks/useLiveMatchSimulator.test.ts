import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useLiveMatchSimulator } from './useLiveMatchSimulator'

describe('useLiveMatchSimulator Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('initializes matches and events with mock data', () => {
    const { result } = renderHook(() => useLiveMatchSimulator())
    expect(result.current.matches.length).toBeGreaterThan(0)
    expect(result.current.events.length).toBeGreaterThan(0)
  })

  it('updates match clocks on an 8-second interval', () => {
    const { result } = renderHook(() => useLiveMatchSimulator())
    
    // Find a live match in initial state
    const liveMatch = result.current.matches.find(m => m.isLive && m.status === 'live')
    expect(liveMatch).toBeDefined()
    const initialElapsed = liveMatch!.timeElapsed

    // Advance clock by 8 seconds
    act(() => {
      vi.advanceTimersByTime(8000)
    })

    const updatedLiveMatch = result.current.matches.find(m => m.id === liveMatch!.id)
    expect(updatedLiveMatch!.timeElapsed).toBe(initialElapsed + 1)
  })

  it('triggers a random match event and updates score/event state on a 15-second interval', () => {
    const { result } = renderHook(() => useLiveMatchSimulator())
    const initialEventCount = result.current.events.length

    // Advance event timer by 15 seconds
    act(() => {
      vi.advanceTimersByTime(15000)
    })

    expect(result.current.events.length).toBe(initialEventCount + 1)
  })

  it('cleans up its interval timers on unmount', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    const { unmount } = renderHook(() => useLiveMatchSimulator())

    unmount()
    
    // clearInterval should have been called on unmount for both timers
    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('does not produce duplicate event IDs across updates', () => {
    const { result } = renderHook(() => useLiveMatchSimulator())

    // Advance time to generate multiple events (e.g. 5 ticks of 15 seconds = 75 seconds)
    act(() => {
      vi.advanceTimersByTime(75000)
    })

    const eventIds = result.current.events.map(e => e.id)
    const uniqueIds = new Set(eventIds)
    expect(uniqueIds.size).toBe(eventIds.length)
  })
})
