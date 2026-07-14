import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { clearRecommendationCache } from '../lib/recommendationCache'
import * as schema from './schema'

export type Db = BetterSQLite3Database<typeof schema>

interface DatabaseHandle {
  sqlite: Database.Database
  db: Db
}

let handle: DatabaseHandle | null = null

export const createDatabase = (databaseFile?: string): DatabaseHandle => {
  const file = databaseFile ?? path.resolve(process.cwd(), process.env.DATABASE_FILE ?? './data/stadium.db')
  if (file !== ':memory:') {
    fs.mkdirSync(path.dirname(file), { recursive: true })
  }

  const sqlite = new Database(file)
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite, { schema })
  ensureSchema(sqlite)
  return { sqlite, db }
}

export const getDatabase = (): DatabaseHandle => {
  if (!handle) {
    handle = createDatabase()
  }
  return handle
}

export const setDatabaseForTests = (databaseFile = ':memory:'): DatabaseHandle => {
  closeDatabase()
  handle = createDatabase(databaseFile)
  return handle
}

export const closeDatabase = (): void => {
  if (handle) {
    handle.sqlite.close()
    handle = null
  }
  clearRecommendationCache()
}

export const ensureSchema = (sqlite: Database.Database): void => {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS venues (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      zone_code TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      current_occupancy INTEGER NOT NULL,
      gate_locked INTEGER NOT NULL,
      incidents INTEGER NOT NULL DEFAULT 0,
      kind TEXT NOT NULL DEFAULT 'zone' CHECK (kind IN ('zone', 'section')),
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      current_round TEXT NOT NULL,
      total_rounds INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rounds (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      round_id TEXT REFERENCES rounds(id) ON DELETE SET NULL,
      venue_id TEXT NOT NULL REFERENCES venues(id),
      team_home_name TEXT NOT NULL,
      team_away_name TEXT NOT NULL,
      team_home_score INTEGER NOT NULL DEFAULT 0,
      team_away_score INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK (status IN ('scheduled', 'live', 'delayed', 'completed', 'cancelled')),
      clock_seconds INTEGER NOT NULL DEFAULT 0,
      period TEXT NOT NULL DEFAULT 'PRE',
      scheduled_start TEXT NOT NULL,
      status_label TEXT NOT NULL,
      next_match_id TEXT,
      winner TEXT CHECK (winner IN ('home', 'away')),
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS match_events (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('goal', 'card', 'substitution', 'timeout')),
      team TEXT,
      minute INTEGER NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      venue_id TEXT REFERENCES venues(id),
      severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
      message TEXT NOT NULL,
      acknowledged INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      acknowledged_at TEXT
    );

    CREATE TABLE IF NOT EXISTS operators (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'viewer')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS decision_log_entries (
      id TEXT PRIMARY KEY,
      recommendation_id TEXT NOT NULL,
      operator_id TEXT NOT NULL REFERENCES operators(id),
      action TEXT NOT NULL CHECK (action IN ('accepted', 'dismissed')),
      recommendation_title TEXT NOT NULL,
      suggested_action TEXT NOT NULL,
      reasoning_snapshot TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
    CREATE INDEX IF NOT EXISTS idx_matches_venue ON matches(venue_id);
    CREATE INDEX IF NOT EXISTS idx_matches_tournament_round_start ON matches(tournament_id, round_id, scheduled_start);
    CREATE INDEX IF NOT EXISTS idx_matches_tournament_start ON matches(tournament_id, scheduled_start);
    CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(round_id);
    CREATE INDEX IF NOT EXISTS idx_rounds_tournament_order ON rounds(tournament_id, order_index);
    CREATE INDEX IF NOT EXISTS idx_match_events_match_created ON match_events(match_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_venues_kind ON venues(kind);
    CREATE INDEX IF NOT EXISTS idx_alerts_filters ON alerts(acknowledged, severity, venue_id);
    CREATE INDEX IF NOT EXISTS idx_decision_log_operator ON decision_log_entries(operator_id);
    CREATE INDEX IF NOT EXISTS idx_decision_log_created ON decision_log_entries(created_at DESC);
  `)
}
