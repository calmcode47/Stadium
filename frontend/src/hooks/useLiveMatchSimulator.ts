import { useState, useEffect, useRef } from 'react'
import type { Match, MatchEvent } from '@/types/operations'
import { mockMatches, mockMatchEvents } from '@/mocks/operationsData'

export const useLiveMatchSimulator = () => {
  const [matches, setMatches] = useState<Match[]>(mockMatches)
  const [events, setEvents] = useState<MatchEvent[]>(mockMatchEvents)

  // Use refs to store current state and prevent stale closures in intervals
  const matchesRef = useRef<Match[]>(matches)
  const eventsRef = useRef<MatchEvent[]>(events)

  useEffect(() => {
    matchesRef.current = matches
    eventsRef.current = events
  }, [matches, events])

  useEffect(() => {
    // 1. Clock Ticking Simulator (ticks elapsed minutes every 8 seconds for live matches)
    const clockInterval = setInterval(() => {
      setMatches(prevMatches =>
        prevMatches.map(match => {
          if (match.isLive && match.status === 'live') {
            const nextTime = match.timeElapsed + 1
            return {
              ...match,
              timeElapsed: nextTime >= 90 ? 90 : nextTime,
              status: nextTime >= 90 ? 'completed' : 'live',
              statusLabel: nextTime >= 90 ? 'FINAL' : 'LIVE - 2ND HALF'
            }
          }
          return match
        })
      )
    }, 8000)

    // 2. Incident & Match Event Simulator (triggers a goal, card, or sub every 15 seconds)
    const eventInterval = setInterval(() => {
      const currentMatches = matchesRef.current
      const liveMatches = currentMatches.filter(m => m.status === 'live')
      if (liveMatches.length === 0) return

      // Select a random live match
      const targetMatch = liveMatches[Math.floor(Math.random() * liveMatches.length)]
      
      // Randomly select event type
      const eventTypes: MatchEvent['type'][] = ['goal', 'card_yellow', 'card_red', 'substitution', 'timeout']
      const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
      
      const now = new Date()
      const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      
      const currentElapsed = `${targetMatch.timeElapsed + 1}'`

      let eventDetail = ''
      let newScoreHome = targetMatch.scoreHome
      let newScoreAway = targetMatch.scoreAway

      switch (randomType) {
        case 'goal': {
          const isHomeScorer = Math.random() > 0.5
          if (isHomeScorer) {
            newScoreHome += 1
            eventDetail = `${targetMatch.teamHome} GOAL - Striker scored into top corner!`
          } else {
            newScoreAway += 1
            eventDetail = `${targetMatch.teamAway} GOAL - Counter attack goal!`
          }
          break
        }
        case 'card_yellow': {
          const isHome = Math.random() > 0.5
          const player = isHome ? `${targetMatch.teamHome} defender` : `${targetMatch.teamAway} midfielder`
          eventDetail = `YELLOW CARD: ${player} booked for simulation`
          break
        }
        case 'card_red': {
          const isHome = Math.random() > 0.5
          const player = isHome ? `${targetMatch.teamHome} defender` : `${targetMatch.teamAway} striker`
          eventDetail = `RED CARD: ${player} dismissed for dangerous tackle`
          break
        }
        case 'substitution': {
          const isHome = Math.random() > 0.5
          const team = isHome ? targetMatch.teamHome : targetMatch.teamAway
          eventDetail = `SUBSTITUTION: ${team} OUT #10, IN #14`
          break
        }
        case 'timeout': {
          eventDetail = `OFFICIAL TIMEOUT: Technical check on pitch sensors`
          break
        }
      }

      // Create a unique, deterministic ID for this tick
      const randomId = Math.random().toString(36).substring(2, 11)
      const newEvent: MatchEvent = {
        id: `E-SIM-${Date.now()}-${randomId}`,
        matchId: targetMatch.id,
        time: currentElapsed,
        type: randomType,
        detail: eventDetail,
        timestamp
      }

      // Update both states safely without nesting state updaters
      setEvents(prev => [newEvent, ...prev])
      setMatches(prev => 
        prev.map(m => 
          m.id === targetMatch.id 
            ? { ...m, scoreHome: newScoreHome, scoreAway: newScoreAway } 
            : m
        )
      )

    }, 15000)

    // Cleanup: stop intervals on unmount to prevent memory leaks
    return () => {
      clearInterval(clockInterval)
      clearInterval(eventInterval)
    }
  }, [])

  return { matches, events }
}
