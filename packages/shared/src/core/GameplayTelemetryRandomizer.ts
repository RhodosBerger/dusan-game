export interface ActionEventData {
  turnIndex: number;
  activeFaction: 'crystal' | 'toxic' | 'druid';
  cardId: string;
  voltage: number;
  resistance: number;
  currentI: number;
  heatAdded: number;
  erosionCaused: number;
}

export interface MatchSessionStats {
  sessionId: string;
  factions: {
    playerA: 'crystal' | 'toxic' | 'druid';
    playerB: 'crystal' | 'toxic' | 'druid';
  };
  turnsCount: number;
  winnerFaction: 'crystal' | 'toxic' | 'druid' | 'draw';
  avgCurrentI: number;
  avgSystemHeat: number;
  purgesCount: number;
  events: ActionEventData[];
}

export interface CardPerformanceFeatures {
  cardId: string;
  usageFrequency: number;
  avgCurrentGenerated: number;
  hitSuccessRate: number; // Pomer útokov s prúdom I >= 1.0
  heatRiskContribution: number; // Celkové teplo vygenerované zlyhaním karty
}

export interface GameplayAnalyticsReport {
  totalMatchesSimulated: number;
  winRates: Record<string, number>;
  avgTurnsPerMatch: number;
  purgesPerMatchRatio: number;
  systemOverheatRate: number; // Percento zápasov, ktoré mali aspoň jeden Thermodynamic Purge
  cardFeatures: CardPerformanceFeatures[];
}

/**
 * Gameplay Telemetry Randomizer & Feature Extractor
 * Generuje simulované zápasy, ukladá ich do dátových štruktúr a extrahuje analytické príznaky (features).
 */
export class GameplayTelemetryRandomizer {
  private factionCards: Record<string, string[]> = {
    crystal: ['snowball', 'iceMeteor', 'iceShards', 'magicOrLife', 'snowstorm', 'snowGround', 'frost', 'iceCrystal', 'slide'],
    toxic: ['snakePit', 'bonusRangeTree', 'snakeAttack', 'disarm', 'disarmBomb', 'block', 'plantReincarnation', 'snakeMove'],
    druid: ['bearClaw', 'natureBreeze', 'healingRoot', 'stoneShield', 'thorns', 'wolfPack']
  };

  /**
   * Vygeneruje dataset s X náhodne odohranými zápasmi (Template Data)
   */
  public generateMatchDataset(numMatches: number): MatchSessionStats[] {
    const dataset: MatchSessionStats[] = [];
    const factionsPool: ('crystal' | 'toxic' | 'druid')[] = ['crystal', 'toxic', 'druid'];

    for (let i = 0; i < numMatches; i++) {
      const pAFaction = factionsPool[Math.floor(Math.random() * factionsPool.length)];
      let pBFaction = factionsPool[Math.floor(Math.random() * factionsPool.length)];
      // Zaistíme, aby nehrali rovnaké frakcie
      while (pBFaction === pAFaction) {
        pBFaction = factionsPool[Math.floor(Math.random() * factionsPool.length)];
      }

      dataset.push(this.simulateRandomMatch(`session_${Date.now()}_${i}`, pAFaction, pBFaction));
    }

    return dataset;
  }

