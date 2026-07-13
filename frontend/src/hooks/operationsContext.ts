import { createContext } from 'react'
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

export interface OperationsContextType {
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

export const OperationsContext = createContext<OperationsContextType | undefined>(undefined)
