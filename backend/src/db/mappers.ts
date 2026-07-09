import type { Alert, AlertLevel, BracketMatch, Match, MatchEvent, MatchStatus, Round, StandSection, Tournament, VenueZone } from '../types/operations'
import { timeOfDay } from '../lib/ids'

export interface VenueRow {
  id: string
  name: string
  zoneCode: string
  capacity: number
  currentOccupancy: number
  gateLocked: boolean
  incidents: number
  kind: 'zone' | 'section'
  updatedAt: string
}

export interface MatchRow {
  id: string
  tournamentId: string
  roundId: string | null
  venueId: string
  teamHomeName: string
  teamAwayName: string
  teamHomeScore: number
  teamAwayScore: number
  status: MatchStatus
  clockSeconds: number
  period: string
  scheduledStart: string
  statusLabel: string
  nextMatchId: string | null
  winner: 'home' | 'away' | null
  updatedAt: string
}

export interface AlertRow {
  id: string
  venueId: string | null
  severity: AlertLevel
  message: string
  acknowledged: boolean
  createdAt: string
  acknowledgedAt: string | null
}

export interface MatchEventRow {
  id: string
  matchId: string
  type: 'goal' | 'card' | 'substitution' | 'timeout'
  team: string | null
  minute: number
  description: string
  createdAt: string
}

export interface TournamentRow {
  id: string
  name: string
  status: string
  currentRound: string
  totalRounds: number
}

export interface RoundRow {
  id: string
  tournamentId: string
  name: string
  orderIndex: number
  startDate: string
  endDate: string
}

export const mapMatch = (row: MatchRow): Match => ({
  id: row.id,
  teamHome: row.teamHomeName,
  teamAway: row.teamAwayName,
  scoreHome: row.teamHomeScore,
  scoreAway: row.teamAwayScore,
  timeElapsed: Math.floor(row.clockSeconds / 60),
  isLive: row.status === 'live',
  status: row.status,
  statusLabel: row.statusLabel
})

export const mapVenueZone = (row: VenueRow): VenueZone => ({
  name: row.name,
  occupancy: row.currentOccupancy,
  maxCapacity: row.capacity,
  status: row.currentOccupancy / row.capacity >= 0.85 ? 'delayed' : 'completed',
  statusLabel: row.currentOccupancy / row.capacity >= 0.85 ? 'CONGESTED' : 'NOMINAL'
})

export const mapStandSection = (row: VenueRow): StandSection => ({
  id: row.id,
  name: row.name,
  occupancy: row.currentOccupancy,
  maxCapacity: row.capacity,
  gateStatus: row.gateLocked ? 'closed' : 'open',
  incidents: row.incidents
})

export const mapAlert = (row: AlertRow): Alert => ({
  id: row.id,
  timestamp: timeOfDay(row.createdAt),
  message: row.message,
  level: row.severity,
  isAcknowledged: row.acknowledged
})

export const mapMatchEvent = (row: MatchEventRow): MatchEvent => ({
  id: row.id,
  matchId: row.matchId,
  time: `${row.minute}'`,
  type: row.type === 'card' ? (row.description.toLowerCase().includes('red') ? 'card_red' : 'card_yellow') : row.type,
  detail: row.description,
  timestamp: timeOfDay(row.createdAt)
})

export const mapTournamentSummary = (row: TournamentRow, matchRows: MatchRow[]): Tournament => {
  const totalMatches = matchRows.length
  const completedMatches = matchRows.filter(match => match.status === 'completed').length
  return {
    id: row.id,
    name: row.name,
    stage: row.currentRound,
    completedMatches,
    totalMatches
  }
}

export const mapBracketMatch = (row: MatchRow, venueName: string, roundOrder: number): BracketMatch => {
  const date = new Date(row.scheduledStart)
  const scoreHome = row.status === 'scheduled' ? undefined : row.teamHomeScore
  const scoreAway = row.status === 'scheduled' ? undefined : row.teamAwayScore
  return {
    id: row.id,
    roundId: roundOrder,
    teamHome: row.teamHomeName,
    teamAway: row.teamAwayName,
    scoreHome,
    scoreAway,
    status: row.status,
    statusLabel: row.statusLabel,
    nextMatchId: row.nextMatchId ?? undefined,
    winner: row.winner ?? undefined,
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    date: date.toLocaleDateString('en-US', { month: 'long', day: '2-digit' }).toUpperCase(),
    venue: venueName
  }
}

export const mapRounds = (roundRows: RoundRow[], matchRows: MatchRow[], venueRows: VenueRow[]): Round[] => {
  const venueNames = new Map(venueRows.map(venue => [venue.id, venue.name]))
  return roundRows
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .map(round => ({
      id: round.orderIndex,
      name: round.name,
      matches: matchRows
        .filter(match => match.roundId === round.id)
        .sort((left, right) => left.scheduledStart.localeCompare(right.scheduledStart))
        .map(match => mapBracketMatch(match, venueNames.get(match.venueId) ?? 'UNKNOWN VENUE', round.orderIndex))
    }))
}
