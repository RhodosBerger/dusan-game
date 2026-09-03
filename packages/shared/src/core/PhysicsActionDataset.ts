import { CardEffect } from './types';

export interface PhysicsSpecs {
    voltage: number;         // V
    resistance: number;      // R
    current: number;         // I = V / R
    kineticForce: number;    // force in hexes
    powerLoad: number;       // P = V * I (System load)
    displacementType: 'push' | 'pull' | 'none';
    damage: number;          // 1, 2, or 3 (default = 1)
    effect?: CardEffect;
}

export const PHYSICS_ACTION_DATASET: Record<string, Omit<PhysicsSpecs, 'current' | 'powerLoad' | 'damage' | 'effect'> & { damage?: number; effect?: CardEffect }> = {
    // Crystal Clan
    "crystal_laser": { voltage: 4.5, resistance: 1.5, kineticForce: 1, displacementType: 'push', damage: 3, effect: 'slow' },
    "crystal_shield": { voltage: 0.5, resistance: 4.0, kineticForce: 0, displacementType: 'none', damage: 1 },
    "crystal_teleport": { voltage: 2.0, resistance: 2.0, kineticForce: 2, displacementType: 'pull', damage: 1 },
    "crystal_pulse": { voltage: 3.0, resistance: 1.0, kineticForce: 1, displacementType: 'push', damage: 2 },

    // Toxic Clan
    "snake_venom": { voltage: 4.0, resistance: 1.0, kineticForce: 0, displacementType: 'none', damage: 2, effect: 'silence' },
    "acid_rain": { voltage: 5.0, resistance: 2.0, kineticForce: 1, displacementType: 'push', damage: 3, effect: 'slow' },
    "toxic_hook": { voltage: 3.0, resistance: 1.5, kineticForce: 2, displacementType: 'pull', damage: 2, effect: 'root' },
    "mud_slide": { voltage: 2.0, resistance: 2.5, kineticForce: 1, displacementType: 'push', damage: 1 },

    // Druid Clan
    "bear_swipe": { voltage: 5.5, resistance: 1.0, kineticForce: 1, displacementType: 'push', damage: 3, effect: 'disarm' },
    "forest_grow": { voltage: 1.5, resistance: 3.5, kineticForce: 0, displacementType: 'none', damage: 1 },
    "wind_gust": { voltage: 2.5, resistance: 1.5, kineticForce: 2, displacementType: 'push', damage: 1 },
    "nature_heal": { voltage: 1.0, resistance: 3.0, kineticForce: 0, displacementType: 'none', damage: 1 }
};

export function getPhysicsSpecs(cardId: string): PhysicsSpecs {
    // Vyhľadanie alebo vygenerovanie defaultov
    const base = PHYSICS_ACTION_DATASET[cardId] || {
        voltage: cardId.includes('strike') || cardId.includes('attack') || cardId.includes('venom') ? 4.0 : 2.0,
        resistance: cardId.includes('shield') || cardId.includes('grow') || cardId.includes('heal') ? 3.5 : 1.5,
        kineticForce: cardId.includes('gust') || cardId.includes('hook') || cardId.includes('laser') ? 1 : 0,
        displacementType: cardId.includes('hook') || cardId.includes('pull') ? 'pull' : (cardId.includes('gust') || cardId.includes('push') ? 'push' : 'none'),
        damage: 1
    };

    const voltage = base.voltage;
    const resistance = base.resistance || 1.0;
    const current = voltage / resistance;
    const powerLoad = voltage * current;
    const damage = base.damage !== undefined ? base.damage : 1;
    const effect = base.effect;

    return {
        voltage,
        resistance,
        current,
        kineticForce: base.kineticForce,
        powerLoad,
        displacementType: base.displacementType as any,
        damage,
        effect
    };
}
