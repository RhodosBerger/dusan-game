/**
 * Pattern Recognition & Anomaly Detection Module
 * 
 * Detects "fun anomalies" in gameplay patterns
 * Integrates with all game systems to identify emergent fun
 * Provides real-time feedback to admins and players
 */

import { EventEmitter } from 'events';

export interface GameplayEvent {
  timestamp: number;
  playerId: string;
  eventType: string;
  data: Record<string, any>;
  context: {
    location?: string;
    sector?: string;
    faction?: string;
    karma?: number;
    entropy?: number;
  };
}

export interface AnomalyPattern {
  id: string;
  name: string;
  description: string;
  confidence: number; // 0-1
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'combat' | 'economy' | 'social' | 'exploration' | 'progression' | 'emergent';
  detectedAt: number;
  relatedEvents: string[]; // event IDs
  suggestedAction?: string;
  funFactorScore?: number; // 0-100
}

export interface PlayerBehaviorProfile {
  playerId: string;
  playStyle: 'aggressive' | 'defensive' | 'explorer' | 'collector' | 'social' | 'optimizer';
  averageSessionLength: number;
  preferredActivities: string[];
  anomalySusceptibility: number; // How likely to trigger anomalies
  karmaTrend: 'increasing' | 'stable' | 'decreasing';
  entropyContribution: number;
}

export class PatternRecognitionEngine extends EventEmitter {
  private eventBuffer: GameplayEvent[];
  private detectedPatterns: Map<string, AnomalyPattern>;
  private playerProfiles: Map<string, PlayerBehaviorProfile>;
  private readonly maxBufferSize: number = 10000;
  private readonly patternThresholds: Record<string, number>;

  constructor() {
    super();
    this.eventBuffer = [];
    this.detectedPatterns = new Map();
    this.playerProfiles = new Map();
    
    // Thresholds for different anomaly types
    this.patternThresholds = {
      combatStreak: 5, // kills without death
      economySpike: 3.0, // multiplier vs average
      socialCluster: 10, // players in same area
      explorationSpeed: 2.5, // faster than expected
      progressionJump: 2.0, // level skip detection
      emergentCombo: 3, // unique action combinations
    };
  }

  public ingestEvent(event: GameplayEvent): void {
    this.eventBuffer.push(event);
    
    // Maintain buffer size
    if (this.eventBuffer.length > this.maxBufferSize) {
      this.eventBuffer.shift();
    }

    // Update player profile
    this.updatePlayerProfile(event);

    // Check for anomalies
    const anomalies = this.detectAnomalies(event);
    
    anomalies.forEach(anomaly => {
      if (!this.detectedPatterns.has(anomaly.id)) {
        this.detectedPatterns.set(anomaly.id, anomaly);
        this.emit('anomalyDetected', anomaly);
        
        // Special handling for "fun" anomalies
        if (anomaly.funFactorScore && anomaly.funFactorScore > 70) {
          this.emit('funAnomalyDetected', anomaly);
        }
      } else {
        // Update existing pattern
        const existing = this.detectedPatterns.get(anomaly.id)!;
        existing.confidence = Math.min(1.0, existing.confidence + 0.05);
        existing.relatedEvents.push(event.eventType + '-' + event.timestamp);
      }
    });
  }

  private updatePlayerProfile(event: GameplayEvent): void {
    if (!this.playerProfiles.has(event.playerId)) {
      this.playerProfiles.set(event.playerId, {
        playerId: event.playerId,
        playStyle: 'explorer', // default
        averageSessionLength: 0,
        preferredActivities: [],
        anomalySusceptibility: 0.5,
        karmaTrend: 'stable',
        entropyContribution: 0,
      });
    }

    const profile = this.playerProfiles.get(event.playerId)!;
    
    // Update preferred activities
    if (!profile.preferredActivities.includes(event.eventType)) {
      profile.preferredActivities.push(event.eventType);
    }

    // Update karma trend
    if (event.context.karma !== undefined) {
      if (event.context.karma > 0.5) {
        profile.karmaTrend = 'increasing';
      } else if (event.context.karma < -0.5) {
        profile.karmaTrend = 'decreasing';
      }
    }

    // Determine play style based on event patterns
    const recentEvents = this.eventBuffer.filter(e => e.playerId === event.playerId).slice(-20);
    const combatEvents = recentEvents.filter(e => e.eventType.startsWith('combat')).length;
    const explorationEvents = recentEvents.filter(e => e.eventType.startsWith('explore')).length;
    const socialEvents = recentEvents.filter(e => e.eventType.startsWith('social')).length;

    if (combatEvents > 10) profile.playStyle = 'aggressive';
    else if (explorationEvents > 10) profile.playStyle = 'explorer';
    else if (socialEvents > 8) profile.playStyle = 'social';
    else if (recentEvents.filter(e => e.eventType.includes('loot')).length > 5) {
      profile.playStyle = 'collector';
    }
  }

