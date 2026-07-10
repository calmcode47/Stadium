import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type {
  Alert,
  DecisionLogEntry,
  Match,
  MatchEvent,
  OperatorProfile,
  Recommendation,
  Round,
  StandSection,
  Tournament,
  VenueZone
} from '../types/operations'
import {
  mockAlerts,
  mockMatchEvents,
  mockMatches,
  mockRounds,
  mockStandSections,
  mockTournament,
  mockVenueZones
} from '../mocks/operationsData'
import {
  apiRequest,
  clearSession,
  fetchOperationsSnapshot,
  getStoredOperator,
  getStoredToken,
  loginRequest
} from '../lib/apiClient'
import { wsClient } from '../lib/wsClient'

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
  loading: boolean
  error: string | null
  operator: OperatorProfile | null
  isAuthenticated: boolean
  authError: string | null
  canMutate: boolean
  setGeminiApiKey: (key: string) => void
  clearGeminiApiKey: () => void
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  acceptRecommendation: (rec: Recommendation) => void
  dismissRecommendation: (rec: Recommendation) => void
  acknowledgeAlert: (id: string) => void
  simulateNewAlert: () => void
  toggleGate: (sectionId: string) => void
  clearIncidents: (sectionId: string) => void
}

const OperationsContext = createContext<OperationsContextType | undefined>(undefined)

const GEMINI_KEY_STORAGE = 'GEMINI_API_KEY'
const GEMINI_KEY_SOURCE_STORAGE = 'GEMINI_API_KEY_SOURCE'

const resolveGeminiApiKey = (): string => {
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim()
  const storedKey = (localStorage.getItem(GEMINI_KEY_STORAGE) || '').trim()
  const source = localStorage.getItem(GEMINI_KEY_SOURCE_STORAGE)

  // Use the browser-saved key only when the user explicitly saved one in Settings.
  if (source === 'user' && storedKey) return storedKey
  return envKey || storedKey
}

