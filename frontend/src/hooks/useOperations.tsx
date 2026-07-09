import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import type { Match, VenueZone, Alert, Tournament, StandSection, Round, MatchEvent } from '../types/operations'
import {
  mockMatches,
  mockVenueZones,
  mockAlerts,
  mockTournament,
  mockStandSections,
  mockRounds,
  mockMatchEvents
} from '../mocks/operationsData'
import {
  generateRecommendations,
  type Recommendation
} from '../lib/assistantEngine'

export interface DecisionLogEntry {
  operator: string
  action: 'ACCEPTED' | 'DISMISSED'
  timestamp: string
  recId: string
  title: string
  suggestedAction: string
}

interface OperationsContextType {
  matches: Match[]
  events: MatchEvent[]
  zones: VenueZone[]
  alerts: Alert[]
  tournament: Tournament
  rounds: Round[]
  sections: StandSection[]
  recommendations: Recommendation[]
  decisionLog: DecisionLogEntry[]
  geminiApiKey: string
  setGeminiApiKey: (key: string) => void
  acceptRecommendation: (rec: Recommendation) => void
  dismissRecommendation: (rec: Recommendation) => void
  acknowledgeAlert: (id: string) => void
  simulateNewAlert: () => void
  toggleGate: (sectionId: string) => void
  clearIncidents: (sectionId: string) => void
}

const OperationsContext = createContext<OperationsContextType | undefined>(undefined)