  private detectAnomalies(event: GameplayEvent): AnomalyPattern[] {
    const anomalies: AnomalyPattern[] = [];
    const playerId = event.playerId;
    const recentEvents = this.eventBuffer.filter(e => e.playerId === playerId).slice(-50);

    // Combat Streak Anomaly
    const consecutiveKills = this.countConsecutiveKills(recentEvents);
    if (consecutiveKills >= this.patternThresholds.combatStreak) {
      anomalies.push({
        id: `combat-streak-${playerId}-${Date.now()}`,
        name: 'Unstoppable Force',
        description: `Player achieved ${consecutiveKills} consecutive kills without death`,
        confidence: Math.min(1.0, consecutiveKills / 10),
        severity: consecutiveKills > 10 ? 'high' : 'medium',
        category: 'combat',
        detectedAt: Date.now(),
        relatedEvents: [event.eventType + '-' + event.timestamp],
        suggestedAction: 'Consider spawning elite enemy or offering challenge quest',
        funFactorScore: Math.min(100, 50 + consecutiveKills * 5)
      });
    }

    // Economy Spike Anomaly
    if (event.eventType.includes('loot') || event.eventType.includes('trade')) {
      const avgLoot = this.calculateAverageLoot(playerId);
      const currentLoot = event.data.value || 0;
      if (currentLoot > avgLoot * this.patternThresholds.economySpike) {
        anomalies.push({
          id: `economy-spike-${playerId}-${Date.now()}`,
          name: 'Treasure Hunter',
          description: `Player found loot ${((currentLoot/avgLoot)*100).toFixed(0)}% above average`,
          confidence: Math.min(1.0, (currentLoot/avgLoot) / 5),
          severity: currentLoot > avgLoot * 5 ? 'high' : 'low',
          category: 'economy',
          detectedAt: Date.now(),
          relatedEvents: [event.eventType + '-' + event.timestamp],
          suggestedAction: 'Monitor for exploitation or celebrate lucky find',
          funFactorScore: Math.min(100, 40 + (currentLoot/avgLoot) * 10)
        });
      }
    }

    // Social Cluster Anomaly
    if (event.eventType.includes('social') || event.eventType.includes('group')) {
      const nearbyPlayers = this.countNearbyPlayers(event.context.location);
      if (nearbyPlayers >= this.patternThresholds.socialCluster) {
        anomalies.push({
          id: `social-cluster-${event.context.location}-${Date.now()}`,
          name: 'Gathering Storm',
          description: `${nearbyPlayers} players gathered in same location`,
          confidence: Math.min(1.0, nearbyPlayers / 20),
          severity: nearbyPlayers > 20 ? 'medium' : 'low',
          category: 'social',
          detectedAt: Date.now(),
          relatedEvents: [event.eventType + '-' + event.timestamp],
          suggestedAction: 'Spawn world event or boss for group',
          funFactorScore: Math.min(100, 30 + nearbyPlayers * 3)
        });
      }
    }

    // Emergent Combo Anomaly (unique action sequences)
    const uniqueCombos = this.detectUniqueCombos(recentEvents);
    if (uniqueCombos.length >= this.patternThresholds.emergentCombo) {
      anomalies.push({
        id: `emergent-combo-${playerId}-${Date.now()}`,
        name: 'Creative Genius',
        description: 'Player discovered unique action combination',
        confidence: Math.min(1.0, uniqueCombos.length / 5),
        severity: 'low',
        category: 'emergent',
        detectedAt: Date.now(),
        relatedEvents: uniqueCombos.map(c => c + '-' + event.timestamp),
        suggestedAction: 'Record combo for achievement system',
        funFactorScore: Math.min(100, 60 + uniqueCombos.length * 10)
      });
    }

    // Karma Extremes
    if (event.context.karma !== undefined) {
      if (Math.abs(event.context.karma) > 0.9) {
        anomalies.push({
          id: `karma-extreme-${playerId}-${Date.now()}`,
          name: event.context.karma > 0 ? 'Paragon' : 'Renegade',
          description: `Player reached extreme karma level: ${event.context.karma.toFixed(2)}`,
          confidence: Math.abs(event.context.karma),
          severity: 'high',
          category: 'progression',
          detectedAt: Date.now(),
          relatedEvents: [event.eventType + '-' + event.timestamp],
          suggestedAction: 'Unlock special karma-based quests or rewards',
          funFactorScore: 75
        });
      }
    }

    return anomalies;
  }

