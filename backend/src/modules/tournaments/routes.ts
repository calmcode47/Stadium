import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDatabase } from '../../db/client'
import { mapRounds, mapTournamentSummary } from '../../db/mappers'
import { matches, rounds, tournaments, venues } from '../../db/schema'
import { notFound } from '../../lib/httpErrors'
import { paginationSchema, validate } from '../../lib/validation'

const router = Router()
const paramsSchema = z.object({ id: z.string().min(1) })

router.get('/', validate('query', paginationSchema), (req, res) => {
  const query = req.query as unknown as z.infer<typeof paginationSchema>
  const tournamentRows = getDatabase().db.select().from(tournaments).all().slice(query.offset, query.offset + query.limit)
  const matchRows = getDatabase().db.select().from(matches).all()
  res.json({ data: tournamentRows.map(row => mapTournamentSummary(row, matchRows.filter(match => match.tournamentId === row.id && match.roundId !== null))) })
})

router.get('/:id', validate('params', paramsSchema), (req, res, next) => {
  try {
    const { id } = req.params as unknown as z.infer<typeof paramsSchema>
    const tournament = getDatabase().db.select().from(tournaments).where(eq(tournaments.id, id)).get()
    if (!tournament) throw notFound('Tournament not found')
    const matchRows = getDatabase().db.select().from(matches).where(eq(matches.tournamentId, tournament.id)).all()
    res.json({ data: mapTournamentSummary(tournament, matchRows.filter(match => match.roundId !== null)) })
  } catch (error) {
    next(error)
  }
})

router.get('/:id/bracket', validate('params', paramsSchema), (req, res, next) => {
  try {
    const { id } = req.params as unknown as z.infer<typeof paramsSchema>
    const tournament = getDatabase().db.select().from(tournaments).where(eq(tournaments.id, id)).get()
    if (!tournament) throw notFound('Tournament not found')
    const roundRows = getDatabase().db.select().from(rounds).where(eq(rounds.tournamentId, tournament.id)).all()
    const matchRows = getDatabase().db.select().from(matches).where(eq(matches.tournamentId, tournament.id)).all().filter(match => match.roundId !== null)
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
    const roundRows = getDatabase().db.select().from(rounds).where(eq(rounds.tournamentId, tournament.id)).all()
    const matchRows = getDatabase().db.select().from(matches).where(eq(matches.tournamentId, tournament.id)).all().filter(match => match.roundId !== null)
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
