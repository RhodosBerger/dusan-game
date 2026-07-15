export interface InstructionEffects {
  thermalThrottling: boolean;
  chronoLock: boolean;
  syntaxMute: boolean;
  threadIsolation: boolean;
}

export class Instruction {
  id: string;
  name: string;
  type: 'ACTION' | 'HELPER';
  
  damage: number;
  armor: number;
  hpChange: number; 
  energyCost: number;
  isUltimate: boolean;

  effects: InstructionEffects;
  helperStats?: any | null; // Placeholder for Helper stats
  cost?: number;
  desc?: string;
  parentTypes?: string[];

  constructor(id: string, name: string, type: 'ACTION' | 'HELPER') {
    this.id = id;
    this.name = name;
    this.type = type;
    this.isUltimate = false;

    this.damage = 1;
    this.armor = 0;
    this.hpChange = 1;
    this.energyCost = 1;

    this.effects = {
      thermalThrottling: false,
      chronoLock: false,
      syntaxMute: false,
      threadIsolation: false
    };

    this.helperStats = null;
  }
}
