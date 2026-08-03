/**
 * Auto-Hook System & Script Executor
 * 
 * Umožňuje spúšťať externé skripty (.md, .json, .js) ako hernú logiku
 * bez potreby recompilácie hlavného enginu.
 */

export interface HookContext {
  sectors: any[];
  content: any[];
  grid: any;
  player?: any;
  timestamp: number;
}

export interface HookResult {
  modifications?: Array<{
    sector: any;
    changes: any;
  }>;
  events?: any[];
  metadata?: any;
}

export interface HookDefinition {
  id: string;
  name: string;
  triggerCondition: string; // Napr: "biome == 'shadow' && entropy > 0.7"
  scriptContent: string;
  priority: number;
  enabled: boolean;
}

export class EventHookRegistry {
  private hooks: Map<string, HookDefinition>;
  private hookDirectory: string;

  constructor(hookDirectory: string) {
    this.hooks = new Map();
    this.hookDirectory = hookDirectory;
    this.loadDefaultHooks();
  }

  private loadDefaultHooks() {
    // Predvolené hooky pre shadow boje, karma zmeny, atď.
    this.registerHook({
      id: 'shadow_spawn',
      name: 'Shadow Sector Spawn',
      triggerCondition: "biome === 'shadow' && Math.random() < 0.3",
      scriptContent: `
        // Príklad: Spawn tieňových nepriateľov
        return {
          modifications: context.sectors.map(s => ({
            sector: s,
            changes: { enemyType: 'shadow_warrior', spawned: true }
          }))
        };
      `,
      priority: 10,
      enabled: true
    });

    this.registerHook({
      id: 'karma_shift',
      name: 'Karma Visual Shift',
      triggerCondition: "player.karma < -0.5",
      scriptContent: `
        // Zmena farieb a shaderov pri nízkej karme
        return {
          modifications: context.sectors.map(s => ({
            sector: s,
            changes: { 
              colorTint: '#8b0000',
              shaderParams: { darkness: 0.8, contrast: 1.2 }
            }
          }))
        };
      `,
      priority: 5,
      enabled: true
    });
  }

  public registerHook(hook: HookDefinition) {
    this.hooks.set(hook.id, hook);
  }

  public registerDynamicHook(id: string, scriptContent: string, triggerCondition: string) {
    const hook: HookDefinition = {
      id,
      name: `Dynamic Hook ${id}`,
      triggerCondition,
      scriptContent,
      priority: 1,
      enabled: true
    };
    this.registerHook(hook);
  }

  public getHooksForContext(context: { sectors: any[]; biomes: string[] }): HookDefinition[] {
    // Filtruj hooky podľa kontextu (v reálnej implementácii by sa evalovala triggerCondition)
    const activeHooks: HookDefinition[] = [];
    
    this.hooks.forEach(hook => {
      if (!hook.enabled) return;
      
      // Jednoduchá kontrola či je hook relevantný pre dané biomy
      const isRelevant = context.biomes.some(biome => 
        hook.triggerCondition.includes(biome) || 
        hook.triggerCondition.includes('global')
      );
      
      if (isRelevant || context.biomes.length === 0) {
        activeHooks.push(hook);
      }
    });

    return activeHooks.sort((a, b) => b.priority - a.priority);
  }

  public async executeHook(hook: HookDefinition, context: HookContext): Promise<HookResult> {
    try {
      // Vytvor sandboxed funkciu zo skriptu
      // V produkcii použiť vm2 alebo podobné pre bezpečnosť
      const executeScript = new Function('context', `
        try {
          ${hook.scriptContent}
        } catch (e) {
          console.error('Hook execution error:', e);
          return {};
        }
      `);

      const result = executeScript(context);
      return result || {};
    } catch (e) {
      console.error(`Failed to execute hook ${hook.id}:`, e);
      return {};
    }
  }
}

export default EventHookRegistry;
