# Architektonická štúdia: Databázová Synchronizácia a Správa Herného Obsahu (Inventory, Quests & Events)

Táto štúdia definuje optimálnu databázovú architektúru a synchronizačné mechanizmy pre správu perzistentných vlastností hráčov (inventár, úlohy/questy) a systémových telemetrických udalostí (game events) v projekte **Poslední kmen**.

---

## 1. Návrh hybridnej databázy: Relácie + JSONB

Pre flexibilný vývoj a stabilné škálovanie volíme **hybridný prístup (PostgreSQL s JSONB** alebo **SQLite s JSON1**). Umožňuje spojiť rýchlosť relačných databáz (pre pevné herné elementy ako ID hráčov, mená, typy) s flexibilitou noSQL databáz (JSON stĺpce pre komplexné stavy questov, premenlivý inventár a telemetriu).

```
+---------------------------------------------------------------------------------+
|                                 DATABASE SCHEMA                                 |
+----------------------+--------------------+-------------------------------------+
| Hráči (players)      | Herné prvky        | Telemetria (game_events)            |
| - id (UUID)          | - id (VARCHAR)     | - id (BIGINT)                       |
| - username           | - base_type        | - event_type                        |
| - inventory (JSONB)  | - metadata (JSONB) | - telemetry_theory (JSONB)          |
+----------------------+--------------------+-------------------------------------+
```

### SQL DDL Schéma (PostgreSQL / SQLite kompatibilná)

```sql
-- 1. Tabuľka statických a dynamických herných elementov (karty, kmeňové štatistiky)
CREATE TABLE game_content (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(32) NOT NULL, -- 'card', 'hero', 'helper'
    faction VARCHAR(32) NOT NULL,  -- 'crystal', 'toxic', 'druid'
    properties JSONB NOT NULL      -- Fyzikálne vlastnosti (voltage, resistance, reach)
);

-- 2. Tabuľka hráčov so stĺpcami pre inventár a questy
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Hybridný stĺpec pre inventár (zoznam itemov, ich durability, vylepšenia)
    inventory JSONB NOT NULL DEFAULT '{"slots": [], "equipped": {}}'::jsonb,
    
    -- Hybridný stĺpec pre aktívne a dokončené questy
    quests JSONB NOT NULL DEFAULT '{"active": [], "completed": []}'::jsonb
);

-- 3. Telemetria a logovanie herných teórií/udalostí
CREATE TABLE game_events_telemetry (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL, -- 'PLAY_CARD', 'DAMAGE', 'PURGE'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Obsahuje komplexnú teóriu stavu: napätie, prúd, odpor a chyby na mriežke
    telemetry_theory JSONB NOT NULL
);

-- Indexovanie JSONB pre bleskové vyhľadávanie
CREATE INDEX idx_players_inventory ON players USING gin (inventory);
CREATE INDEX idx_players_quests ON players USING gin (quests);
CREATE INDEX idx_telemetry_theory ON game_events_telemetry USING gin (telemetry_theory);
```

---

## 2. TypeScript dátové rozhranie (Types definition)

Definícia dátových štruktúr v zdieľanom module `@dusan-game/shared` pre typovo-bezpečnú manipuláciu s JSON stĺpcami:

```typescript
// Typy pre Inventár
export interface InventoryItem {
  itemId: string;
  count: number;
  durability: number; // 0.0 - 1.0 (saturačná prevencia zlyhania)
  attributes: Record<string, string | number>;
}

export interface PlayerInventory {
  slots: InventoryItem[];
  equipped: {
    avatarFrame?: string;
    cardSkins?: string;
  };
}

// Typy pre Úlohy (Quests)
export interface QuestObjective {
  objectiveId: string;
  description: string;
  currentValue: number;
  targetValue: number;
  isCompleted: boolean;
}

export interface ActiveQuest {
  questId: string;
  startedAt: string;
  objectives: QuestObjective[];
}

export interface PlayerQuestState {
  active: ActiveQuest[];
  completed: string[]; // Zoznam ID dokončených questov
}

// Typy pre Telemetrické Teórie
export interface TelemetryTheory {
  voltage: number;
  resistance: number;
  currentI: number;
  systemHeatBefore: number;
  systemHeatAfter: number;
  gridCoordinates: {
    sourceHex: string;
    targetHex: string;
  };
}
```

---

## 3. Synchronizácia a rekonciliácia stavu (State Reconciliation)

Na udržanie plynulého chodu (gameplay) a zamedzenie podvodom (cheating) implementujeme **Command-Reconciliation vzor** (State Reconciliation):

1.  **Optimistické zmeny na kliente (Optimistic UI updates):**
    Klient okamžite vykoná akciu (napr. pohne postavou) lokálne na základe svojho Connection Engine.
2.  **Odoslanie Commandu:**
    Odošle sa balíček (napr. cez Socket.io) na server: `execute_instruction`.
3.  **Autoritatívne overenie na serveri:**
    Server vytiahne dáta z PostgreSQL, overí stav a vykoná overenie Ohmovho zákona.
4.  **Zápis do DB a vysielanie Diffu:**
    Ak akcia prebehne v poriadku, server vykoná transakciu v DB a pošle späť aktualizovaný `state_resolved`.
5.  **Reconciliation:**
    Klient porovná svoj lokálny odhad s prijatým autoritatívnym stavom a upraví prípadné rozdiely (rollback v prípade zlyhania).

### Ukážka manažéra databázových operácií (DatabaseSyncManager.ts)

```typescript
import { Client } from 'pg'; // PostgreSQL klient
import type { PlayerInventory, PlayerQuestState, TelemetryTheory } from './types';

export class DatabaseSyncManager {
  constructor(private dbClient: Client) {}

  /**
   * Načíta stav inventára a questov hráča z databázy
   */
  public async getPlayerProperties(playerId: string): Promise<{ inventory: PlayerInventory; quests: PlayerQuestState } | null> {
    const query = 'SELECT inventory, quests FROM players WHERE id = $1';
    const result = await this.dbClient.query(query, [playerId]);
    
    if (result.rows.length === 0) return null;
    
    return {
      inventory: result.rows[0].inventory as PlayerInventory,
      quests: result.rows[0].quests as PlayerQuestState
    };
  }

  /**
   * Zapíše aktualizovaný inventár a overí integritu pred zápisom (Safe database write)
   */
  public async updatePlayerInventory(playerId: string, nextInventory: PlayerInventory): Promise<boolean> {
    // Bezpečnostná kontrola: zamedzenie raw zápisu neoverených hodnôt
    const sanitizedSlots = nextInventory.slots.map(slot => ({
      itemId: slot.itemId,
      count: Math.max(1, Math.min(999, slot.count)), // Saturácia
      durability: Math.max(0, Math.min(1, slot.durability)),
      attributes: slot.attributes || {}
    }));

    const sanitizedInventory: PlayerInventory = {
      slots: sanitizedSlots,
      equipped: nextInventory.equipped || {}
    };

    const query = 'UPDATE players SET inventory = $2 WHERE id = $1';
    const result = await this.dbClient.query(query, [playerId, JSON.stringify(sanitizedInventory)]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Zaznamená telemetrickú udalosť fyzikálneho vyhodnotenia
   */
  public async logTelemetryEvent(sessionId: string, eventType: string, theory: TelemetryTheory): Promise<void> {
    const query = `
      INSERT INTO game_events_telemetry (session_id, event_type, telemetry_theory)
      VALUES ($1, $2, $3)
    `;
    await this.dbClient.query(query, [sessionId, eventType, JSON.stringify(theory)]);
  }
}
```
