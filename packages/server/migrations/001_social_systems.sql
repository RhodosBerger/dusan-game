-- Migration 001: Social Systems — Guilds, Friendships
-- Apply with: sqlite3 database.db < migrations/001_social_systems.sql

-- ── Guilds ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guilds (
  id          TEXT    PRIMARY KEY,
  name        TEXT    UNIQUE NOT NULL,
  tag         TEXT    UNIQUE NOT NULL CHECK(length(tag) BETWEEN 2 AND 5),
  description TEXT    DEFAULT '',
  created_at  TEXT    DEFAULT CURRENT_TIMESTAMP,
  leader_id   TEXT    REFERENCES players(id) ON DELETE SET NULL,
  emblem_url  TEXT    DEFAULT '',
  elo_rating  INTEGER DEFAULT 1000,
  max_members INTEGER DEFAULT 30 CHECK(max_members BETWEEN 5 AND 100),
  is_open     INTEGER DEFAULT 1   -- 1 = anyone can join, 0 = invite-only
);

-- ── Guild Members ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guild_members (
  guild_id   TEXT NOT NULL REFERENCES guilds(id)   ON DELETE CASCADE,
  player_id  TEXT NOT NULL REFERENCES players(id)  ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'MEMBER'
             CHECK(role IN ('LEADER','OFFICER','MEMBER')),
  joined_at  TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (guild_id, player_id)
);

-- ── Friendships ───────────────────────────────────────────────────────────────
-- Bidirectional: one row per pair, query: WHERE requester_id=? OR addressee_id=?
CREATE TABLE IF NOT EXISTS friendships (
  id           TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  addressee_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'PENDING'
               CHECK(status IN ('PENDING','ACCEPTED','BLOCKED')),
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at   TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(requester_id, addressee_id)
);

-- ── Player Extensions (titles, season) ───────────────────────────────────────
ALTER TABLE players ADD COLUMN titles      TEXT NOT NULL DEFAULT '[]';
ALTER TABLE players ADD COLUMN season_xp   INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN mmr         INTEGER DEFAULT 1000;
ALTER TABLE players ADD COLUMN guild_id    TEXT REFERENCES guilds(id) ON DELETE SET NULL;

-- ── Indexes for fast friend lookups ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_player  ON guild_members(player_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_guild   ON guild_members(guild_id);
