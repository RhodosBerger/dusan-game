import templatesData from '../data/scenarioTemplates.json';

export interface ScenarioTemplate {
  id: string;
  name: string;
  difficulty: number;
  description: string;
  nodeMappings: Array<{
    nodeId: string;
    heroClass: string;
    buildType: string;
    health: number;
    armor: number;
    coordinates: [number, number];
  }>;
  hazardFactor: number;
  frictionFactor: number;
  npcSpawnDivisor: number;
}

export class SovereignScenarioInterpreter {
  public getTemplates(): ScenarioTemplate[] {
    return templatesData.scenarios as ScenarioTemplate[];
  }

  public applyScenario(engine: any, scenarioId: string): void {
    const template = (templatesData.scenarios as ScenarioTemplate[]).find(s => s.id === scenarioId);
    if (!template) return;

    // 1. Re-initialize map blocks based on scenario difficulty & factors
    engine.map.chunks.forEach((chunk: any) => {
      chunk.blocks.forEach((block: any) => {
        // Apply hazard & friction multipliers from dataset
        block.hazardIndex = template.hazardFactor;
        block.friction = template.frictionFactor;

        // Random walkability patterns inspired by difficulty level
        const isStartBase = (chunk.id === 0 && block.id === 0) || (chunk.id === 8 && block.id === 6) || (chunk.id === 5 && block.id === 3);
        if (chunk.id !== 0 && !isStartBase) {
          const baseWalkableChance = 0.95 - (template.difficulty * 0.05);
          block.walkable = Math.random() < baseWalkableChance;
          if (!block.walkable) {
            block.color = '#1f2937';
          }
        }
      });
    });

    // 2. Clear existing NPC threads and spawn new ones using the divisor check (fractal spawn rule)
    engine.threads = engine.threads.filter((t: any) => t.type === 'PLAYER');

    engine.map.chunks.forEach((chunk: any) => {
      if (chunk.id === 0) return; // Keep Player's chunk safe
      chunk.blocks.forEach((block: any) => {
        if (!block.walkable || block.threadId !== null) return;
        const fractalCheck = (chunk.id * 7 + block.id) % template.npcSpawnDivisor === 0;
        if (fractalCheck) {
          // Spawn a tactical NPC threat node
          const npcId = `npc_threat_${chunk.id}_${block.id}`;
          const npcName = `Tactical Droid ${chunk.id}-${block.id}`;
          
          if (engine.spawnThread) {
            const npcType = 'NPC';
            const health = template.difficulty * 3;
            const armor = template.difficulty - 1;
            
            // Construct thread
            const ThreadClass = engine.threads[0]?.constructor;
            if (ThreadClass) {
              const threatNode = new ThreadClass(npcId, npcType);
              threatNode.name = npcName;
              threatNode.health = health;
              threatNode.armor = armor;
              engine.spawnThread(threatNode, chunk.id, block.id);
            }
          }
        }
      });
    });

    // 3. Map hero configurations & custom build values
    template.nodeMappings.forEach(mapping => {
      const thread = engine.threads.find((t: any) => t.id === mapping.nodeId);
      if (thread) {
        thread.health = mapping.health;
        thread.armor = mapping.armor;
        thread.buildClass = mapping.buildType;
      }
    });
  }
}
