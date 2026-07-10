import { describe, it, expect, vi } from 'vitest'
import {
  evaluateGateCongestion,
  evaluateMatchDelayRisk,
  evaluateIncidentEscalation,
  evaluateTournamentBottleneck,
  generateRecommendations,
  explainWithAI,
  chatWithAI,
  type OperationsState
} from './assistantEngine'
import type { Match, VenueZone, Alert, StandSection } from '../types/operations'

// Mock builders to simplify test setup
const buildMatch = (overrides: Partial<Match> = {}): Match => ({
  id: 'M-101',
  teamHome: 'HOME',
  teamAway: 'AWAY',
  scoreHome: 0,
  scoreAway: 0,
  timeElapsed: 75,
  isLive: true,
  status: 'live',
  statusLabel: 'LIVE',
  ...overrides
})

const buildZone = (overrides: Partial<VenueZone> = {}): VenueZone => ({
  name: 'GATE B',
  occupancy: 4250,
  maxCapacity: 5000,
  status: 'completed',
  statusLabel: 'NOMINAL',
  ...overrides
})

const buildSection = (overrides: Partial<StandSection> = {}): StandSection => ({
  id: 'sect-west',
  name: 'WEST STAND',
  occupancy: 4000,
  maxCapacity: 5000,
  gateStatus: 'closed',
  incidents: 0,
  ...overrides
})

const buildAlert = (overrides: Partial<Alert> = {}): Alert => ({
  id: 'A-101',
  timestamp: '21:00:00',
  message: 'Gate B malfunction',
  level: 'warning',
  isAcknowledged: false,
  ...overrides
})

describe('evaluateGateCongestion', () => {
  it('correctly fires a recommendation when conditions are met (occupancy > 85% and elapsed >= 75)', () => {
    const matches = [buildMatch({ timeElapsed: 80 })]
    const zones = [buildZone({ occupancy: 4300, maxCapacity: 5000 })] // 86% occupancy
    const sections: StandSection[] = []

    const recs = evaluateGateCongestion(matches, zones, sections)
    expect(recs).toHaveLength(1)
    expect(recs[0].priority).toBe('high')
    expect(recs[0].suggestedAction).toContain('Open overflow routing')
  })

  it('stays silent when conditions are not met (low occupancy or early match)', () => {
    // Case A: Occupancy is high but match is early (e.g., 30 mins)
    const earlyMatches = [buildMatch({ timeElapsed: 30 })]
    const congestedZones = [buildZone({ occupancy: 4600, maxCapacity: 5000 })] // 92%
    expect(evaluateGateCongestion(earlyMatches, congestedZones, [])).toHaveLength(0)

    // Case B: Match is late but occupancy is nominal (e.g., 60%)
    const lateMatches = [buildMatch({ timeElapsed: 85 })]
    const nominalZones = [buildZone({ occupancy: 3000, maxCapacity: 5000 })] // 60%
    expect(evaluateGateCongestion(lateMatches, nominalZones, [])).toHaveLength(0)
  })

  it('fires exactly at the occupancy and time boundary thresholds', () => {
    // Zone occupancy threshold boundary: exactly 85%
    const boundaryMatches = [buildMatch({ timeElapsed: 75 })] // exactly 75
    const boundaryZones = [buildZone({ occupancy: 4250, maxCapacity: 5000 })] // exactly 85%

    const recsZone = evaluateGateCongestion(boundaryMatches, boundaryZones, [])
    expect(recsZone).toHaveLength(1)

    // Section occupancy boundary: exactly 80% with gateStatus closed
    const boundarySections = [buildSection({ occupancy: 4000, maxCapacity: 5000, gateStatus: 'closed' })] // exactly 80%
    const recsSection = evaluateGateCongestion(boundaryMatches, [], boundarySections)
    expect(recsSection).toHaveLength(1)
    expect(recsSection[0].title).toContain('Unlock Stand Gates')
  })
})

