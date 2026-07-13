import { useEffect, useState } from 'react'
import type { Match, MatchEvent } from '@/types/operations'
import { mockMatches, mockMatchEvents } from '@/mocks/operationsData'
import { apiRequest } from '@/lib/apiClient'
import { wsClient } from '@/lib/wsClient'

/** Loads live match data and keeps it synchronized with backend match WebSocket updates. */
export const useLiveMatchSimulator = () => {
  const [matches, setMatches] = useState<Match[]>(mockMatches)
  const [events, setEvents] = useState<MatchEvent[]>(mockMatchEvents)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const nextMatches = await apiRequest<Match[]>('/matches?limit=100')
        const activeMatch = nextMatches.find(match => match.status === 'live') ?? nextMatches[0]
        const detail = activeMatch
          ? await apiRequest<Match & { events?: MatchEvent[] }>(`/matches/${activeMatch.id}`)
          : null
        if (!isMounted) return
        setMatches(nextMatches)
        setEvents(detail?.events ?? [])
      } catch {
        if (!isMounted) return
        setMatches(mockMatches)
        setEvents(mockMatchEvents)
      }
    }

    void load()
    const unsubscribe = wsClient.subscribe('match:updated', match => {
      setMatches(prev => prev.map(item => (item.id === match.id ? match : item)))
      void load()
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  return { matches, events }
}
