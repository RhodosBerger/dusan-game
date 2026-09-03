-- Migration 003: Player purchased items (weapons, tools, harvest items)

CREATE TABLE IF NOT EXISTS player_items (
  id          TEXT PRIMARY KEY,
  player_id   TEXT NOT NULL REFERENCES players_new(id) ON DELETE CASCADE,
  item_key    TEXT NOT NULL, -- e.g. "AETHER_SABER", "GRAVITY_HARVESTER"
  category    TEXT NOT NULL, -- "WEAPON", "TOOL", "HARVEST"
  quantity    INTEGER DEFAULT 1,
  durability  INTEGER DEFAULT 100,
  unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_player_items_player ON player_items(player_id);