describe('evaluateMatchDelayRisk', () => {
  const delayedMatch = {
    id: 'QF-1',
    roundId: 1,
    teamHome: 'A',
    teamAway: 'B',
    status: 'delayed' as const,
    statusLabel: 'DELAYED',
    venue: 'MAIN ARENA',
    time: '18:00',
    date: 'JULY 10'
  }

  const scheduledMatch = {
    id: 'SF-1',
    roundId: 2,
    teamHome: 'C',
    teamAway: 'D',
    status: 'scheduled' as const,
    statusLabel: 'SCHEDULED',
    venue: 'MAIN ARENA',
    time: '20:30',
    date: 'JULY 10'
  }

  it('correctly fires a recommendation when a delayed match shares a venue with scheduled matches', () => {
    const rounds = [
      { id: 1, name: 'Round 1', matches: [delayedMatch] },
      { id: 2, name: 'Round 2', matches: [scheduledMatch] }
    ]

    const recs = evaluateMatchDelayRisk(rounds)
    expect(recs).toHaveLength(1)
    expect(recs[0].title).toBe('Schedule Delay Risk: MAIN ARENA')
    expect(recs[0].suggestedAction).toContain('kickoff')
  })

  it('stays silent when no delayed matches exist or no upcoming scheduled matches share the venue', () => {
    // Case A: No delayed matches at the venue (only scheduled)
    const roundsNoDelay = [
      { id: 1, name: 'Round 1', matches: [{ ...delayedMatch, status: 'scheduled' as const }] },
      { id: 2, name: 'Round 2', matches: [scheduledMatch] }
    ]
    expect(evaluateMatchDelayRisk(roundsNoDelay)).toHaveLength(0)

    // Case B: Delayed match exists, but no scheduled matches share the venue
    const roundsNoScheduledShare = [
      { id: 1, name: 'Round 1', matches: [delayedMatch] },
      { id: 2, name: 'Round 2', matches: [{ ...scheduledMatch, venue: 'WEST ARENA' }] }
    ]
    expect(evaluateMatchDelayRisk(roundsNoScheduledShare)).toHaveLength(0)
  })

  it('fires at the boundary of exactly one delayed and one scheduled match at the same venue', () => {
    const rounds = [
      { id: 1, name: 'R1', matches: [delayedMatch] },
      { id: 2, name: 'R2', matches: [scheduledMatch] }
    ]
    const recs = evaluateMatchDelayRisk(rounds)
    expect(recs).toHaveLength(1)
    expect(recs[0].relatedEntityId).toBe('QF-1')
  })
})

describe('evaluateIncidentEscalation', () => {
  it('correctly fires a recommendation when unresolved alerts in a zone exceed or meet the count threshold (>= 2)', () => {
    const alerts = [
      buildAlert({ message: 'Gate B barcode issue', isAcknowledged: false }),
      buildAlert({ message: 'Gate B flow sensor failure', isAcknowledged: false })
    ]

    const recs = evaluateIncidentEscalation(alerts)
    expect(recs).toHaveLength(1)
    expect(recs[0].title).toBe('Incident Dispatch: SECTOR GATE B (WEST)')
    expect(recs[0].priority).toBe('high') // warning levels
  })

  it('stays silent when alerts are acknowledged or do not meet the count threshold', () => {
    // Case A: 2 alerts in same zone, but 1 is acknowledged
    const alertsA = [
      buildAlert({ message: 'Gate B issue 1', isAcknowledged: false }),
      buildAlert({ message: 'Gate B issue 2', isAcknowledged: true })
    ]
    expect(evaluateIncidentEscalation(alertsA)).toHaveLength(0)

    // Case B: 2 unacknowledged alerts but in different zones
    const alertsB = [
      buildAlert({ message: 'Gate A issue', isAcknowledged: false }), // East Gate
      buildAlert({ message: 'Gate B issue', isAcknowledged: false })  // West Gate
    ]
    expect(evaluateIncidentEscalation(alertsB)).toHaveLength(0)
  })

  it('fires at the boundary threshold of exactly two unacknowledged alerts in the same zone', () => {
    const boundaryAlerts = [
      buildAlert({ message: 'Gate A turnstile stuck', isAcknowledged: false }),
      buildAlert({ message: 'Gate A scanner offline', isAcknowledged: false })
    ]
    const recs = evaluateIncidentEscalation(boundaryAlerts)
    expect(recs).toHaveLength(1)
    expect(recs[0].relatedEntityId).toBe('SECTOR GATE A (EAST)')
  })
})