export const OperationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [matches, setMatches] = useState<Match[]>(mockMatches)
  const [events, setEvents] = useState<MatchEvent[]>(mockMatchEvents)
  const [zones, setZones] = useState<VenueZone[]>(mockVenueZones)
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts)
  const [tournament] = useState<Tournament>(mockTournament)
  const [rounds, setRounds] = useState<Round[]>(mockRounds)
  const [sections, setSections] = useState<StandSection[]>(mockStandSections)
  const [decisionLog, setDecisionLog] = useState<DecisionLogEntry[]>([])
  const [dismissedRecIds, setDismissedRecIds] = useState<Set<string>>(new Set())
  const [geminiApiKey, setGeminiApiKeyState] = useState<string>(() => {
    return localStorage.getItem('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY || ''
  })

  const setGeminiApiKey = (key: string) => {
    setGeminiApiKeyState(key)
    localStorage.setItem('GEMINI_API_KEY', key)
  }

  // Refs to prevent stale closures in intervals
  const matchesRef = useRef<Match[]>(matches)
  const eventsRef = useRef<MatchEvent[]>(events)

  useEffect(() => {
    matchesRef.current = matches
    eventsRef.current = events
  }, [matches, events])

  // 1. Clock Ticking Simulator (ticks elapsed minutes every 8 seconds for live matches)
  useEffect(() => {
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
      const timestamp = now.toTimeString().split(' ')[0]
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

      const randomId = Math.random().toString(36).substring(2, 11)
      const newEvent: MatchEvent = {
        id: `E-SIM-${Date.now()}-${randomId}`,
        matchId: targetMatch.id,
        time: currentElapsed,
        type: randomType,
        detail: eventDetail,
        timestamp
      }

      setEvents(prev => [newEvent, ...prev])
      setMatches(prev => 
        prev.map(m => 
          m.id === targetMatch.id 
            ? { ...m, scoreHome: newScoreHome, scoreAway: newScoreAway } 
            : m
        )
      )

      // Automatically generate a matching live alert to trigger recommendation rules!
      const levelMap: Record<MatchEvent['type'], Alert['level']> = {
        goal: 'info',
        card_yellow: 'warning',
        card_red: 'critical',
        substitution: 'info',
        timeout: 'warning'
      }
      
      const newAlert: Alert = {
        id: `A-SIM-EVENT-${Date.now()}`,
        timestamp,
        message: `${levelMap[randomType].toUpperCase()}: Match ${targetMatch.id} event - ${eventDetail}`,
        level: levelMap[randomType],
        isAcknowledged: false
      }
      setAlerts(prev => [newAlert, ...prev])

    }, 15000)

    return () => {
      clearInterval(clockInterval)
      clearInterval(eventInterval)
    }
  }, [])

  // Acknowledge alert helper
  const acknowledgeAlert = (id: string) => {
    setAlerts(prev =>
      prev.map(alert => 
        alert.id === id ? { ...alert, isAcknowledged: true } : alert
      )
    )
  }

  // Simulate new alert helper (from dashboard)
  const simulateNewAlert = () => {
    const messages = [
      'Gate B automatic tourniquet reporting ticket read timeout',
      'VIP Section capacity reached 98% - Stress warning',
      'Referee requested official VAR review on Pitch Core 1',
      'Warning: Wind speeds rising to 24km/h - Monitor roof sensors',
      'Gate D secondary exit pathway opened for crowd venting'
    ]
    const levels: Alert['level'][] = ['info', 'warning', 'critical']
    
    const randomMsg = messages[Math.floor(Math.random() * messages.length)]
    const randomLevel = levels[Math.floor(Math.random() * levels.length)]
    
    const now = new Date()
    const timestamp = now.toTimeString().split(' ')[0]

    const newAlert: Alert = {
      id: `A-SIM-DASH-${Date.now()}`,
      timestamp,
      message: `${randomLevel.toUpperCase()}: ${randomMsg}`,
      level: randomLevel,
      isAcknowledged: false
    }

    setAlerts(prev => [newAlert, ...prev])
  }

  // Toggle Gate Status (from StadiumView)
  const toggleGate = (sectionId: string) => {
    setSections(prev =>
      prev.map(sec => sec.id === sectionId ? { ...sec, gateStatus: sec.gateStatus === 'open' ? 'closed' : 'open' } : sec)
    )
  }

  // Clear Incidents (from StadiumView)
  const clearIncidents = (sectionId: string) => {
    setSections(prev =>
      prev.map(sec => sec.id === sectionId ? { ...sec, incidents: 0 } : sec)
    )
  }

  // Calculate current recommendations based on deterministic engine
  const recommendations = generateRecommendations({
    matches,
    zones,
    alerts,
    tournament,
    rounds,
    sections
  }).filter(rec => !dismissedRecIds.has(rec.id))

  // Handle recommendation ACCEPT actions with simulated side-effects
  const acceptRecommendation = (rec: Recommendation) => {
    const now = new Date()
    const timestamp = now.toTimeString().split(' ')[0]

    setDecisionLog(prev => [
      {
        operator: 'OPERATOR-ALPHA',
        action: 'ACCEPTED',
        timestamp,
        recId: rec.id,
        title: rec.title,
        suggestedAction: rec.suggestedAction
      },
      ...prev
    ])

    // Apply corresponding side-effects
    if (rec.id.startsWith('REC-SECTION-')) {
      // Unlock access gates
      const sectionId = rec.relatedEntityId
      setSections(prev =>
        prev.map(sec => sec.id === sectionId ? { ...sec, gateStatus: 'open' } : sec)
      )
    } else if (rec.id.startsWith('REC-GATE-')) {
      // Relieve gate congestion: adjust occupancy down and open gates
      const zoneName = rec.relatedEntityId
      setZones(prev =>
        prev.map(zone =>
          zone.name === zoneName
            ? { ...zone, occupancy: Math.round(zone.maxCapacity * 0.72), status: 'completed', statusLabel: 'NOMINAL' }
            : zone
        )
      )
      // Mirror in stand sections if matching name
      setSections(prev =>
        prev.map(sec => {
          const isEast = zoneName.includes('EAST') && sec.id === 'sect-east'
          const isWest = zoneName.includes('WEST') && sec.id === 'sect-west'
          if (isEast || isWest) {
            return { ...sec, gateStatus: 'open', occupancy: Math.round(sec.maxCapacity * 0.72) }
          }
          return sec
        })
      )
    } else if (rec.id.startsWith('REC-INCIDENT-')) {
      // Security dispatch: acknowledge alerts & clear stand incidents in that zone
      const zoneName = rec.relatedEntityId
      setAlerts(prev =>
        prev.map(a => {
          const msg = a.message.toUpperCase()
          let isMatch = false
          if (zoneName.includes('WEST') && (msg.includes('GATE B') || msg.includes('WEST'))) isMatch = true
          if (zoneName.includes('EAST') && (msg.includes('GATE A') || msg.includes('EAST'))) isMatch = true
          if (zoneName.includes('VIP') && msg.includes('VIP')) isMatch = true
          if (zoneName.includes('CONCOURSE') && msg.includes('CONCOURSE')) isMatch = true
          if (zoneName.includes('CAR PARK') && msg.includes('CAR PARK')) isMatch = true

          return isMatch ? { ...a, isAcknowledged: true } : a
        })
      )

      setSections(prev =>
        prev.map(sec => {
          let isMatch = false
          if (zoneName.includes('WEST') && sec.id === 'sect-west') isMatch = true
          if (zoneName.includes('EAST') && sec.id === 'sect-east') isMatch = true
          if (zoneName.includes('NORTH') && sec.id === 'sect-north') isMatch = true
          if (zoneName.includes('SOUTH') && sec.id === 'sect-south') isMatch = true
          return isMatch ? { ...sec, incidents: 0 } : sec
        })
      )
    } else if (rec.id.startsWith('REC-DELAY-')) {
      // Reschedule matches
      const matchId = rec.relatedEntityId
      setRounds(prev =>
        prev.map(round => ({
          ...round,
          matches: round.matches.map(m =>
            m.id === matchId
              ? { ...m, status: 'scheduled', statusLabel: 'KICKOFF RESCHEDULED' }
              : m
          )
        }))
      )
    }

    // Dismiss the recommendation
    setDismissedRecIds(prev => {
      const next = new Set(prev)
      next.add(rec.id)
      return next
    })
  }

  // Handle recommendation DISMISS actions
  const dismissRecommendation = (rec: Recommendation) => {
    const now = new Date()
    const timestamp = now.toTimeString().split(' ')[0]

    setDecisionLog(prev => [
      {
        operator: 'OPERATOR-ALPHA',
        action: 'DISMISSED',
        timestamp,
        recId: rec.id,
        title: rec.title,
        suggestedAction: 'Ignored or manually resolved.'
      },
      ...prev
    ])

    setDismissedRecIds(prev => {
      const next = new Set(prev)
      next.add(rec.id)
      return next
    })
  }

  return (
    <OperationsContext.Provider
      value={{
        matches,
        events,
        zones,
        alerts,
        tournament,
        rounds,
        sections,
        recommendations,
        decisionLog,
        geminiApiKey,
        setGeminiApiKey,
        acceptRecommendation,
        dismissRecommendation,
        acknowledgeAlert,
        simulateNewAlert,
        toggleGate,
        clearIncidents
      }}
    >
      {children}
    </OperationsContext.Provider>
  )
}

export const useOperations = () => {
  const context = useContext(OperationsContext)
  if (!context) {
    throw new Error('useOperations must be used within an OperationsProvider')
  }
  return context
}
