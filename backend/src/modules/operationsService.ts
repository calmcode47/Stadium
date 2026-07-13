import { and, asc, eq, isNotNull } from 'drizzle-orm'
import { getDatabase } from '../db/client'
import { alerts, matches, rounds, tournaments, venues } from '../db/schema'
import { mapAlert, mapMatch, mapRounds, mapStandSection, mapTournamentSummary, mapVenueZone } from '../db/mappers'
import type { OperationsState } from '../types/operations'
import { notFound } from '../lib/httpErrors'

/** Loads the current operations snapshot used by the assistant decision engine. */
export const getOperationsState = (tournamentId = 'T-CHAMPIONS-2026'): OperationsState => {
  const { db } = getDatabase()
  const tournament = db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).get()
  if (!tournament) throw notFound('Tournament not found')

  const matchRows = db.select().from(matches).where(eq(matches.tournamentId, tournamentId)).all()
  const venueRows = db.select().from(venues).all()
  const alertRows = db.select().from(alerts).all()
  const roundRows = db.select().from(rounds).where(eq(rounds.tournamentId, tournamentId)).orderBy(asc(rounds.orderIndex)).all()
  const tournamentMatchRows = db.select().from(matches).where(and(eq(matches.tournamentId, tournamentId), isNotNull(matches.roundId))).orderBy(asc(matches.scheduledStart)).all()

  return {
    matches: matchRows.map(mapMatch),
    zones: venueRows.filter(venue => venue.kind === 'zone').map(mapVenueZone),
    alerts: alertRows.map(mapAlert),
    tournament: mapTournamentSummary(tournament, tournamentMatchRows),
    rounds: mapRounds(roundRows, tournamentMatchRows, venueRows),
    sections: venueRows.filter(venue => venue.kind === 'section').map(mapStandSection)
  }
}
