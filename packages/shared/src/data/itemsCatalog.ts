// packages/shared/src/data/itemsCatalog.ts

export type ItemCategory = 'WEAPON' | 'TOOL' | 'HARVEST';

export interface CatalogItem {
    key: string;
    name: string;
    description: string;
    category: ItemCategory;
    buyCost: { material: 'CrystalShard' | 'Spores' | 'Essence'; amount: number };
    sellValue: { material: 'CrystalShard' | 'Spores' | 'Essence'; amount: number };
    statBonus?: { damage?: number; harvestMultiplier?: number; durability?: number };
}

export const ITEMS_CATALOG: Record<string, CatalogItem> = {
    AETHER_SABER: {
        key: 'AETHER_SABER',
        name: 'Aether Saber',
        description: 'Warhammer-style humming plasma sword. Grants +2 basic damage bonus.',
        category: 'WEAPON',
        buyCost: { material: 'CrystalShard', amount: 3 },
        sellValue: { material: 'Essence', amount: 30 },
        statBonus: { damage: 2 }
    },
    TOXIC_BLASTER: {
        key: 'TOXIC_BLASTER',
        name: 'Toxic Spore Blaster',
        description: 'Vanguard weapon that shoots compressed fungal projectiles. Grants +3 damage.',
        category: 'WEAPON',
        buyCost: { material: 'Spores', amount: 4 },
        sellValue: { material: 'Essence', amount: 40 },
        statBonus: { damage: 3 }
    },
    GRAVITY_HARVESTER: {
        key: 'GRAVITY_HARVESTER',
        name: 'Gravity Harvester',
        description: 'Aetheric tool designed to extract shards and spores from voxel terrain 50% faster.',
        category: 'TOOL',
        buyCost: { material: 'CrystalShard', amount: 2 },
        sellValue: { material: 'Essence', amount: 20 },
        statBonus: { harvestMultiplier: 1.5 }
    },
    SEMANTIC_WRENCH: {
        key: 'SEMANTIC_WRENCH',
        name: 'Semantic Wrench',
        description: 'Utility tool that clears software lock/throttling status errors.',
        category: 'TOOL',
        buyCost: { material: 'Spores', amount: 2 },
        sellValue: { material: 'Essence', amount: 15 }
    },
    SILICON_ORE: {
        key: 'SILICON_ORE',
        name: 'Silicon Voxel Ore',
        description: 'Harvested voxel node element. Highly sought after by space-farers.',
        category: 'HARVEST',
        buyCost: { material: 'Essence', amount: 25 },
        sellValue: { material: 'Essence', amount: 10 }
    },
    BIO_CELL: {
        key: 'BIO_CELL',
        name: 'Bio-Organic Cell',
        description: 'Fungal matter synthesized from toxic swamps. Highly sellable.',
        category: 'HARVEST',
        buyCost: { material: 'Essence', amount: 30 },
        sellValue: { material: 'Essence', amount: 12 }
    }
};