  private countConsecutiveKills(events: GameplayEvent[]): number {
    let streak = 0;
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].eventType === 'combat:kill') {
        streak++;
      } else if (events[i].eventType === 'combat:death') {
        break;
      }
    }
    return streak;
  }

  private calculateAverageLoot(playerId: string): number {
    const lootEvents = this.eventBuffer.filter(
      e => e.playerId === playerId && (e.eventType.includes('loot') || e.eventType.includes('trade'))
    );
    if (lootEvents.length === 0) return 100; // default
    const total = lootEvents.reduce((sum, e) => sum + (e.data.value || 0), 0);
    return total / lootEvents.length;
  }

  private countNearbyPlayers(location?: string): number {
    if (!location) return 0;
    return this.eventBuffer.filter(
      e => e.context.location === location && e.timestamp > Date.now() - 60000
    ).length;
  }

  private detectUniqueCombos(events: GameplayEvent[]): string[] {
    // Simple combo detection - look for unique sequences of 3+ different actions
    const combos: Set<string> = new Set();
    for (let i = 0; i < events.length - 2; i++) {
      const combo = [events[i].eventType, events[i+1].eventType, events[i+2].eventType].join('->');
      if (!this.eventBuffer.slice(0, i).some(e => 
        e.eventType === events[i].eventType && 
        this.eventBuffer[this.eventBuffer.indexOf(e)+1]?.eventType === events[i+1].eventType
      )) {
        combos.add(combo);
      }
    }
    return Array.from(combos);
  }

  public getPlayerProfile(playerId: string): PlayerBehaviorProfile | null {
    return this.playerProfiles.get(playerId) || null;
  }

  public getAllActivePatterns(): AnomalyPattern[] {
    return Array.from(this.detectedPatterns.values());
  }

  public getPatternsByCategory(category: string): AnomalyPattern[] {
    return Array.from(this.detectedPatterns.values()).filter(p => p.category === category);
  }

  public clearOldPatterns(maxAge: number = 300000): void { // 5 minutes default
    const now = Date.now();
    for (const [id, pattern] of this.detectedPatterns.entries()) {
      if (now - pattern.detectedAt > maxAge) {
        this.detectedPatterns.delete(id);
      }
    }
  }

  public exportMetrics(): {
    totalAnomalies: number;
    funAnomalies: number;
    averageFunScore: number;
    topCategories: Array<{ category: string; count: number }>;
    playerEngagementScore: number;
  } {
    const patterns = this.getAllActivePatterns();
    const funPatterns = patterns.filter(p => (p.funFactorScore || 0) > 70);
    
    const categoryCounts = patterns.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const avgFunScore = funPatterns.length > 0
      ? funPatterns.reduce((sum, p) => sum + (p.funFactorScore || 0), 0) / funPatterns.length
      : 0;

    return {
      totalAnomalies: patterns.length,
      funAnomalies: funPatterns.length,
      averageFunScore: avgFunScore,
      topCategories,
      playerEngagementScore: Math.min(100, patterns.length * 2 + funPatterns.length * 5)
    };
  }
}

export default PatternRecognitionEngine;