  /**
   * Simuluje jeden zápas zohľadnením herných pravidiel a Ohmovho zákona
   */
  private simulateRandomMatch(
    sessionId: string, 
    factionA: 'crystal' | 'toxic' | 'druid', 
    factionB: 'crystal' | 'toxic' | 'druid'
  ): MatchSessionStats {
    const events: ActionEventData[] = [];
    let systemHeat = 0;
    let turnIndex = 1;
    let hpA = 15;
    let hpB = 12;
    let purgesCount = 0;

    // Odpor oboch hrdinov (Crystal má 2, Toxic má 1, Druid má 3)
    const resistanceMap = { crystal: 2, toxic: 1, druid: 3 };
    const rA = resistanceMap[factionA];
    const rB = resistanceMap[factionB];

    // Simulujeme ťahy, kým jeden neklesne na 0 HP alebo nepresiahne 30 ťahov
    while (hpA > 0 && hpB > 0 && turnIndex <= 30) {
      const activeFaction = turnIndex % 2 === 1 ? factionA : factionB;
      const targetFaction = activeFaction === factionA ? factionB : factionA;
      const targetR = targetFaction === factionA ? rA : rB;

      // Výber náhodnej karty aktívnej frakcie
      const pool = this.factionCards[activeFaction];
      const cardId = pool[Math.floor(Math.random() * pool.length)];

      // Compiler parametríze
      const isUltimate = Math.random() > 0.85;
      const voltage = isUltimate ? 6 : 3;
      const cardResistance = Math.random() > 0.5 ? 1 : 0;
      const semanticErosion = isUltimate ? 3 : 2;

      // Fyzikálny výpočet: I = V / R
      const R = targetR + cardResistance;
      const I = voltage / Math.max(0.1, R);

      let heatAdded = 0;
      let erosionCaused = 0;

      if (I >= 1.0) {
        erosionCaused = semanticErosion;
        if (targetFaction === factionA) hpA -= erosionCaused;
        else hpB -= erosionCaused;
      } else {
        heatAdded = Math.max(0, R - voltage);
        systemHeat += heatAdded;
      }

      // Prehriatie a Termodynamická Očista
      if (systemHeat > 100) {
        purgesCount++;
        systemHeat = Math.max(0, systemHeat - 20);
        // Očista oslabí aktívneho hráča o -1 HP
        if (activeFaction === factionA) hpA -= 1;
        else hpB -= 1;
      }

      events.push({
        turnIndex,
        activeFaction,
        cardId,
        voltage,
        resistance: R,
        currentI: I,
        heatAdded,
        erosionCaused
      });

      turnIndex++;
    }

    // Určenie víťaza
    let winner: MatchSessionStats['winnerFaction'] = 'draw';
    if (hpA <= 0 && hpB <= 0) winner = 'draw';
    else if (hpA <= 0) winner = factionB;
    else if (hpB <= 0) winner = factionA;
    else winner = 'draw'; // Vypršal limit 30 ťahov

    // Spočítanie priemerov
    const totalCurrent = events.reduce((sum, e) => sum + e.currentI, 0);
    const totalHeat = events.reduce((sum, e) => sum + e.heatAdded, 0);

    return {
      sessionId,
      factions: { playerA: factionA, playerB: factionB },
      turnsCount: turnIndex - 1,
      winnerFaction: winner,
      avgCurrentI: events.length > 0 ? totalCurrent / events.length : 0,
      avgSystemHeat: events.length > 0 ? totalHeat / events.length : 0,
      purgesCount,
      events
    };
  }

  /**
   * Agreguje surové štatistiky a extrahuje analytické príznaky pre ML modely (Features Extraction)
   */
  public extractAnalyticsFeatures(sessions: MatchSessionStats[]): GameplayAnalyticsReport {
    const totalMatches = sessions.length;
    const wins: Record<string, number> = { crystal: 0, toxic: 0, druid: 0, draw: 0 };
    let totalTurns = 0;
    let totalPurges = 0;
    let matchesWithPurge = 0;

    // Mapa pre akumuláciu hodnôt kariet: cardId -> { usage, totalI, successes, totalHeat }
    const cardAccumulator: Record<string, { usage: number; totalI: number; successes: number; totalHeat: number }> = {};

    for (const session of sessions) {
      wins[session.winnerFaction]++;
      totalTurns += session.turnsCount;
      totalPurges += session.purgesCount;
      if (session.purgesCount > 0) matchesWithPurge++;

      for (const e of session.events) {
        if (!cardAccumulator[e.cardId]) {
          cardAccumulator[e.cardId] = { usage: 0, totalI: 0, successes: 0, totalHeat: 0 };
        }
        const acc = cardAccumulator[e.cardId];
        acc.usage++;
        acc.totalI += e.currentI;
        acc.successes += e.currentI >= 1.0 ? 1 : 0;
        acc.totalHeat += e.heatAdded;
      }
    }

    // Zostavenie vlastností pre jednotlivé karty (Features matrix)
    const cardFeatures: CardPerformanceFeatures[] = Object.keys(cardAccumulator).map(cardId => {
      const acc = cardAccumulator[cardId];
      return {
        cardId,
        usageFrequency: acc.usage,
        avgCurrentGenerated: acc.usage > 0 ? acc.totalI / acc.usage : 0,
        hitSuccessRate: acc.usage > 0 ? acc.successes / acc.usage : 0,
        heatRiskContribution: acc.totalHeat
      };
    });

    // Výpočet percentuálnych win rates
    const winRates: Record<string, number> = {};
    Object.keys(wins).forEach(key => {
      winRates[key] = totalMatches > 0 ? wins[key] / totalMatches : 0;
    });

    return {
      totalMatchesSimulated: totalMatches,
      winRates,
      avgTurnsPerMatch: totalMatches > 0 ? totalTurns / totalMatches : 0,
      purgesPerMatchRatio: totalMatches > 0 ? totalPurges / totalMatches : 0,
      systemOverheatRate: totalMatches > 0 ? matchesWithPurge / totalMatches : 0,
      cardFeatures
    };
  }
}
