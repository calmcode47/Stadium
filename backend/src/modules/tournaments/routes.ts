import { Router } from 'express'
import { and, asc, eq, inArray, isNotNull } from 'drizzle-orm'
import { z } from 'zod'
import { getDatabase } from '../../db/client'
import { mapRounds, mapTournamentSummary } from '../../db/mappers'
import { matches, rounds, tournaments, venues } from '../../db/schema'
import { notFound } from '../../lib/httpErrors'
import { getValidatedQuery, paginationSchema, validate } from '../../lib/validation'

const router = Router()
const paramsSchema = z.object({ id: z.string().min(1) })

router.get('/', validate('query', paginationSchema), (req, res) => {
  const query = getValidatedQuery<z.infer<typeof paginationSchema>>(req)
  const tournamentRows = getDatabase().db.select().from(tournaments).limit(query.limit).offset(query.offset).all()
  const tournamentIds = tournamentRows.map(row => row.id)
  const matchRows = tournamentIds.length > 0
    ? getDatabase().db
      .select()
      .from(matches)
      .where(and(inArray(matches.tournamentId, tournamentIds), isNotNull(matches.roundId)))
      .all()
    : []
  res.json({ data: tournamentRows.map(row => mapTournamentSummary(row, matchRows.filter(match => match.tournamentId === row.id && match.roundId !== null))) })
})

router.get('/:id', validate('params', paramsSchema), (req, res, next) => {
  try {
    const { id } = req.params as unknown as z.infer<typeof paramsSchema>
    const tournament = getDatabase().db.select().from(tournaments).where(eq(tournaments.id, id)).get()
    if (!tournament) throw notFound('Tournament not found')
    const matchRows = getDatabase().db.select().from(matches).where(and(eq(matches.tournamentId, tournament.id), isNotNull(matches.roundId))).all()
    res.json({ data: mapTournamentSummary(tournament, matchRows) })
  } catch (error) {
    next(error)
  }
})

router.get('/:id/bracket', validate('params', paramsSchema), (req, res, next) => {
  try {
    const { id } = req.params as unknown as z.infer<typeof paramsSchema>
    const tournament = getDatabase().db.select().from(tournaments).where(eq(tournaments.id, id)).get()
    if (!tournament) throw notFound('Tournament not found')
    const roundRows = getDatabase().db.select().from(rounds).where(eq(rounds.tournamentId, tournament.id)).orderBy(asc(rounds.orderIndex)).all()
    const matchRows = getDatabase().db
      .select()
      .from(matches)
      .where(and(eq(matches.tournamentId, tournament.id), isNotNull(matches.roundId)))
      .orderBy(asc(matches.scheduledStart))
      .all()
    const venueRows = getDatabase().db.select().from(venues).all()
    res.json({ data: mapRounds(roundRows, matchRows, venueRows) })
  } catch (error) {
    next(error)
  }
})

router.get('/:id/schedule', validate('params', paramsSchema), (req, res, next) => {
  try {
    const { id } = req.params as unknown as z.infer<typeof paramsSchema>
    const tournament = getDatabase().db.select().from(tournaments).where(eq(tournaments.id, id)).get()
    if (!tournament) throw notFound('Tournament not found')
    const roundRows = getDatabase().db.select().from(rounds).where(eq(rounds.tournamentId, tournament.id)).orderBy(asc(rounds.orderIndex)).all()
    const matchRows = getDatabase().db
      .select()
      .from(matches)
      .where(and(eq(matches.tournamentId, tournament.id), isNotNull(matches.roundId)))
      .orderBy(asc(matches.scheduledStart))
      .all()
    const venueRows = getDatabase().db.select().from(venues).all()
    const schedule = mapRounds(roundRows, matchRows, venueRows)
      .flatMap(round => round.matches)
      .sort((left, right) => `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`))
    res.json({ data: schedule })
  } catch (error) {
    next(error)
  }
})

export default router
