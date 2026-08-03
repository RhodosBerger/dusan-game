/**
 * CSS Blueprint Manager & Dynamic Style Injector
 * 
 * Spravuje CSS blueprinty generované z herných snapshotov.
 * Automaticky aplikuje štýly na základe hashov zo snapshotov.
 */

export interface CSSBlueprint {
  hash: string;
  rules: Record<string, string>;
  shaderParams?: Record<string, number>;
  active: boolean;
  createdAt: number;
}

export class CSSBlueprintManager {
  private blueprints: Map<string, CSSBlueprint>;
  private activeBlueprintHash: string | null = null;
  private styleElement: any;

  constructor() {
    this.blueprints = new Map();
    
    // Safe DOM access for Node environments
    if (typeof document !== 'undefined' && document.head) {
      this.styleElement = document.createElement('style');
      this.styleElement.id = 'dynamic-game-styles';
      document.head.appendChild(this.styleElement);
    } else {
      this.styleElement = { textContent: '' };
    }
    
    // Predvolené blueprinty
    this.loadDefaultBlueprints();
  }

  private loadDefaultBlueprints() {
    // Shadow biome blueprint
    this.registerBlueprint({
      hash: 'bp_shadow_default',
      rules: {
        '--sector-bg-color': '#1a0a2e',
        '--entity-opacity': '0.8',
        '--border-glow': '0 0 10px #6a0dad',
        '--text-color': '#d8bfd8'
      },
      shaderParams: {
        darkness: 0.7,
        contrast: 1.3,
        saturation: 0.5
      },
      active: false,
      createdAt: Date.now()
    });

    // Light/Karma biome blueprint
    this.registerBlueprint({
      hash: 'bp_light_default',
      rules: {
        '--sector-bg-color': '#f0f4ff',
        '--entity-opacity': '1.0',
        '--border-glow': '0 0 15px #ffd700',
        '--text-color': '#2c3e50'
      },
      shaderParams: {
        darkness: 0.2,
        contrast: 1.0,
        saturation: 1.2
      },
      active: false,
      createdAt: Date.now()
    });

    // High entropy blueprint
    this.registerBlueprint({
      hash: 'bp_chaos_default',
      rules: {
        '--sector-bg-color': '#2d0a0a',
        '--entity-opacity': '0.9',
        '--border-glow': '0 0 20px #ff4500',
        '--text-color': '#ff6b6b',
        '--animation-speed': '2.0'
      },
      shaderParams: {
        darkness: 0.5,
        contrast: 1.5,
        saturation: 0.8,
        distortion: 0.3
      },
      active: false,
      createdAt: Date.now()
    });
  }

  public registerBlueprint(blueprint: CSSBlueprint) {
    this.blueprints.set(blueprint.hash, blueprint);
  }

  /**
   * Aplikuje blueprint na základe hashu zo snapshotu
   */
  public applyBlueprint(hash: string): boolean {
    const blueprint = this.blueprints.get(hash);
    
    if (!blueprint) {
      // Ak blueprint neexistuje, skús vygenerovať fallback
      console.warn(`Blueprint ${hash} not found, using fallback`);
      this.applyFallbackStyles();
      return false;
    }

    // Deaktivuj predchádzajúci blueprint
    if (this.activeBlueprintHash) {
      const prev = this.blueprints.get(this.activeBlueprintHash);
      if (prev) prev.active = false;
    }

    // Aktivuj nový
    blueprint.active = true;
    this.activeBlueprintHash = hash;

    // Generuj CSS z pravidiel
    const cssText = this.generateCSSText(blueprint);
    this.styleElement.textContent = cssText;

    // Dispatch event pre shader engine
    if (blueprint.shaderParams && typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('shader:update', { 
        detail: blueprint.shaderParams 
      }));
    }

    return true;
  }

  private generateCSSText(blueprint: CSSBlueprint): string {
    let css = `/* Auto-generated blueprint: ${blueprint.hash} */\n`;
    css += `.game-container {\n`;
    
    Object.entries(blueprint.rules).forEach(([prop, value]) => {
      css += `  ${prop}: ${value};\n`;
    });
    
    css += `}\n`;

    // Pridaj špecifické triedy pre entity
    css += `.sector.shadow { background-color: var(--sector-bg-color); }\n`;
    css += `.sector { border: 1px solid transparent; box-shadow: var(--border-glow); }\n`;
    css += `.entity { opacity: var(--entity-opacity); color: var(--text-color); }\n`;

    return css;
  }

  private applyFallbackStyles() {
    const fallback: CSSBlueprint = {
      hash: 'fallback',
      rules: {
        '--sector-bg-color': '#ffffff',
        '--entity-opacity': '1.0',
        '--border-glow': 'none',
        '--text-color': '#000000'
      },
      active: true,
      createdAt: Date.now()
    };
    
    this.styleElement.textContent = this.generateCSSText(fallback);
    this.activeBlueprintHash = 'fallback';
  }

  /**
   * Vytvorí nový blueprint dynamicky zo snapshot dát
   */
  public createDynamicBlueprint(
    hash: string, 
    entities: any[]
  ): CSSBlueprint {
    // Analyzuj entity a vytvor pravidlá
    const dominantBiome = this.findDominantBiome(entities);
    const avgEntropy = this.calculateAverageEntropy(entities);
    
    const rules: Record<string, string> = {};
    const shaderParams: Record<string, number> = {};

    // Prispôsob štýl podľa biomu
    if (dominantBiome === 'shadow') {
      rules['--sector-bg-color'] = '#1a0a2e';
      rules['--border-glow'] = '0 0 10px #6a0dad';
      shaderParams.darkness = 0.7;
    } else if (dominantBiome === 'light') {
      rules['--sector-bg-color'] = '#f0f4ff';
      rules['--border-glow'] = '0 0 15px #ffd700';
      shaderParams.darkness = 0.2;
    }

    // Prispôsob podľa entropie
    if (avgEntropy > 0.7) {
      rules['--animation-speed'] = '2.0';
      rules['--border-glow'] = '0 0 20px #ff4500';
      shaderParams.distortion = 0.3;
    }

    const blueprint: CSSBlueprint = {
      hash,
      rules,
      shaderParams,
      active: false,
      createdAt: Date.now()
    };

    this.registerBlueprint(blueprint);
    return blueprint;
  }

  private findDominantBiome(entities: any[]): string {
    const counts: Record<string, number> = {};
    entities.forEach(e => {
      counts[e.biome] = (counts[e.biome] || 0) + 1;
    });
    
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'default';
  }

  private calculateAverageEntropy(entities: any[]): number {
    if (entities.length === 0) return 0;
    const sum = entities.reduce((acc, e) => acc + (e.entropyLevel || 0), 0);
    return sum / entities.length;
  }

  public getActiveBlueprint(): CSSBlueprint | null {
    if (!this.activeBlueprintHash) return null;
    return this.blueprints.get(this.activeBlueprintHash) || null;
  }
}

export default CSSBlueprintManager;
