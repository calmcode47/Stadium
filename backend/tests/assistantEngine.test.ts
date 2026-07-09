import { describe, expect, it } from 'vitest'
import {
  evaluateGateCongestion,
  evaluateIncidentEscalation,
  evaluateMatchDelayRisk,
  evaluateTournamentBottleneck,
  generateRecommendations,
  GATE_CONGESTION_RATIO,
  INCIDENT_CLUSTER_COUNT,
  LOCKED_SECTION_RATIO,
  NEAR_MATCH_END_MINUTE
} from '../src/lib/assistantEngine'
import type { Alert, Match, OperationsState, Round, StandSection, Tournament, VenueZone } from '../src/types/operations'

const match = (overrides: Partial<Match> = {}): Match => ({
  id: 'M-T',
  teamHome: 'HOME',
  teamAway: 'AWAY',
  scoreHome: 1,
  scoreAway: 0,
  timeElapsed: NEAR_MATCH_END_MINUTE,
  isLive: true,
  status: 'live',
  statusLabel: 'LIVE',
  ...overrides
})

const zone = (ratio: number): VenueZone => ({
  name: 'SECTOR GATE B (WEST)',
  occupancy: Math.round(1000 * ratio),
  maxCapacity: 1000,
  status: 'completed',
  statusLabel: 'NOMINAL'
})

const section = (ratio: number, gateStatus: StandSection['gateStatus']): StandSection => ({
  id: 'sect-west',
  name: 'WEST STAND',
  occupancy: Math.round(1000 * ratio),
  maxCapacity: 1000,
  gateStatus,
  incidents: 0
})

const alert = (id: string, level: Alert['level'] = 'warning', isAcknowledged = false): Alert => ({
  id,
  timestamp: '12:00:00',
  message: `${level.toUpperCase()}: Gate B access congestion detected`,
  level,
  isAcknowledged
})

const rounds = (delayed = true): Round[] => [
  {
    id: 1,
    name: 'QUARTERFINALS',
    matches: [
      {
        id: 'QF-4',
        roundId: 1,
        teamHome: 'BARCELONA',
        teamAway: 'JUVENTUS',
        status: delayed ? 'delayed' : 'completed',
        statusLabel: delayed ? 'DELAYED' : 'FINAL',
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
        id: 'SF-2',
        roundId: 2,
        teamHome: 'INTER MILAN',
        teamAway: 'TBD (BAR / JUV)',
        status: 'scheduled',
        statusLabel: 'SCHEDULED',
        time: '21:30',
        date: 'JULY 11',
        venue: 'MAIN VENUE Arena'
      }
    ]
  }
]

const tournament: Tournament = { name: 'TEST', stage: 'QF', completedMatches: 0, totalMatches: 2 }

describe('assistant engine', () => {
  it('fires gate congestion at zone threshold and locked-section threshold', () => {
    const recommendations = evaluateGateCongestion([match()], [zone(GATE_CONGESTION_RATIO)], [section(LOCKED_SECTION_RATIO, 'closed')])
    expect(recommendations.map(item => item.id)).toContain('REC-GATE-SECTOR-GATE-B-WEST-M-T')
    expect(recommendations.some(item => item.id.startsWith('REC-SECTION-'))).toBe(true)
  })

  it('keeps gate congestion silent below threshold or before match end window', () => {
    expect(evaluateGateCongestion([match({ timeElapsed: NEAR_MATCH_END_MINUTE - 1 })], [zone(0.99)], [])).toHaveLength(0)
    expect(evaluateGateCongestion([match()], [zone(GATE_CONGESTION_RATIO - 0.01)], [section(LOCKED_SECTION_RATIO - 0.01, 'closed')])).toHaveLength(0)
  })

  it('treats exact gate threshold as triggering boundary', () => {
    expect(evaluateGateCongestion([match()], [zone(GATE_CONGESTION_RATIO)], [])).toHaveLength(1)
  })

  it('fires match delay risk when delayed and scheduled matches share venue', () => {
    expect(evaluateMatchDelayRisk(rounds()).some(item => item.id === 'REC-DELAY-QF-4-SF-2')).toBe(true)
  })

  it('keeps match delay silent without delayed matches', () => {
    expect(evaluateMatchDelayRisk(rounds(false))).toHaveLength(0)
  })

  it('treats a single delayed shared venue as delay-risk boundary', () => {
    expect(evaluateMatchDelayRisk(rounds())).toHaveLength(1)
  })

  it('fires incident escalation for clustered unresolved alerts', () => {
    expect(evaluateIncidentEscalation([alert('A1'), alert('A2')])).toHaveLength(1)
  })

  it('keeps incident escalation silent for acknowledged or single alerts', () => {
    expect(evaluateIncidentEscalation([alert('A1')])).toHaveLength(0)
    expect(evaluateIncidentEscalation([alert('A1', 'warning', true), alert('A2', 'critical', true)])).toHaveLength(0)
  })

  it('treats exact incident cluster count as triggering boundary', () => {
    const clustered = Array.from({ length: INCIDENT_CLUSTER_COUNT }, (_, index) => alert(`A${index}`))
    expect(evaluateIncidentEscalation(clustered)).toHaveLength(1)
  })

  it('fires tournament bottleneck when delayed match blocks TBD future round', () => {
    expect(evaluateTournamentBottleneck(rounds())).toHaveLength(1)
  })

  it('keeps tournament bottleneck silent without delayed matches', () => {
    expect(evaluateTournamentBottleneck(rounds(false))).toHaveLength(0)
  })

  it('treats one delayed match and one TBD future match as bottleneck boundary', () => {
    expect(evaluateTournamentBottleneck(rounds())[0]?.relatedEntityId).toBe('QF-4')
  })

  it('sorts mixed recommendations by priority deterministically', () => {
    const state: OperationsState = {
      matches: [match()],
      zones: [zone(0.96)],
      alerts: [alert('A1', 'critical'), alert('A2')],
      tournament,
      rounds: rounds(),
      sections: []
    }
    const priorities = generateRecommendations(state).map(item => item.priority)
    expect(priorities.slice(0, 2)).toEqual(['critical', 'critical'])
    expect(priorities.at(-1)).toBe('medium')
  })
})
