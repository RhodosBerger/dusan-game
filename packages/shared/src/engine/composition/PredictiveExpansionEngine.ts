/**
 * Auto-Hook Composition & Predictive Expansion Engine
 * 
 * Tento modul riadi expanziu herného sveta, predikciu vývoja levelov
 * a automatizované spúšťanie hookov bez potreby priameho kódovania.
 * 
 * Kľúčové vlastnosti:
 * - Dynamic Area Expansion: Rozširovanie hex gridu do nekonečna
 * - Predictive Snapshotting: Generovanie stavov pred vstupom hráča
 * - Scriptable Hooks: Exekúcia externých skriptov (.md, .json) ako herná logika
 */

import { HexGrid, HexCoord } from '../geometry/hex-core';
import { ProceduralGenerator } from '../generation/procedural-engine';
import { EventHookRegistry } from '../hooks/auto-hook-system';

export interface ExpansionConfig {
  viewDistance: number;
  preloadDistance: number;
  expansionSpeed: number;
  hookDirectory: string;
}

export interface CompositionalSnapshot {
  id: string;
  timestamp: number;
  activeSectors: HexCoord[];
  predictedPath: HexCoord[];
  generatedEntities: any[];
  cssBlueprintHash: string;
  hookExecutions: string[];
}

export class PredictiveExpansionEngine {
  private grid: HexGrid;
  private generator: ProceduralGenerator;
  private hookRegistry: EventHookRegistry;
  private config: ExpansionConfig;
  private activeSnapshots: Map<string, CompositionalSnapshot>;
  private playerTrajectory: HexCoord[];

  constructor(config: ExpansionConfig) {
    this.config = config;
    this.grid = new HexGrid();
    this.generator = new ProceduralGenerator();
    this.hookRegistry = new EventHookRegistry(config.hookDirectory);
    this.activeSnapshots = new Map();
    this.playerTrajectory = [];
  }

  /**
   * Hlavná slučka expanzie: Volá sa v každom frame alebo pri pohybe
   * Rozširuje plochu a generuje nové kompozície
   */
  public update(playerPos: HexCoord, deltaTime: number): CompositionalSnapshot {
    // 1. Aktualizácia trajektórie (Predikcia kam hráč pôjde)
    this.updateTrajectory(playerPos);
    
    // 2. Expanzia plochy (Pridanie nových sektorov)
    const newSectors = this.expandArea(playerPos);
    
    // 3. Generovanie obsahu pre nové sektory (Pred-bežné vykreslenie)
    const generatedContent = this.generateCompositions(newSectors);
    
    // 4. Exekúcia automatických hookov (Zero-Code Logic)
    const executedHooks = this.executeAutoHooks(newSectors, generatedContent);
    
    // 5. Vytvorenie snímky (Snapshot) pre render engine
    const snapshot = this.createSnapshot(playerPos, newSectors, generatedContent, executedHooks);
    
    // 6. Cleanup (Odstránenie vzdialených sektorov pre optimalizáciu)
    this.cleanupDistantSectors(playerPos);
    
    return snapshot;
  }

  private updateTrajectory(current: HexCoord) {
    this.playerTrajectory.push(current);
    if (this.playerTrajectory.length > 20) {
      this.playerTrajectory.shift();
    }
  }

