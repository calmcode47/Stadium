export interface Match {
  id: string
  teamHome: string
  teamAway: string
  scoreHome: number
  scoreAway: number
  timeElapsed: number // in minutes
  isLive: boolean
  status: 'live' | 'scheduled' | 'completed' | 'delayed' | 'cancelled'
  statusLabel: string
}

export interface VenueZone {
  name: string
  occupancy: number
  maxCapacity: number
  status: 'live' | 'scheduled' | 'completed' | 'delayed' | 'cancelled' // maps to StatusVariant
  statusLabel: string
}

export interface Alert {
  id: string
  timestamp: string // HH:MM:SS format
  message: string
  level: 'info' | 'warning' | 'critical'
  isAcknowledged: boolean
}

export interface Tournament {
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
  status: 'live' | 'scheduled' | 'completed' | 'delayed' | 'cancelled'
  statusLabel: string
  nextMatchId?: string // Link to the next match
  winner?: 'home' | 'away'
  time: string
  date: string
  venue: string
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