describe('evaluateTournamentBottleneck', () => {
  const delayedQF = {
    id: 'QF-4',
    roundId: 1,
    teamHome: 'BARCELONA',
    teamAway: 'JUVENTUS',
    status: 'delayed' as const,
    statusLabel: 'DELAYED',
    venue: 'MAIN ARENA',
    time: '18:00',
    date: 'JULY 10'
  }

  const blockedSF = {
    id: 'SF-2',
    roundId: 2,
    teamHome: 'INTER MILAN',
    teamAway: 'TBD (BAR / JUV)',
    status: 'scheduled' as const,
    statusLabel: 'SCHEDULED',
    venue: 'WEST ARENA',
    time: '21:00',
    date: 'JULY 11'
  }

  it('correctly fires a recommendation when a delayed match blocks team progression in subsequent rounds', () => {
    const rounds = [
      { id: 1, name: 'QUARTERFINALS', matches: [delayedQF] },
      { id: 2, name: 'SEMIFINALS', matches: [blockedSF] }
    ]

    const recs = evaluateTournamentBottleneck(rounds)
    expect(recs).toHaveLength(1)
    expect(recs[0].title).toBe('Bracket Bottleneck: QUARTERFINALS')
    expect(recs[0].suggestedAction).toContain('override')
  })

  it('stays silent when there are no delayed matches or no progression dependencies in subsequent rounds', () => {
    // Case A: No delayed matches in the earlier round (all completed)
    const roundsNoDelay = [
      { id: 1, name: 'QUARTERFINALS', matches: [{ ...delayedQF, status: 'completed' as const }] },
      { id: 2, name: 'SEMIFINALS', matches: [blockedSF] }
    ]
    expect(evaluateTournamentBottleneck(roundsNoDelay)).toHaveLength(0)

    // Case B: Delayed match exists, but subsequent rounds contain concrete teams (no TBD placeholders)
    const roundsNoTbd = [
      { id: 1, name: 'QUARTERFINALS', matches: [delayedQF] },
      { id: 2, name: 'SEMIFINALS', matches: [{ ...blockedSF, teamAway: 'REAL MADRID' }] }
    ]
    expect(evaluateTournamentBottleneck(roundsNoTbd)).toHaveLength(0)
  })

  it('fires at the boundary threshold of exactly one delayed match blocking one dependent subsequent match', () => {
    const rounds = [
      { id: 1, name: 'QF', matches: [delayedQF] },
      { id: 2, name: 'SF', matches: [blockedSF] }
    ]
    const recs = evaluateTournamentBottleneck(rounds)
    expect(recs).toHaveLength(1)
    expect(recs[0].relatedEntityId).toBe('QF-4')
  })
})

