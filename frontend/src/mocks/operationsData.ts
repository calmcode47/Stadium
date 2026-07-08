import type { Match, VenueZone, Alert, Tournament, StandSection, Round, MatchEvent } from '../types/operations'

export const mockMatches: Match[] = [
  {
    id: 'M-101',
    teamHome: 'REAL MADRID',
    teamAway: 'MANCHESTER CITY',
    scoreHome: 2,
    scoreAway: 1,
    timeElapsed: 74,
    isLive: true,
    status: 'live',
    statusLabel: 'LIVE - 2ND HALF'
  },
  {
    id: 'M-102',
    teamHome: 'BAYERN MUNICH',
    teamAway: 'PARIS SAINT-GERMAIN',
    scoreHome: 0,
    scoreAway: 0,
    timeElapsed: 0,
    isLive: false,
    status: 'scheduled',
    statusLabel: 'SCHEDULED - 22:00'
  },
  {
    id: 'M-103',
    teamHome: 'AC MILAN',
    teamAway: 'INTER MILAN',
    scoreHome: 1,
    scoreAway: 3,
    timeElapsed: 90,
    isLive: false,
    status: 'completed',
    statusLabel: 'FINAL'
  },
  {
    id: 'M-104',
    teamHome: 'BARCELONA',
    teamAway: 'JUVENTUS',
    scoreHome: 0,
    scoreAway: 0,
    timeElapsed: 0,
    isLive: false,
    status: 'delayed',
    statusLabel: 'DELAYED - 15 MIN'
  },
  {
    id: 'M-105',
    teamHome: 'LIVERPOOL',
    teamAway: 'ARSENAL',
    scoreHome: 0,
    scoreAway: 0,
    timeElapsed: 0,
    isLive: false,
    status: 'cancelled',
    statusLabel: 'CANCELLED'
  }
]

export const mockVenueZones: VenueZone[] = [
  {
    name: 'SECTOR GATE A (EAST)',
    occupancy: 4200,
    maxCapacity: 5000,
    status: 'completed', // Nominal
    statusLabel: 'NOMINAL'
  },
  {
    name: 'SECTOR GATE B (WEST)',
    occupancy: 4850,
    maxCapacity: 5000,
    status: 'delayed', // Congested
    statusLabel: 'CONGESTED'
  },
  {
    name: 'MAIN CONCOURSE',
    occupancy: 11400,
    maxCapacity: 15000,
    status: 'completed',
    statusLabel: 'NOMINAL'
  },
  {
    name: 'VIP HOSPITALITY SUITES',
    occupancy: 960,
    maxCapacity: 1000,
    status: 'delayed',
    statusLabel: 'CONGESTED'
  },
  {
    name: 'NORTH CAR PARK',
    occupancy: 7800,
    maxCapacity: 8000,
    status: 'completed',
    statusLabel: 'NOMINAL'
  }
]

export const mockAlerts: Alert[] = [
  {
    id: 'A-201',
    timestamp: '21:05:44',
    message: 'Gate B access congestion detected - Flow capacity exceeds 96%',
    level: 'warning',
    isAcknowledged: false
  },
  {
    id: 'A-202',
    timestamp: '21:02:11',
    message: 'CRITICAL: VIP Gate barcode scanner device connection failure',
    level: 'critical',
    isAcknowledged: false
  },
  {
    id: 'A-203',
    timestamp: '20:55:00',
    message: 'Match M-104 (BAR vs JUV) delayed 15 minutes due to technical broadcast test',
    level: 'info',
    isAcknowledged: false
  },
  {
    id: 'A-204',
    timestamp: '20:48:33',
    message: 'Pitch sprinkler automated cycle completed successfully',
    level: 'info',
    isAcknowledged: true
  }
]

export const mockTournament: Tournament = {
  name: 'CHAMPIONS LEAGUE BRACKET',
  stage: 'QUARTERFINALS',
  completedMatches: 4,
  totalMatches: 8
}

export const mockStandSections: StandSection[] = [
  {
    id: 'sect-north',
    name: 'NORTH STAND (TICKET G1/G2)',
    occupancy: 18450,
    maxCapacity: 22000,
    gateStatus: 'open',
    incidents: 0
  },
  {
    id: 'sect-south',
    name: 'SOUTH STAND (TICKET G5/G6)',
    occupancy: 21200,
    maxCapacity: 22000,
    gateStatus: 'open',
    incidents: 1
  },
  {
    id: 'sect-east',
    name: 'EAST STAND (TICKET G3/G4)',
    occupancy: 24100,
    maxCapacity: 26000,
    gateStatus: 'open',
    incidents: 0
  },
  {
    id: 'sect-west',
    name: 'WEST STAND (VIP SECTORS)',
    occupancy: 17500,
    maxCapacity: 20000,
    gateStatus: 'closed',
    incidents: 2
  }
]

