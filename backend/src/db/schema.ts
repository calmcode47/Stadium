import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const venues = sqliteTable('venues', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  zoneCode: text('zone_code').notNull(),
  capacity: integer('capacity').notNull(),
  currentOccupancy: integer('current_occupancy').notNull(),
  gateLocked: integer('gate_locked', { mode: 'boolean' }).notNull(),
  incidents: integer('incidents').notNull().default(0),
  kind: text('kind', { enum: ['zone', 'section'] }).notNull().default('zone'),
  updatedAt: text('updated_at').notNull()
})

export const tournaments = sqliteTable('tournaments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  status: text('status').notNull(),
  currentRound: text('current_round').notNull(),
  totalRounds: integer('total_rounds').notNull()
})

export const rounds = sqliteTable('rounds', {
  id: text('id').primaryKey(),
  tournamentId: text('tournament_id').notNull().references(() => tournaments.id),
  name: text('name').notNull(),
  orderIndex: integer('order_index').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull()
})

export const matches = sqliteTable('matches', {
  id: text('id').primaryKey(),
  tournamentId: text('tournament_id').notNull().references(() => tournaments.id),
  roundId: text('round_id').references(() => rounds.id),
  venueId: text('venue_id').notNull().references(() => venues.id),
  teamHomeName: text('team_home_name').notNull(),
  teamAwayName: text('team_away_name').notNull(),
  teamHomeScore: integer('team_home_score').notNull().default(0),
  teamAwayScore: integer('team_away_score').notNull().default(0),
  status: text('status', { enum: ['scheduled', 'live', 'delayed', 'completed', 'cancelled'] }).notNull(),
  clockSeconds: integer('clock_seconds').notNull().default(0),
  period: text('period').notNull().default('PRE'),
  scheduledStart: text('scheduled_start').notNull(),
  statusLabel: text('status_label').notNull(),
  nextMatchId: text('next_match_id'),
  winner: text('winner', { enum: ['home', 'away'] }),
  updatedAt: text('updated_at').notNull()
})

export const matchEvents = sqliteTable('match_events', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull().references(() => matches.id),
  type: text('type', { enum: ['goal', 'card', 'substitution', 'timeout'] }).notNull(),
  team: text('team'),
  minute: integer('minute').notNull(),
  description: text('description').notNull(),
  createdAt: text('created_at').notNull()
})

export const alerts = sqliteTable('alerts', {
  id: text('id').primaryKey(),
  venueId: text('venue_id').references(() => venues.id),
  severity: text('severity', { enum: ['info', 'warning', 'critical'] }).notNull(),
  message: text('message').notNull(),
  acknowledged: integer('acknowledged', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  acknowledgedAt: text('acknowledged_at')
})

export const operators = sqliteTable('operators', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'operator', 'viewer'] }).notNull(),
  createdAt: text('created_at').notNull()
})

export const decisionLogEntries = sqliteTable('decision_log_entries', {
  id: text('id').primaryKey(),
  recommendationId: text('recommendation_id').notNull(),
  operatorId: text('operator_id').notNull().references(() => operators.id),
  action: text('action', { enum: ['accepted', 'dismissed'] }).notNull(),
  recommendationTitle: text('recommendation_title').notNull(),
  suggestedAction: text('suggested_action').notNull(),
  reasoningSnapshot: text('reasoning_snapshot').notNull(),
  createdAt: text('created_at').notNull()
})
