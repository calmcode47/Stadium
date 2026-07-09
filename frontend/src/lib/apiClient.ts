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
} from '@/types/operations'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
const TOKEN_KEY = 'STADIUM_ACCESS_TOKEN'
const OPERATOR_KEY = 'STADIUM_OPERATOR'

interface ApiEnvelope<T> {
  data: T
}

interface ApiErrorEnvelope {
  error?: {
    message?: string
    code?: string
  }
}

export interface LoginResult {
  token: string
  expiresIn: string
  operator: OperatorProfile
}

export interface VenuesPayload {
  zones: VenueZone[]
  sections: StandSection[]
}

export interface OperationsSnapshot {
  matches: Match[]
  events: MatchEvent[]
  zones: VenueZone[]
  alerts: Alert[]
  tournament: Tournament
  rounds: Round[]
  sections: StandSection[]
  recommendations: Recommendation[]
  decisionLog: DecisionLogEntry[]
}

export const getStoredToken = (): string => localStorage.getItem(TOKEN_KEY) || ''

export const getStoredOperator = (): OperatorProfile | null => {
  const raw = localStorage.getItem(OPERATOR_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as OperatorProfile
  } catch {
    return null
  }
}

export const storeSession = (token: string, operator: OperatorProfile): void => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(OPERATOR_KEY, JSON.stringify(operator))
}

export const clearSession = (): void => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(OPERATOR_KEY)
}

export const apiRequest = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = getStoredToken()
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  })
  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T> & ApiErrorEnvelope
  if (!response.ok) {
    throw new Error(payload.error?.message || `Request failed with status ${response.status}`)
  }
  return payload.data
}

export const loginRequest = async (email: string, password: string): Promise<LoginResult> => {
  const result = await apiRequest<LoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
  storeSession(result.token, result.operator)
  return result
}

export const fetchOperationsSnapshot = async (): Promise<OperationsSnapshot> => {
  const [matches, venues, alerts, tournaments, recommendations] = await Promise.all([
    apiRequest<Match[]>('/matches?limit=100'),
    apiRequest<VenuesPayload>('/venues?limit=100'),
    apiRequest<Alert[]>('/alerts?limit=100'),
    apiRequest<Tournament[]>('/tournaments?limit=10'),
    apiRequest<Recommendation[]>('/assistant/recommendations')
  ])

  const tournament = tournaments[0]
  const rounds = tournament?.id ? await apiRequest<Round[]>(`/tournaments/${tournament.id}/bracket`) : []
  const activeMatch = matches.find(match => match.status === 'live') ?? matches[0]
  const matchDetail = activeMatch ? await apiRequest<Match & { events?: MatchEvent[] }>(`/matches/${activeMatch.id}`) : null
  const decisionLog = getStoredToken() ? await apiRequest<DecisionLogEntry[]>('/assistant/decision-log?limit=50') : []

  return {
    matches,
    events: matchDetail?.events ?? [],
    zones: venues.zones,
    alerts,
    tournament: tournament ?? { name: 'NO ACTIVE TOURNAMENT', stage: 'N/A', completedMatches: 0, totalMatches: 0 },
    rounds,
    sections: venues.sections,
    recommendations,
    decisionLog
  }
}

export const apiBaseUrl = API_BASE_URL