export const mockRounds: Round[] = [
  {
    id: 1,
    name: 'QUARTERFINALS',
    matches: [
      {
        id: 'QF-1',
        roundId: 1,
        teamHome: 'REAL MADRID',
        teamAway: 'MANCHESTER CITY',
        scoreHome: 2,
        scoreAway: 1,
        status: 'completed',
        statusLabel: 'FINAL',
        winner: 'home',
        nextMatchId: 'SF-1',
        time: '18:00',
        date: 'JULY 08',
        venue: 'MAIN VENUE Arena'
      },
      {
        id: 'QF-2',
        roundId: 1,
        teamHome: 'BAYERN MUNICH',
        teamAway: 'PARIS SAINT-GERMAIN',
        scoreHome: 3,
        scoreAway: 2,
        status: 'completed',
        statusLabel: 'FINAL',
        winner: 'home',
        nextMatchId: 'SF-1',
        time: '20:30',
        date: 'JULY 08',
        venue: 'EAST PRACTICE DOME'
      },
      {
        id: 'QF-3',
        roundId: 1,
        teamHome: 'AC MILAN',
        teamAway: 'INTER MILAN',
        scoreHome: 1,
        scoreAway: 3,
        status: 'completed',
        statusLabel: 'FINAL',
        winner: 'away',
        nextMatchId: 'SF-2',
        time: '18:00',
        date: 'JULY 09',
        venue: 'WEST CUP Arena'
      },
      {
        id: 'QF-4',
        roundId: 1,
        teamHome: 'BARCELONA',
        teamAway: 'JUVENTUS',
        scoreHome: 0,
        scoreAway: 0,
        status: 'delayed',
        statusLabel: 'DELAYED',
        nextMatchId: 'SF-2',
        time: '20:30',
        date: 'JULY 09',
        venue: 'MAIN VENUE Arena'
      }
    ]
  },
  {
    id: 2,
    name: 'SEMIFINALS',
    matches: [
      {
        id: 'SF-1',
        roundId: 2,
        teamHome: 'REAL MADRID',
        teamAway: 'BAYERN MUNICH',
        scoreHome: 0,
        scoreAway: 0,
        status: 'scheduled',
        statusLabel: 'JULY 11 - 19:00',
        nextMatchId: 'F-1',
        time: '19:00',
        date: 'JULY 11',
        venue: 'MAIN VENUE Arena'
      },
      {
        id: 'SF-2',
        roundId: 2,
        teamHome: 'INTER MILAN',
        teamAway: 'TBD (BAR / JUV)',
        scoreHome: 0,
        scoreAway: 0,
        status: 'scheduled',
        statusLabel: 'JULY 11 - 21:30',
        nextMatchId: 'F-1',
        time: '21:30',
        date: 'JULY 11',
        venue: 'WEST CUP Arena'
      }
    ]
  },
  {
    id: 3,
    name: 'FINALS',
    matches: [
      {
        id: 'F-1',
        roundId: 3,
        teamHome: 'TBD (SF1 WINNER)',
        teamAway: 'TBD (SF2 WINNER)',
        scoreHome: 0,
        scoreAway: 0,
        status: 'scheduled',
        statusLabel: 'JULY 14 - 20:00',
        time: '20:00',
        date: 'JULY 14',
        venue: 'MAIN VENUE Arena'
      }
    ]
  }
]

export const mockMatchEvents: MatchEvent[] = [
  {
    id: 'E-101',
    matchId: 'M-101',
    time: '71\'',
    type: 'goal',
    detail: 'REAL MADRID GOAL - Vinicius Jr. (Assist by Bellingham)',
    timestamp: '21:00:15'
  },
  {
    id: 'E-102',
    matchId: 'M-101',
    time: '64\'',
    type: 'card_yellow',
    detail: 'MANCHESTER CITY - Yellow Card: Ruben Dias (Tactical Foul)',
    timestamp: '20:52:45'
  },
  {
    id: 'E-103',
    matchId: 'M-101',
    time: '52\'',
    type: 'substitution',
    detail: 'REAL MADRID - Sub: Rodrygo OUT, Brahim Diaz IN',
    timestamp: '20:39:10'
  },
  {
    id: 'E-104',
    matchId: 'M-101',
    time: '41\'',
    type: 'goal',
    detail: 'MANCHESTER CITY GOAL - Erling Haaland (Penalty)',
    timestamp: '20:25:30'
  },
  {
    id: 'E-105',
    matchId: 'M-101',
    time: '18\'',
    type: 'goal',
    detail: 'REAL MADRID GOAL - Jude Bellingham (Header)',
    timestamp: '19:58:12'
  }
]
