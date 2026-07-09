import bcrypt from 'bcryptjs'
import { getDatabase } from './client'
import { alerts, decisionLogEntries, matchEvents, matches, operators, rounds, tournaments, venues } from './schema'

const now = new Date('2026-07-09T16:00:00.000Z')
const iso = (offsetMinutes: number): string => new Date(now.getTime() + offsetMinutes * 60_000).toISOString()

export const seedDatabase = async (): Promise<void> => {
  const { db, sqlite } = getDatabase()

  sqlite.exec('PRAGMA foreign_keys = OFF;')
  db.delete(decisionLogEntries).run()
  db.delete(matchEvents).run()
  db.delete(alerts).run()
  db.delete(matches).run()
  db.delete(rounds).run()
  db.delete(tournaments).run()
  db.delete(venues).run()
  db.delete(operators).run()
  sqlite.exec('PRAGMA foreign_keys = ON;')

  db.insert(venues)
    .values([
      { id: 'zone-east', name: 'SECTOR GATE A (EAST)', zoneCode: 'EAST', capacity: 5000, currentOccupancy: 4200, gateLocked: false, incidents: 0, kind: 'zone', updatedAt: iso(0) },
      { id: 'zone-west', name: 'SECTOR GATE B (WEST)', zoneCode: 'WEST', capacity: 5000, currentOccupancy: 4850, gateLocked: true, incidents: 2, kind: 'zone', updatedAt: iso(0) },
      { id: 'zone-concourse', name: 'MAIN CONCOURSE', zoneCode: 'CONCOURSE', capacity: 15000, currentOccupancy: 11400, gateLocked: false, incidents: 1, kind: 'zone', updatedAt: iso(0) },
      { id: 'zone-vip', name: 'VIP HOSPITALITY SUITES', zoneCode: 'VIP', capacity: 1000, currentOccupancy: 960, gateLocked: true, incidents: 2, kind: 'zone', updatedAt: iso(0) },
      { id: 'zone-north-car', name: 'NORTH CAR PARK', zoneCode: 'NORTH', capacity: 8000, currentOccupancy: 7800, gateLocked: false, incidents: 0, kind: 'zone', updatedAt: iso(0) },
      { id: 'sect-north', name: 'NORTH STAND (TICKET G1/G2)', zoneCode: 'NORTH', capacity: 22000, currentOccupancy: 18450, gateLocked: false, incidents: 0, kind: 'section', updatedAt: iso(0) },
      { id: 'sect-south', name: 'SOUTH STAND (TICKET G5/G6)', zoneCode: 'SOUTH', capacity: 22000, currentOccupancy: 21200, gateLocked: false, incidents: 1, kind: 'section', updatedAt: iso(0) },
      { id: 'sect-east', name: 'EAST STAND (TICKET G3/G4)', zoneCode: 'EAST', capacity: 26000, currentOccupancy: 24100, gateLocked: false, incidents: 0, kind: 'section', updatedAt: iso(0) },
      { id: 'sect-west', name: 'WEST STAND (VIP SECTORS)', zoneCode: 'WEST', capacity: 20000, currentOccupancy: 17500, gateLocked: true, incidents: 2, kind: 'section', updatedAt: iso(0) }
    ])
    .run()

  db.insert(tournaments)
    .values([{ id: 'T-CHAMPIONS-2026', name: 'CHAMPIONS LEAGUE BRACKET', status: 'active', currentRound: 'QUARTERFINALS', totalRounds: 3 }])
    .run()

  db.insert(rounds)
    .values([
      { id: 'R-QF', tournamentId: 'T-CHAMPIONS-2026', name: 'QUARTERFINALS', orderIndex: 1, startDate: '2026-07-08', endDate: '2026-07-09' },
      { id: 'R-SF', tournamentId: 'T-CHAMPIONS-2026', name: 'SEMIFINALS', orderIndex: 2, startDate: '2026-07-11', endDate: '2026-07-11' },
      { id: 'R-F', tournamentId: 'T-CHAMPIONS-2026', name: 'FINALS', orderIndex: 3, startDate: '2026-07-14', endDate: '2026-07-14' }
    ])
    .run()

  db.insert(matches)
    .values([
      { id: 'M-101', tournamentId: 'T-CHAMPIONS-2026', roundId: null, venueId: 'zone-west', teamHomeName: 'REAL MADRID', teamAwayName: 'MANCHESTER CITY', teamHomeScore: 2, teamAwayScore: 1, status: 'live', clockSeconds: 76 * 60, period: '2H', scheduledStart: '2026-07-09T14:30:00.000Z', statusLabel: 'LIVE - 2ND HALF', nextMatchId: 'SF-1', winner: null, updatedAt: iso(0) },
      { id: 'M-102', tournamentId: 'T-CHAMPIONS-2026', roundId: null, venueId: 'zone-east', teamHomeName: 'BAYERN MUNICH', teamAwayName: 'PARIS SAINT-GERMAIN', teamHomeScore: 0, teamAwayScore: 0, status: 'scheduled', clockSeconds: 0, period: 'PRE', scheduledStart: '2026-07-09T16:30:00.000Z', statusLabel: 'SCHEDULED - 22:00', nextMatchId: null, winner: null, updatedAt: iso(0) },
      { id: 'M-103', tournamentId: 'T-CHAMPIONS-2026', roundId: null, venueId: 'zone-west', teamHomeName: 'AC MILAN', teamAwayName: 'INTER MILAN', teamHomeScore: 1, teamAwayScore: 3, status: 'completed', clockSeconds: 90 * 60, period: 'FT', scheduledStart: '2026-07-09T12:30:00.000Z', statusLabel: 'FINAL', nextMatchId: 'SF-2', winner: 'away', updatedAt: iso(0) },
      { id: 'M-104', tournamentId: 'T-CHAMPIONS-2026', roundId: null, venueId: 'zone-west', teamHomeName: 'BARCELONA', teamAwayName: 'JUVENTUS', teamHomeScore: 0, teamAwayScore: 0, status: 'delayed', clockSeconds: 0, period: 'PRE', scheduledStart: '2026-07-09T15:00:00.000Z', statusLabel: 'DELAYED - 15 MIN', nextMatchId: 'SF-2', winner: null, updatedAt: iso(0) },
      { id: 'M-105', tournamentId: 'T-CHAMPIONS-2026', roundId: null, venueId: 'zone-concourse', teamHomeName: 'LIVERPOOL', teamAwayName: 'ARSENAL', teamHomeScore: 0, teamAwayScore: 0, status: 'cancelled', clockSeconds: 0, period: 'PRE', scheduledStart: '2026-07-09T18:00:00.000Z', statusLabel: 'CANCELLED', nextMatchId: null, winner: null, updatedAt: iso(0) },
      { id: 'QF-1', tournamentId: 'T-CHAMPIONS-2026', roundId: 'R-QF', venueId: 'zone-concourse', teamHomeName: 'REAL MADRID', teamAwayName: 'MANCHESTER CITY', teamHomeScore: 2, teamAwayScore: 1, status: 'completed', clockSeconds: 90 * 60, period: 'FT', scheduledStart: '2026-07-08T12:30:00.000Z', statusLabel: 'FINAL', nextMatchId: 'SF-1', winner: 'home', updatedAt: iso(0) },
      { id: 'QF-2', tournamentId: 'T-CHAMPIONS-2026', roundId: 'R-QF', venueId: 'zone-east', teamHomeName: 'BAYERN MUNICH', teamAwayName: 'PARIS SAINT-GERMAIN', teamHomeScore: 3, teamAwayScore: 2, status: 'completed', clockSeconds: 90 * 60, period: 'FT', scheduledStart: '2026-07-08T15:00:00.000Z', statusLabel: 'FINAL', nextMatchId: 'SF-1', winner: 'home', updatedAt: iso(0) },
      { id: 'QF-3', tournamentId: 'T-CHAMPIONS-2026', roundId: 'R-QF', venueId: 'zone-west', teamHomeName: 'AC MILAN', teamAwayName: 'INTER MILAN', teamHomeScore: 1, teamAwayScore: 3, status: 'completed', clockSeconds: 90 * 60, period: 'FT', scheduledStart: '2026-07-09T12:30:00.000Z', statusLabel: 'FINAL', nextMatchId: 'SF-2', winner: 'away', updatedAt: iso(0) },
      { id: 'QF-4', tournamentId: 'T-CHAMPIONS-2026', roundId: 'R-QF', venueId: 'zone-concourse', teamHomeName: 'BARCELONA', teamAwayName: 'JUVENTUS', teamHomeScore: 0, teamAwayScore: 0, status: 'delayed', clockSeconds: 0, period: 'PRE', scheduledStart: '2026-07-09T15:00:00.000Z', statusLabel: 'DELAYED', nextMatchId: 'SF-2', winner: null, updatedAt: iso(0) },
      { id: 'SF-1', tournamentId: 'T-CHAMPIONS-2026', roundId: 'R-SF', venueId: 'zone-concourse', teamHomeName: 'REAL MADRID', teamAwayName: 'BAYERN MUNICH', teamHomeScore: 0, teamAwayScore: 0, status: 'scheduled', clockSeconds: 0, period: 'PRE', scheduledStart: '2026-07-11T13:30:00.000Z', statusLabel: 'JULY 11 - 19:00', nextMatchId: 'F-1', winner: null, updatedAt: iso(0) },
      { id: 'SF-2', tournamentId: 'T-CHAMPIONS-2026', roundId: 'R-SF', venueId: 'zone-west', teamHomeName: 'INTER MILAN', teamAwayName: 'TBD (BAR / JUV)', teamHomeScore: 0, teamAwayScore: 0, status: 'scheduled', clockSeconds: 0, period: 'PRE', scheduledStart: '2026-07-11T16:00:00.000Z', statusLabel: 'JULY 11 - 21:30', nextMatchId: 'F-1', winner: null, updatedAt: iso(0) },
      { id: 'F-1', tournamentId: 'T-CHAMPIONS-2026', roundId: 'R-F', venueId: 'zone-concourse', teamHomeName: 'TBD (SF1 WINNER)', teamAwayName: 'TBD (SF2 WINNER)', teamHomeScore: 0, teamAwayScore: 0, status: 'scheduled', clockSeconds: 0, period: 'PRE', scheduledStart: '2026-07-14T14:30:00.000Z', statusLabel: 'JULY 14 - 20:00', nextMatchId: null, winner: null, updatedAt: iso(0) }
    ])
    .run()

  db.insert(matchEvents)
    .values([
      { id: 'E-101', matchId: 'M-101', type: 'goal', team: 'REAL MADRID', minute: 71, description: 'REAL MADRID GOAL - Vinicius Jr. (Assist by Bellingham)', createdAt: iso(-10) },
      { id: 'E-102', matchId: 'M-101', type: 'card', team: 'MANCHESTER CITY', minute: 64, description: 'MANCHESTER CITY - Yellow Card: Ruben Dias (Tactical Foul)', createdAt: iso(-18) },
      { id: 'E-103', matchId: 'M-101', type: 'substitution', team: 'REAL MADRID', minute: 52, description: 'REAL MADRID - Sub: Rodrygo OUT, Brahim Diaz IN', createdAt: iso(-30) },
      { id: 'E-104', matchId: 'M-101', type: 'goal', team: 'MANCHESTER CITY', minute: 41, description: 'MANCHESTER CITY GOAL - Erling Haaland (Penalty)', createdAt: iso(-44) },
      { id: 'E-105', matchId: 'M-101', type: 'goal', team: 'REAL MADRID', minute: 18, description: 'REAL MADRID GOAL - Jude Bellingham (Header)', createdAt: iso(-67) }
    ])
    .run()

  db.insert(alerts)
    .values([
      { id: 'A-201', venueId: 'zone-west', severity: 'warning', message: 'Gate B access congestion detected - Flow capacity exceeds 96%', acknowledged: false, createdAt: iso(-4), acknowledgedAt: null },
      { id: 'A-202', venueId: 'zone-vip', severity: 'critical', message: 'CRITICAL: VIP Gate barcode scanner device connection failure', acknowledged: false, createdAt: iso(-8), acknowledgedAt: null },
      { id: 'A-203', venueId: 'zone-west', severity: 'warning', message: 'Gate B secondary turnstile queue backing into WEST concourse', acknowledged: false, createdAt: iso(-12), acknowledgedAt: null },
      { id: 'A-204', venueId: 'zone-concourse', severity: 'info', message: 'Pitch sprinkler automated cycle completed successfully', acknowledged: true, createdAt: iso(-20), acknowledgedAt: iso(-18) },
      { id: 'A-205', venueId: 'zone-vip', severity: 'warning', message: 'VIP Section capacity reached 96% - Stress warning', acknowledged: false, createdAt: iso(-6), acknowledgedAt: null },
      { id: 'A-206', venueId: 'zone-concourse', severity: 'info', message: 'Match M-104 delayed 15 minutes due to technical broadcast test', acknowledged: false, createdAt: iso(-14), acknowledgedAt: null }
    ])
    .run()

  const passwordHash = await bcrypt.hash('Stadium123!', 12)
  db.insert(operators)
    .values([
      { id: 'op-admin', name: 'Admin Operator', email: 'admin@stadium.local', passwordHash, role: 'admin', createdAt: iso(0) },
      { id: 'op-operator', name: 'Operations Alpha', email: 'operator@stadium.local', passwordHash, role: 'operator', createdAt: iso(0) },
      { id: 'op-viewer', name: 'Viewer Analyst', email: 'viewer@stadium.local', passwordHash, role: 'viewer', createdAt: iso(0) }
    ])
    .run()
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeded Smart Stadium demo database.')
    })
    .catch(error => {
      console.error(error)
      process.exitCode = 1
    })
}
