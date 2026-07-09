# Zoznam Budúcich Funkcií a Štrukturálnych Závislostí (Future Features Checklist)

Tento dokument mapuje pripravované herné funkcie (Features) a definuje, na akých backendových logikách, dátových štruktúrach a databázových modeloch priamo závisia. Slúži ako technický plán (development map) pre ďalší vývoj.

---

## 1. Mapa závislostí (Feature-to-Structure Dependency Map)

```
[Herná Funkcia] ---> [Závislá Logika v TS] ---> [Závislá Databázová Štruktúra]
```

---

## 2. Prehľad funkcií a ich technických požiadaviek

### A. Frakčné mechaniky a stavy Hrdinov (Fractions & Status Effects)
*   **Popis:** Plná implementácia stavov (Spomalenie, Zakorenenie, Odzbrojenie, Umlčanie) a špeciálnych vlastností pre Crystal, Toxic a Druid frakcie podľa knihy pravidiel.
*   **Závislá logika (TypeScript):**
    *   Spracovanie bitových príznakov (`HeroStateFlags`) v `resolveEngineState`.
    *   Blokovanie zahrania žltých kariet pri zakorenení, červených pri odzbrojení a modrých pri umlčaní.
    *   Odčítanie 1 akcie za vyčistenie stavu.
*   **Závislá štruktúra (Database):**
    *   Stĺpec `players.properties.axiomaticFlags` pre pretrvávanie stavov medzi hernými kolami.

### B. Správa a perzistencia inventára (Inventory Persistence)
*   **Popis:** Hráči získavajú skiny, rámy avatarov a nové balíčky kariet, ktoré sa ukladajú do ich profilu.
*   **Závislá logika (TypeScript):**
    *   `DatabaseSyncManager.updatePlayerInventory` so saturačnou validáciou hodnôt (durability, counts) na ochranu pred podvodmi.
    *   Filtrovanie duplicity itemov v inventári.
*   **Závislá štruktúra (Database):**
    *   Tabuľka `players` so stĺpcom `inventory (JSONB)` a GIN indexom (`idx_players_inventory`) pre bleskové dotazy.

### C. Vývoj úloh a questov (Quest Progression Engine)
*   **Popis:** Sledovanie aktívnych úloh (napr. "Zahraj 3 Ultimate karty" alebo "Udeľ 10 dmg sémantickej erózie") a ich automatické vyhodnocovanie.
*   **Závislá logika (TypeScript):**
    *   **Quest Trigger Event Listener:** Systém, ktorý odpočúva udalosti z Connection Engine a navyšuje `currentValue` v objekte questu.
    *   Logika pre priradenie odmien (zlato, xp) po dokončení questu.
*   **Závislá štruktúra (Database):**
    *   Stĺpec `players.quests (JSONB)` ukladajúci pole aktívnych objektov s cieľovými hodnotami (`targetValue`).

### D. Pokročilá Big Data telemetria (ClickHouse Telemetry Stream)
*   **Popis:** Ukladanie tisícok bojových akcií na hlbokú analýzu herného balansu a detekciu anomálií pomocou ML.
*   **Závislá logika (TypeScript):**
    *   Výpočet a serializácia `TelemetryTheory` (napätie, odpor, vypočítaný prúd, meta-koordináty) pri každej akcii.
    *   Dávkový zápis (Batch insert) do databázy.
*   **Závislá štruktúra (Database):**
    *   Tabuľka `game_events_telemetry` so stĺpcom `telemetry_theory (JSONB)`.

---

## 3. Akčný plán vývoja (Checklist)

Nasledujúce položky sú zoradené podľa ich štrukturálnej priority (od základov po finálne ML funkcie):

*   `[x]` **Fáza 1: Lokálne Overovanie Pravidiel (Pravidlá & Limity)**
    *   `[x]` Implementovať bitovú masku `HeroStateFlags` v `SovereignEngine.ts`.
    *   `[x]` Pridať overovacie guardy pre zákaz hrania kariet pri aktívnych stavoch.
    *   `[x]` Pridať test vzdialenosti na hexagonálnej sieti v `HexMath3D.js` pre overenie dosahu útokov.
*   `[x]` **Fáza 2: Databázová Integrácia (Perzistencia)**
    *   `[x]` Nasadiť SQLite / PostgreSQL DDL schému (vytvoriť tabuľky `players`, `game_events_telemetry`).
    *   `[x]` Vytvoriť a prepojiť súbor `DatabaseSyncManager.ts` v backend package pre ukladanie inventára.
*   `[x]` **Fáza 3: Herné udalosti a Úlohy (Quests & Inventory)**
    *   `[x]` Vytvoriť Quest Listener, ktorý reaguje na signály `state_resolved` z Connection Engine.
    *   `[x]` Implementovať UI pre zobrazenie questov a inventára v bočnom HUD paneli klienta.
*   `[x]` **Fáza 4: ML Analýza a Balans (Telemetry)**
    *   `[x]` Prepojiť `GameplayTelemetryRandomizer.ts` so zberom reálnych dát z produkcie.
    *   `[x]` Spustiť K-Means clustering a anomálnu detekciu na vygenerovaných dátach na optimalizáciu napätia ($V$) a odporu ($R$) kariet.