describe('generateRecommendations', () => {
  it('correctly compiles and ranks multiple recommendations by priority (critical > high > medium > low)', () => {
    const state: OperationsState = {
      // 1. Fires Medium Bottleneck
      matches: [buildMatch({ timeElapsed: 10 })],
      zones: [buildZone({ occupancy: 2000, maxCapacity: 5000 })], // nominal 40%
      alerts: [
        buildAlert({ id: 'A-1', message: 'Gate B issue', level: 'warning', isAcknowledged: false }),
        buildAlert({ id: 'A-2', message: 'CRITICAL: Gate B fire alarm', level: 'critical', isAcknowledged: false })
      ], // 2. Fires Critical Incident
      tournament: { name: 'CL', stage: 'QF', completedMatches: 1, totalMatches: 2 },
      rounds: [
        { id: 1, name: 'QUARTERFINALS', matches: [{ id: 'QF-4', roundId: 1, teamHome: 'BAR', teamAway: 'JUV', status: 'delayed', statusLabel: 'DELAYED', venue: 'MAIN ARENA', time: '18:00', date: 'JULY 10' }] },
        { id: 2, name: 'SEMIFINALS', matches: [{ id: 'SF-2', roundId: 2, teamHome: 'INT', teamAway: 'TBD (BAR / JUV)', status: 'scheduled', statusLabel: 'SCHEDULED', venue: 'MAIN ARENA', time: '21:00', date: 'JULY 11' }] }
      ],
      sections: [
        buildSection({ id: 'sect-west', name: 'WEST STAND', occupancy: 4800, maxCapacity: 5000, gateStatus: 'closed' })
      ] // 3. Fires High Section Gate Congestion (96% occupancy)
    }

    // Activate congestion trigger by adding a match ending soon
    state.matches = [buildMatch({ timeElapsed: 85, isLive: true, status: 'live' })]

    const recs = generateRecommendations(state)
    expect(recs.length).toBeGreaterThanOrEqual(3)

    // Validate priority ranking order
    expect(recs[0].priority).toBe('critical')
    expect(recs[1].priority).toBe('high')
    expect(recs[2].priority).toBe('medium')
  })
})

describe('explainWithAI', () => {
  it('falls back to local template explanation if no API key is provided', async () => {
    const reasoning = ['Gate A occupancy is at 90%', 'Match ends in 10 min']
    const result = await explainWithAI(reasoning)
    expect(result).toBe('Gate A occupancy is at 90% and Match ends in 10 min.')
  })

  it('calls Gemini API and returns synthesized text if API key is provided', async () => {
    const reasoning = ['Alert 1', 'Alert 2']
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: 'AI explanation text' }]
          }
        }
      ]
    }

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    })
    vi.stubGlobal('fetch', fetchSpy)

    const result = await explainWithAI(reasoning, 'TEST_API_KEY')
    expect(result).toBe('AI explanation text')
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('generativelanguage.googleapis.com'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-goog-api-key': 'TEST_API_KEY'
        })
      })
    )

    vi.unstubAllGlobals()
  })

  it('falls back to template description if fetch fails', async () => {
    const reasoning = ['Alert 1']
    const fetchSpy = vi.fn().mockRejectedValue(new Error('Network Error'))
    vi.stubGlobal('fetch', fetchSpy)

    const result = await explainWithAI(reasoning, 'TEST_API_KEY')
    expect(result).toContain('Local briefing')
    
    vi.unstubAllGlobals()
  })
})

describe('chatWithAI', () => {
  const dummyState: OperationsState = {
    matches: [],
    zones: [],
    alerts: [],
    tournament: { name: 'Cup', stage: 'Finals', completedMatches: 2, totalMatches: 4 },
    rounds: [],
    sections: []
  }

  it('throws an error if API key is missing', async () => {
    await expect(chatWithAI('Hello', [], dummyState, '')).rejects.toThrow('API key is required for AI chat')
  })

  it('correctly constructs payload and resolves response text on success', async () => {
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: 'Stadium operations are fully nominal. No action required.' }]
          }
        }
      ]
    }

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    })
    vi.stubGlobal('fetch', fetchSpy)

    const response = await chatWithAI('Status report please', [], dummyState, 'TEST_KEY')
    expect(response).toBe('Stadium operations are fully nominal. No action required.')
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('generativelanguage.googleapis.com'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-goog-api-key': 'TEST_KEY'
        }),
        body: expect.stringContaining('Status report please')
      })
    )

    vi.unstubAllGlobals()
  })

  it('throws when the API request fails', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Error'
    })
    vi.stubGlobal('fetch', fetchSpy)

    await expect(chatWithAI('Hello', [], dummyState, 'TEST_KEY')).rejects.toThrow('API error: 500 - Internal Error')

    vi.unstubAllGlobals()
  })
})

