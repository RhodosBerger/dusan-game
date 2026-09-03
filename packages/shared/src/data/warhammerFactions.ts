// packages/shared/src/data/warhammerFactions.ts

export type GrandAllianceKey = 'AUREAN_ORDER' | 'DISCORDIAN_ABYSS' | 'MORTIS_SYNDICATE' | 'TITAN_HORDE';

export interface GrandAlliance {
    key: GrandAllianceKey;
    name: string;
    description: string;
    tacticalFocus: string;
}

export type ProtagonistCategoryKey = 
    | 'SOVEREIGN_EXEMPLAR'  // Leader
    | 'AETHER_SPELLWEAVER'  // Wizard
    | 'MYRMIDON_SENTINEL'   // Battleline
    | 'GIGANTIC_BEHEMOTH'   // Behemoth
    | 'SWIFT_HARBINGER';    // Outriders / Vanguard

export interface ProtagonistCategory {
    key: ProtagonistCategoryKey;
    name: string;
    description: string;
    baseReach: number;
    spellReach: number;
    movementBase: number;
    diceType: 'D6' | 'D12';
    buildModifierType: 'AVERAGE' | 'DIVIDE' | 'MULTIPLY';
    tactics: string[];
}

export const GRAND_ALLIANCES: Record<GrandAllianceKey, GrandAlliance> = {
    AUREAN_ORDER: {
        key: 'AUREAN_ORDER',
        name: 'Aurean Order',
        description: 'Disciplined defenders of structural logic and mathematical harmony. Inspired by the defensive coordination of Order.',
        tacticalFocus: 'High armor stabilization, current flow protection, and area control.'
    },
    DISCORDIAN_ABYSS: {
        key: 'DISCORDIAN_ABYSS',
        name: 'Discordian Abyss',
        description: 'Erratic agents of entropy who harness high system voltage and unstable current. Inspired by the entropic power of Chaos.',
        tacticalFocus: 'Risk-reward amplification, voltage surges, and self-overloading spikes.'
    },
    MORTIS_SYNDICATE: {
        key: 'MORTIS_SYNDICATE',
        name: 'Mortis Syndicate',
        description: 'Relentless conduits of cold code decay, slowing and freezing dynamic execution flow. Inspired by the control mechanics of Death.',
        tacticalFocus: 'Health draining, speed reduction, and rooted immobilization.'
    },
    TITAN_HORDE: {
        key: 'TITAN_HORDE',
        name: 'Titan Horde',
        description: 'Vast forces that rely on physical kinetic displacement and raw force to crash systems. Inspired by the brute power of Destruction.',
        tacticalFocus: 'Kinetic push/pull distance, high raw damage, and biome destruction.'
    }
};

export const PROTAGONIST_CATEGORIES: Record<ProtagonistCategoryKey, ProtagonistCategory> = {
    SOVEREIGN_EXEMPLAR: {
        key: 'SOVEREIGN_EXEMPLAR',
        name: 'Sovereign Exemplar',
        description: 'Balanced commander of threads. Adapts and commands tactical coordination.',
        baseReach: 1,
        spellReach: 2,
        movementBase: 2,
        diceType: 'D6',
        buildModifierType: 'AVERAGE', // averages player stats with dice roll
        tactics: ['Command Aura', 'Tactical Relocation', 'Defensive Cover']
    },
    AETHER_SPELLWEAVER: {
        key: 'AETHER_SPELLWEAVER',
        name: 'Aether Spellweaver',
        description: 'Mage protagonist with an expanded range, controlling the battlefield from a distance.',
        baseReach: 1,
        spellReach: 4, // Larger reach!
        movementBase: 1,
        diceType: 'D12', // Wizard rolls a D12!
        buildModifierType: 'MULTIPLY', // multiplies/amplifies current/voltage
        tactics: ['Far-Reach Casting', 'Voltage Redirection', 'Aetheric Storm']
    },
    MYRMIDON_SENTINEL: {
        key: 'MYRMIDON_SENTINEL',
        name: 'Myrmidon Sentinel',
        description: 'Armored core infantry unit designed to absorb incoming strikes.',
        baseReach: 1,
        spellReach: 1,
        movementBase: 1,
        diceType: 'D6',
        buildModifierType: 'AVERAGE',
        tactics: ['Shield Wall', 'Armor Overcharge', 'Ground Hold']
    },
    GIGANTIC_BEHEMOTH: {
        key: 'GIGANTIC_BEHEMOTH',
        name: 'Gigantic Behemoth',
        description: 'Massive heavy force. Slow but hits with absolute physical weight.',
        baseReach: 2, // Melee reach is 2
        spellReach: 1,
        movementBase: 1,
        diceType: 'D12',
        buildModifierType: 'DIVIDE', // high risk: divides/shares damage with target hex or divides/filters incoming resistance
        tactics: ['Hex Smash', 'Earth Shake', 'Shatter Armor']
    },
    SWIFT_HARBINGER: {
        key: 'SWIFT_HARBINGER',
        name: 'Swift Harbinger',
        description: 'Fast skirmisher that exploits open hexes and transitions biomes rapidly.',
        baseReach: 1,
        spellReach: 1,
        movementBase: 3, // Fast movement
        diceType: 'D6',
        buildModifierType: 'AVERAGE',
        tactics: ['Biome Skimming', 'Hit and Run', 'Scout Ahead']
    }
};
