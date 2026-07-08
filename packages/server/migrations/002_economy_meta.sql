-- Migration 002: Economy and Meta-Progression (PostgreSQL / SQLite compliant)
-- Maps directly to the schema.prisma structure.

-- ── Player Extensions & Core Stats (If not already present) ─────────────────
CREATE TABLE IF NOT EXISTS players_new (
  id            TEXT PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  level         INTEGER DEFAULT 1,
  xp            INTEGER DEFAULT 0,
  mmr           INTEGER DEFAULT 1000,
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ── Inventory of Materials & Currencies ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventories (
  id           TEXT PRIMARY KEY,
  player_id    TEXT NOT NULL REFERENCES players_new(id) ON DELETE CASCADE,
  material_key TEXT NOT NULL, -- e.g. "CrystalShard", "ToxicSpore", "Essence"
  amount       INTEGER DEFAULT 0 CHECK(amount >= 0),
  updated_at   TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player_id, material_key)
);

-- ── Custom Cards & Cosmetics Unlocked ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_cards (
  id                 TEXT PRIMARY KEY,
  player_id          TEXT NOT NULL REFERENCES players_new(id) ON DELETE CASCADE,
  card_definition_id TEXT NOT NULL,
  custom_voltage     REAL DEFAULT NULL,
  custom_resistance  REAL DEFAULT NULL,
  is_shiny           INTEGER DEFAULT 0, -- 0 = false, 1 = true
  unlocked_at        TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ── Daily Quests status tracker ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_quests (
  id           TEXT PRIMARY KEY,
  player_id    TEXT NOT NULL REFERENCES players_new(id) ON DELETE CASCADE,
  quest_key    TEXT NOT NULL,
  progress     INTEGER DEFAULT 0,
  target_value INTEGER NOT NULL,
  completed    INTEGER DEFAULT 0, -- 0 = false, 1 = true
  xp_reward    INTEGER NOT NULL,
  rolled_at    TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player_id, quest_key)
);

-- ── Indexes for high performance queries ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_inventories_player ON inventories(player_id);
CREATE INDEX IF NOT EXISTS idx_player_cards_player ON player_cards(player_id);
CREATE INDEX IF NOT EXISTS idx_player_quests_player ON player_quests(player_id);
