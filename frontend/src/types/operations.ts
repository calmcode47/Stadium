export type MatchStatus = 'live' | 'scheduled' | 'completed' | 'delayed' | 'cancelled'
export type AlertLevel = 'info' | 'warning' | 'critical'
export type OperatorRole = 'admin' | 'operator' | 'viewer'

export interface Match {
  id: string
  teamHome: string
  teamAway: string
  scoreHome: number
  scoreAway: number
  timeElapsed: number // in minutes
  isLive: boolean
  status: MatchStatus
  statusLabel: string
}

export interface VenueZone {
  name: string
  occupancy: number
  maxCapacity: number
  status: MatchStatus // maps to StatusVariant
  statusLabel: string
}

export interface Alert {
  id: string
  timestamp: string // HH:MM:SS format
  message: string
  level: AlertLevel
  isAcknowledged: boolean
  createdAt?: string
}

export interface Tournament {
  id?: string
  name: string
  stage: string
  completedMatches: number
  totalMatches: number
}

export interface StandSection {
  id: string
  name: string
  occupancy: number
  maxCapacity: number
  gateStatus: 'open' | 'closed'
  incidents: number
}

export interface BracketMatch {
  id: string
  roundId: number // 1: Quarterfinals, 2: Semifinals, 3: Finals
  teamHome: string
  teamAway: string
  scoreHome?: number
  scoreAway?: number
  status: MatchStatus
  statusLabel: string
  nextMatchId?: string // Link to the next match
  winner?: 'home' | 'away'
  time: string
  date: string
  venue: string
  scheduledStart?: string
}

export interface Round {
  id: number
  name: string // e.g. "QUARTERFINALS", "SEMIFINALS", "FINALS"
  matches: BracketMatch[]
}

export interface MatchEvent {
  id: string
  matchId: string
  time: string // e.g. "74'" or "HT"
  type: 'goal' | 'card_yellow' | 'card_red' | 'substitution' | 'timeout'
  detail: string
  timestamp: string // HH:MM:SS
}

export interface Recommendation {
  id: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  reasoning: string[]
  suggestedAction: string
  relatedEntityId: string
  aiExplanation?: string
}

export interface DecisionLogEntry {
  id?: string
  operator: string
  action: 'ACCEPTED' | 'DISMISSED'
  timestamp: string
  recId: string
  title: string
  suggestedAction: string
}

export interface OperatorProfile {
  id: string
  name: string
  email: string
  role: OperatorRole
}

export interface OperationsState {
  matches: Match[]
  zones: VenueZone[]
  alerts: Alert[]
  tournament: Tournament
  rounds: Round[]
  sections: StandSection[]
}