export const OperationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [matches, setMatches] = useState<Match[]>(mockMatches)
  const [events, setEvents] = useState<MatchEvent[]>(mockMatchEvents)
  const [zones, setZones] = useState<VenueZone[]>(mockVenueZones)
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts)
  const [tournament, setTournament] = useState<Tournament>(mockTournament)
  const [rounds, setRounds] = useState<Round[]>(mockRounds)
  const [sections, setSections] = useState<StandSection[]>(mockStandSections)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [decisionLog, setDecisionLog] = useState<DecisionLogEntry[]>([])
  const [dismissedRecIds, setDismissedRecIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [operator, setOperator] = useState<OperatorProfile | null>(() => getStoredOperator())
  const [authError, setAuthError] = useState<string | null>(null)
  const [geminiApiKey, setGeminiApiKeyState] = useState<string>(resolveGeminiApiKey)

  const canMutate = operator?.role === 'admin' || operator?.role === 'operator'

  const setGeminiApiKey = (key: string) => {
    const trimmed = key.trim()
    setGeminiApiKeyState(trimmed)
    localStorage.setItem(GEMINI_KEY_STORAGE, trimmed)
    localStorage.setItem(GEMINI_KEY_SOURCE_STORAGE, 'user')
  }

  const clearGeminiApiKey = () => {
    localStorage.removeItem(GEMINI_KEY_STORAGE)
    localStorage.removeItem(GEMINI_KEY_SOURCE_STORAGE)
    setGeminiApiKeyState(resolveGeminiApiKey())
  }

  const refreshRecommendations = useCallback(async () => {
    try {
      const nextRecommendations = await apiRequest<Recommendation[]>('/assistant/recommendations')
      setRecommendations(nextRecommendations.filter(rec => !dismissedRecIds.has(rec.id)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to refresh assistant recommendations')
    }
  }, [dismissedRecIds])

  const refreshDecisionLog = useCallback(async () => {
    if (!getStoredToken()) return
    try {
      const nextLog = await apiRequest<DecisionLogEntry[]>('/assistant/decision-log?limit=50')
      setDecisionLog(nextLog)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to refresh decision log')
    }
  }, [])

  const refreshSnapshot = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const snapshot = await fetchOperationsSnapshot()
      setMatches(snapshot.matches)
      setEvents(snapshot.events)
      setZones(snapshot.zones)
      setAlerts(snapshot.alerts)
      setTournament(snapshot.tournament)
      setRounds(snapshot.rounds)
      setSections(snapshot.sections)
      setRecommendations(snapshot.recommendations.filter(rec => !dismissedRecIds.has(rec.id)))
      setDecisionLog(snapshot.decisionLog)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backend unavailable. Showing last known demo data.')
    } finally {
      setLoading(false)
    }
  }, [dismissedRecIds])

  useEffect(() => {
    void refreshSnapshot()
  }, [refreshSnapshot])

  useEffect(() => {
    if (!getStoredToken()) return
    apiRequest<OperatorProfile>('/auth/me')
      .then(setOperator)
      .catch(() => {
        clearSession()
        setOperator(null)
      })
  }, [])

  useEffect(() => {
    const unsubscribers = [
      wsClient.subscribe('match:updated', match => {
        setMatches(prev => prev.map(item => (item.id === match.id ? match : item)))
        void refreshRecommendations()
      }),
      wsClient.subscribe('venue:updated', venue => {
        if ('id' in venue) {
          setSections(prev => prev.map(section => (section.id === venue.id ? venue : section)))
        } else {
          setZones(prev => prev.map(zone => (zone.name === venue.name ? venue : zone)))
        }
        void refreshRecommendations()
      }),
      wsClient.subscribe('alert:created', alert => {
        setAlerts(prev => [alert, ...prev.filter(item => item.id !== alert.id)])
        void refreshRecommendations()
      }),
      wsClient.subscribe('alert:acknowledged', alert => {
        setAlerts(prev => prev.map(item => (item.id === alert.id ? alert : item)))
        void refreshRecommendations()
      }),
      wsClient.subscribe('assistant:recommendations-changed', () => {
        void refreshRecommendations()
        void refreshDecisionLog()
      })
    ]

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }, [refreshDecisionLog, refreshRecommendations])

  const login = async (email: string, password: string) => {
    setAuthError(null)
    try {
      const result = await loginRequest(email, password)
      setOperator(result.operator)
      await refreshSnapshot()
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Login failed')
      throw err
    }
  }

  const logout = () => {
    clearSession()
    setOperator(null)
    setDecisionLog([])
  }

  const acknowledgeAlert = (id: string) => {
    if (!canMutate) return
    apiRequest<Alert>(`/alerts/${id}/acknowledge`, { method: 'PATCH' })
      .then(alert => {
        setAlerts(prev => prev.map(item => (item.id === id ? alert : item)))
        void refreshRecommendations()
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Unable to acknowledge alert'))
  }

  const simulateNewAlert = () => {
    if (!canMutate) return
    apiRequest<Alert>('/alerts', {
      method: 'POST',
      body: JSON.stringify({
        venueId: 'zone-west',
        severity: 'warning',
        message: 'Gate B automatic tourniquet reporting ticket read timeout'
      })
    })
      .then(alert => setAlerts(prev => [alert, ...prev]))
      .catch(err => setError(err instanceof Error ? err.message : 'Unable to create alert'))
  }

  const toggleGate = (sectionId: string) => {
    if (!canMutate) return
    const section = sections.find(item => item.id === sectionId)
    if (!section) return
    apiRequest<StandSection>(`/venues/${sectionId}/gate-lock`, {
      method: 'PATCH',
      body: JSON.stringify({ gateLocked: section.gateStatus === 'open' })
    })
      .then(updated => {
        setSections(prev => prev.map(item => (item.id === sectionId ? updated : item)))
        void refreshRecommendations()
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Unable to toggle gate state'))
  }

  const clearIncidents = (sectionId: string) => {
    if (!canMutate) return
    const section = sections.find(item => item.id === sectionId)
    if (!section) return

    const sectionAlerts = alerts.filter(alert => !alert.isAcknowledged && alertMatchesSection(alert, section))
    sectionAlerts.forEach(alert => acknowledgeAlert(alert.id))
    setSections(prev => prev.map(item => (item.id === sectionId ? { ...item, incidents: 0 } : item)))
  }

  const acceptRecommendation = (rec: Recommendation) => {
    apiRequest<DecisionLogEntry>(`/assistant/recommendations/${rec.id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ action: 'accepted', operatorId: operator?.id })
    })
      .then(log => {
        setDecisionLog(prev => [log, ...prev])
        setDismissedRecIds(prev => new Set(prev).add(rec.id))
        applyAcceptedRecommendation(rec)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Unable to record recommendation decision'))
  }

  const dismissRecommendation = (rec: Recommendation) => {
    apiRequest<DecisionLogEntry>(`/assistant/recommendations/${rec.id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ action: 'dismissed', operatorId: operator?.id })
    })
      .then(log => {
        setDecisionLog(prev => [log, ...prev])
        setDismissedRecIds(prev => new Set(prev).add(rec.id))
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Unable to record recommendation decision'))
  }

  const applyAcceptedRecommendation = (rec: Recommendation) => {
    if (rec.id.startsWith('REC-SECTION-')) {
      setSections(prev => prev.map(section => (section.id === rec.relatedEntityId ? { ...section, gateStatus: 'open' } : section)))
    }
    if (rec.id.startsWith('REC-INCIDENT-')) {
      setAlerts(prev => prev.map(alert => (alertZoneMatches(alert, rec.relatedEntityId) ? { ...alert, isAcknowledged: true } : alert)))
    }
  }

  const visibleRecommendations = useMemo(
    () => recommendations.filter(rec => !dismissedRecIds.has(rec.id)),
    [dismissedRecIds, recommendations]
  )

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
        recommendations: visibleRecommendations,
        decisionLog,
        geminiApiKey,
        loading,
        error,
        operator,
        isAuthenticated: Boolean(operator),
        authError,
        canMutate,
        setGeminiApiKey,
        clearGeminiApiKey,
        login,
        logout,
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

const alertMatchesSection = (alert: Alert, section: StandSection): boolean => {
  const message = alert.message.toUpperCase()
  const sectionName = section.name.toUpperCase()
  return (
    (sectionName.includes('WEST') && (message.includes('WEST') || message.includes('GATE B') || message.includes('VIP'))) ||
    (sectionName.includes('EAST') && (message.includes('EAST') || message.includes('GATE A'))) ||
    (sectionName.includes('NORTH') && (message.includes('NORTH') || message.includes('CAR PARK'))) ||
    (sectionName.includes('SOUTH') && message.includes('SOUTH'))
  )
}

const alertZoneMatches = (alert: Alert, zone: string): boolean => {
  const message = alert.message.toUpperCase()
  const target = zone.toUpperCase()
  return (
    (target.includes('WEST') && (message.includes('WEST') || message.includes('GATE B'))) ||
    (target.includes('EAST') && (message.includes('EAST') || message.includes('GATE A'))) ||
    (target.includes('VIP') && message.includes('VIP')) ||
    (target.includes('CONCOURSE') && message.includes('CONCOURSE')) ||
    (target.includes('CAR PARK') && message.includes('CAR PARK'))
  )
}

export const useOperations = () => {
  const context = useContext(OperationsContext)
  if (!context) {
    throw new Error('useOperations must be used within an OperationsProvider')
  }
  return context
}