  private expandArea(center: HexCoord): HexCoord[] {
    const newSectors: HexCoord[] = [];
    const radius = this.config.viewDistance;
    
    // Nájdi všetky hexy v dosahu, ktoré ešte nie sú vygenerované
    for (let q = -radius; q <= radius; q++) {
      for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
        const coord = new HexCoord(q + center.q, r + center.r);
        if (!this.grid.hasSector(coord)) {
          // Skontroluj či je v smere trajektórie (prioritná expanzia)
          if (this.isInPredictedPath(coord)) {
            this.grid.addSector(coord, { status: 'preloading' });
            newSectors.push(coord);
          } else if (Math.random() < this.config.expansionSpeed) {
            // Náhodná expanzia okolia
            this.grid.addSector(coord, { status: 'pending' });
            newSectors.push(coord);
          }
        }
      }
    }
    return newSectors;
  }

  private isInPredictedPath(coord: HexCoord): boolean {
    if (this.playerTrajectory.length < 2) return false;
    // Jednoduchá lineárna extrapolácia
    const last = this.playerTrajectory[this.playerTrajectory.length - 1];
    const prev = this.playerTrajectory[this.playerTrajectory.length - 2];
    const dx = last.q - prev.q;
    const dr = last.r - prev.r;
    
    // Predikcia ďalších 5 políčok
    for (let i = 1; i <= 5; i++) {
      const predQ = last.q + (dx * i);
      const predR = last.r + (dr * i);
      if (coord.q === predQ && coord.r === predR) return true;
    }
    return false;
  }

  private generateCompositions(sectors: HexCoord[]): any[] {
    return sectors.map(sector => {
      // Generovanie obsahu na základe seedu a kontextu
      const content = this.generator.generateSectorData(sector, {
        entropy: this.grid.getGlobalEntropy(),
        biome: this.grid.getBiomeAt(sector),
        difficulty: this.calculateDifficulty(sector)
      });
      
      // Uloženie do gridu ako "pripravené na render"
      this.grid.updateSector(sector, { content, status: 'ready' });
      return content;
    });
  }

  private calculateDifficulty(sector: HexCoord): number {
    // Vzorec založený na vzdialenosti od spawnu a karme hráča
    const dist = HexGrid.distance(new HexCoord(0, 0), sector);
    return Math.min(1.0, 0.1 + (dist * 0.05));
  }

  /**
   * Zero-Code Hook Execution
   * Načíta skripty z file systému (alebo DB) a spustí ich nad dátami
   */
  private executeAutoHooks(sectors: HexCoord[], content: any[]): string[] {
    const executed: string[] = [];
    
    // Získať všetky aktívne hooky pre danú oblasť/biome
    const hooks = this.hookRegistry.getHooksForContext({
      sectors: sectors,
      biomes: [...new Set(content.map(c => c.biome))]
    });

    hooks.forEach(hook => {
      try {
        // Exekúcia skriptu (sandboxed)
        const result = hook.execute({ sectors, content, grid: this.grid });
        
        if (result.modifications) {
          // Aplikácia zmien späť do obsahu
          result.modifications.forEach((mod: any) => {
            const sector = mod.sector;
            if (sector && this.grid.hasSector(sector)) {
              this.grid.applyModification(sector, mod.changes);
            }
          });
        }
        
        executed.push(hook.id);
      } catch (e) {
        console.error(`Hook ${hook.id} failed:`, e);
      }
    });

    return executed;
  }

  private createSnapshot(
    player: HexCoord, 
    sectors: HexCoord[], 
    content: any[], 
    hooks: string[]
  ): CompositionalSnapshot {
    const id = `snap_${Date.now()}_${player.q}_${player.r}`;
    
    // Generovanie CSS Blueprint Hash pre túto snímku
    // Toto určí, aké CSS triedy/shadery sa majú aplikovať
    const cssHash = this.generateCSSBlueprintHash(content);

    const snapshot: CompositionalSnapshot = {
      id,
      timestamp: Date.now(),
      activeSectors: sectors,
      predictedPath: [...this.playerTrajectory],
      generatedEntities: content,
      cssBlueprintHash: cssHash,
      hookExecutions: hooks
    };

    this.activeSnapshots.set(id, snapshot);
    
    // Odoslanie udalosti pre Render Engine (cez Event Bus)
    this.emitSnapshotReady(snapshot);
    
    return snapshot;
  }

  private generateCSSBlueprintHash(content: any[]): string {
    // Vytvor unikátny hash na základe typov entít a biomov
    // Tento hash sa použije na lookup v CSS/Shader konfigoch
    const signature = content
      .map(c => `${c.biome}-${c.type}-${c.entropyLevel}`)
      .sort()
      .join('|');
    
    // Jednoduchý hash (v produkcii použiť crypto)
    let hash = 0;
    for (let i = 0; i < signature.length; i++) {
      hash = ((hash << 5) - hash) + signature.charCodeAt(i);
      hash |= 0;
    }
    return `bp_${Math.abs(hash).toString(16)}`;
  }

  private cleanupDistantSectors(player: HexCoord) {
    const keepRadius = this.config.viewDistance + 2;
    const toRemove: HexCoord[] = [];
    
    this.grid.getAllSectors().forEach(sector => {
      if (HexGrid.distance(player, sector) > keepRadius) {
        toRemove.push(sector);
      }
    });
    
    toRemove.forEach(sector => {
      this.grid.removeSector(sector);
      // Tu by sa mohol uložiť stav do persistentného úložiska pred zmazaním
    });
  }

  private emitSnapshotReady(snapshot: CompositionalSnapshot) {
    // Dispatch event pre Render Pipeline
    if (typeof window !== 'undefined' && window.CustomEvent) {
      window.dispatchEvent(new CustomEvent('composition:snapshot', { detail: snapshot }));
    }
  }

  /**
   * Manuálne pridanie hooku za behu (Hot-Reload)
   * Umožňuje meniť logiku bez reštartu
   */
  public registerHookScript(id: string, scriptContent: string, triggerCondition: string) {
    this.hookRegistry.registerDynamicHook(id, scriptContent, triggerCondition);
  }
}

export default PredictiveExpansionEngine;
