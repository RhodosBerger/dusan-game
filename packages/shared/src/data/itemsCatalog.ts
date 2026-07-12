// packages/shared/src/data/itemsCatalog.ts

export type ItemCategory = 'WEAPON' | 'TOOL' | 'HARVEST' | 'MAGIC';

export interface CatalogItem {
    key: string;
    name: string;
    description: string;
    category: ItemCategory;
    buyCost: { material: 'CrystalShard' | 'Spores' | 'Essence'; amount: number };
    sellValue: { material: 'CrystalShard' | 'Spores' | 'Essence'; amount: number };
    statBonus?: { damage?: number; harvestMultiplier?: number; durability?: number; spellReach?: number };
    heroClass?: string;
}

export const ITEMS_CATALOG: Record<string, CatalogItem> = {
    AETHER_SABER: {
        "key": "AETHER_SABER",
        "name": "Aether Saber",
        "description": "Warhammer-style humming plasma sword. Grants +2 basic damage bonus.",
        "category": "WEAPON",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 3
        },
        "sellValue": {
                "material": "Essence",
                "amount": 30
        },
        "statBonus": {
                "damage": 2
        }
},
    TOXIC_BLASTER: {
        "key": "TOXIC_BLASTER",
        "name": "Toxic Spore Blaster",
        "description": "Vanguard weapon that shoots compressed fungal projectiles. Grants +3 damage.",
        "category": "WEAPON",
        "buyCost": {
                "material": "Spores",
                "amount": 4
        },
        "sellValue": {
                "material": "Essence",
                "amount": 40
        },
        "statBonus": {
                "damage": 3
        }
},
    GRAVITY_HARVESTER: {
        "key": "GRAVITY_HARVESTER",
        "name": "Gravity Harvester",
        "description": "Aetheric tool designed to extract shards and spores from voxel terrain 50% faster.",
        "category": "TOOL",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 2
        },
        "sellValue": {
                "material": "Essence",
                "amount": 20
        },
        "statBonus": {
                "harvestMultiplier": 1.5
        }
},
    SEMANTIC_WRENCH: {
        "key": "SEMANTIC_WRENCH",
        "name": "Semantic Wrench",
        "description": "Utility tool that clears software lock/throttling status errors.",
        "category": "TOOL",
        "buyCost": {
                "material": "Spores",
                "amount": 2
        },
        "sellValue": {
                "material": "Essence",
                "amount": 15
        }
},
    SILICON_ORE: {
        "key": "SILICON_ORE",
        "name": "Silicon Voxel Ore",
        "description": "Harvested voxel node element. Highly sought after by space-farers.",
        "category": "HARVEST",
        "buyCost": {
                "material": "Essence",
                "amount": 25
        },
        "sellValue": {
                "material": "Essence",
                "amount": 10
        }
},
    BIO_CELL: {
        "key": "BIO_CELL",
        "name": "Bio-Organic Cell",
        "description": "Fungal matter synthesized from toxic swamps. Highly sellable.",
        "category": "HARVEST",
        "buyCost": {
                "material": "Essence",
                "amount": 30
        },
        "sellValue": {
                "material": "Essence",
                "amount": 12
        }
},
    AETHER_STAFF: {
        "key": "AETHER_STAFF",
        "name": "Aetheric Staff",
        "description": "Heavy channeling staff that amplifies spell reach by +1 and basic damage by +2.",
        "category": "MAGIC",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 3
        },
        "sellValue": {
                "material": "Essence",
                "amount": 30
        },
        "statBonus": {
                "damage": 2,
                "spellReach": 1
        }
},
    CRYSTAL_GRIMOIRE: {
        "key": "CRYSTAL_GRIMOIRE",
        "name": "Crystal Grimoire",
        "description": "Spellbook bound in crystal shards. Increases spell reach by +2.",
        "category": "MAGIC",
        "buyCost": {
                "material": "Essence",
                "amount": 4
        },
        "sellValue": {
                "material": "Essence",
                "amount": 45
        },
        "statBonus": {
                "spellReach": 2
        }
},
    EXEMPLAR_CROWN: {
        "key": "EXEMPLAR_CROWN",
        "name": "Crown of the Sovereign",
        "description": "A glowing crown that boosts base damage by +2.",
        "category": "MAGIC",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 3
        },
        "sellValue": {
                "material": "Essence",
                "amount": 30
        },
        "statBonus": {
                "damage": 2,
                "spellReach": 0
        },
        "heroClass": "SOVEREIGN_EXEMPLAR"
},
    SPELLWEAVER_AMULET: {
        "key": "SPELLWEAVER_AMULET",
        "name": "Amulet of the Spellweaver",
        "description": "An ancient aetheric spellweaver amulet boosting spell reach by +2.",
        "category": "MAGIC",
        "buyCost": {
                "material": "Essence",
                "amount": 4
        },
        "sellValue": {
                "material": "Essence",
                "amount": 45
        },
        "statBonus": {
                "damage": 0,
                "spellReach": 2
        },
        "heroClass": "AETHER_SPELLWEAVER"
},
    SENTINEL_SHIELD: {
        "key": "SENTINEL_SHIELD",
        "name": "Myrmidon Sentinel Shield",
        "description": "A heavy defensive shield boosting base damage by +1.",
        "category": "MAGIC",
        "buyCost": {
                "material": "Spores",
                "amount": 3
        },
        "sellValue": {
                "material": "Essence",
                "amount": 25
        },
        "statBonus": {
                "damage": 1,
                "spellReach": 0
        },
        "heroClass": "MYRMIDON_SENTINEL"
},
    BEHEMOTH_GAUNTLET: {
        "key": "BEHEMOTH_GAUNTLET",
        "name": "Gauntlet of the Behemoth",
        "description": "A colossal kinetic gauntlet boosting base damage by +3.",
        "category": "MAGIC",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 4
        },
        "sellValue": {
                "material": "Essence",
                "amount": 40
        },
        "statBonus": {
                "damage": 3,
                "spellReach": 0
        },
        "heroClass": "GIGANTIC_BEHEMOTH"
},
    HARBINGER_BOOTS: {
        "key": "HARBINGER_BOOTS",
        "name": "Boots of the Swift Harbinger",
        "description": "Light speed-warping boots boosting base damage by +1 and spell reach by +1.",
        "category": "MAGIC",
        "buyCost": {
                "material": "Spores",
                "amount": 3
        },
        "sellValue": {
                "material": "Essence",
                "amount": 30
        },
        "statBonus": {
                "damage": 1,
                "spellReach": 1
        },
        "heroClass": "SWIFT_HARBINGER"
},
    AETHERIC_MACE: {
        "key": "AETHERIC_MACE",
        "name": "Aetheric Mace",
        "description": "A high-quality weapon item of aetheric origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "Essence",
                "amount": 36
        },
        "sellValue": {
                "material": "Essence",
                "amount": 14
        },
        "statBonus": {
                "damage": 2
        }
},
    QUANTUM_SABER: {
        "key": "QUANTUM_SABER",
        "name": "Quantum Saber",
        "description": "A high-quality weapon item of quantum origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "Spores",
                "amount": 4
        },
        "sellValue": {
                "material": "Essence",
                "amount": 40
        },
        "statBonus": {
                "damage": 3
        }
},
    SOVEREIGN_BLASTER: {
        "key": "SOVEREIGN_BLASTER",
        "name": "Sovereign Blaster",
        "description": "A high-quality weapon item of sovereign origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "Essence",
                "amount": 34
        },
        "sellValue": {
                "material": "Essence",
                "amount": 13
        },
        "statBonus": {
                "damage": 3
        }
},
    SENTINEL_BLASTER: {
        "key": "SENTINEL_BLASTER",
        "name": "Sentinel Blaster",
        "description": "A high-quality weapon item of sentinel origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "Spores",
                "amount": 3
        },
        "sellValue": {
                "material": "Essence",
                "amount": 30
        },
        "statBonus": {
                "damage": 1
        }
},
    QUANTUM_RIFLE: {
        "key": "QUANTUM_RIFLE",
        "name": "Quantum Rifle",
        "description": "A high-quality weapon item of quantum origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 4
        },
        "sellValue": {
                "material": "Essence",
                "amount": 40
        },
        "statBonus": {
                "damage": 3
        }
},
    LUNAR_DAGGER: {
        "key": "LUNAR_DAGGER",
        "name": "Lunar Dagger",
        "description": "A high-quality weapon item of lunar origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 6
        },
        "sellValue": {
                "material": "Essence",
                "amount": 60
        },
        "statBonus": {
                "damage": 2
        }
},
    VOLCANIC_BLADE: {
        "key": "VOLCANIC_BLADE",
        "name": "Volcanic Blade",
        "description": "A high-quality weapon item of volcanic origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "Essence",
                "amount": 12
        },
        "sellValue": {
                "material": "Essence",
                "amount": 4
        },
        "statBonus": {
                "damage": 2
        }
},
    VECTOR_MACE: {
        "key": "VECTOR_MACE",
        "name": "Vector Mace",
        "description": "A high-quality weapon item of vector origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 5
        },
        "sellValue": {
                "material": "Essence",
                "amount": 50
        },
        "statBonus": {
                "damage": 2
        }
},
    TITAN_DAGGER: {
        "key": "TITAN_DAGGER",
        "name": "Titan Dagger",
        "description": "A high-quality weapon item of titan origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "Essence",
                "amount": 39
        },
        "sellValue": {
                "material": "Essence",
                "amount": 15
        },
        "statBonus": {
                "damage": 3
        }
},
    CYBERNETIC_BLADE: {
        "key": "CYBERNETIC_BLADE",
        "name": "Cybernetic Blade",
        "description": "A high-quality weapon item of cybernetic origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "Essence",
                "amount": 50
        },
        "sellValue": {
                "material": "Essence",
                "amount": 20
        },
        "statBonus": {
                "damage": 1
        }
},
    VECTOR_SPEAR: {
        "key": "VECTOR_SPEAR",
        "name": "Vector Spear",
        "description": "A high-quality weapon item of vector origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "Spores",
                "amount": 4
        },
        "sellValue": {
                "material": "Essence",
                "amount": 40
        },
        "statBonus": {
                "damage": 1
        }
},
    MAGNETIC_BLADE: {
        "key": "MAGNETIC_BLADE",
        "name": "Magnetic Blade",
        "description": "A high-quality weapon item of magnetic origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 5
        },
        "sellValue": {
                "material": "Essence",
                "amount": 50
        },
        "statBonus": {
                "damage": 1
        }
},
    FARADAY_SABER: {
        "key": "FARADAY_SABER",
        "name": "Faraday Saber",
        "description": "A high-quality weapon item of faraday origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "Essence",
                "amount": 38
        },
        "sellValue": {
                "material": "Essence",
                "amount": 15
        },
        "statBonus": {
                "damage": 3
        }
},
    FARADAY_DAGGER: {
        "key": "FARADAY_DAGGER",
        "name": "Faraday Dagger",
        "description": "A high-quality weapon item of faraday origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "Spores",
                "amount": 3
        },
        "sellValue": {
                "material": "Essence",
                "amount": 30
        },
        "statBonus": {
                "damage": 2
        }
},
    CYBERNETIC_MACE: {
        "key": "CYBERNETIC_MACE",
        "name": "Cybernetic Mace",
        "description": "A high-quality weapon item of cybernetic origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "Essence",
                "amount": 20
        },
        "sellValue": {
                "material": "Essence",
                "amount": 8
        },
        "statBonus": {
                "damage": 1
        }
},
    MYRMIDON_SABER: {
        "key": "MYRMIDON_SABER",
        "name": "Myrmidon Saber",
        "description": "A high-quality weapon item of myrmidon origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 3
        },
        "sellValue": {
                "material": "Essence",
                "amount": 30
        },
        "statBonus": {
                "damage": 3
        }
},
    FUNGAL_WARHAMMER: {
        "key": "FUNGAL_WARHAMMER",
        "name": "Fungal Warhammer",
        "description": "A high-quality weapon item of fungal origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "Essence",
                "amount": 10
        },
        "sellValue": {
                "material": "Essence",
                "amount": 4
        },
        "statBonus": {
                "damage": 2
        }
},
    SOLAR_MACE: {
        "key": "SOLAR_MACE",
        "name": "Solar Mace",
        "description": "A high-quality weapon item of solar origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "Spores",
                "amount": 6
        },
        "sellValue": {
                "material": "Essence",
                "amount": 60
        },
        "statBonus": {
                "damage": 2
        }
},
    GLACIAL_SABER: {
        "key": "GLACIAL_SABER",
        "name": "Glacial Saber",
        "description": "A high-quality weapon item of glacial origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "Spores",
                "amount": 2
        },
        "sellValue": {
                "material": "Essence",
                "amount": 20
        },
        "statBonus": {
                "damage": 1
        }
},
    MYRMIDON_WARHAMMER: {
        "key": "MYRMIDON_WARHAMMER",
        "name": "Myrmidon Warhammer",
        "description": "A high-quality weapon item of myrmidon origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "Spores",
                "amount": 5
        },
        "sellValue": {
                "material": "Essence",
                "amount": 50
        },
        "statBonus": {
                "damage": 2
        }
},
    AUREAN_RIFLE: {
        "key": "AUREAN_RIFLE",
        "name": "Aurean Rifle",
        "description": "A high-quality weapon item of aurean origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "Spores",
                "amount": 5
        },
        "sellValue": {
                "material": "Essence",
                "amount": 50
        },
        "statBonus": {
                "damage": 3
        }
},
    SOLAR_LAUNCHER: {
        "key": "SOLAR_LAUNCHER",
        "name": "Solar Launcher",
        "description": "A high-quality weapon item of solar origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 5
        },
        "sellValue": {
                "material": "Essence",
                "amount": 50
        },
        "statBonus": {
                "damage": 1
        }
},
    CHRONO_WARHAMMER: {
        "key": "CHRONO_WARHAMMER",
        "name": "Chrono Warhammer",
        "description": "A high-quality weapon item of chrono origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "Spores",
                "amount": 6
        },
        "sellValue": {
                "material": "Essence",
                "amount": 60
        },
        "statBonus": {
                "damage": 2
        }
},
    QUANTUM_DAGGER: {
        "key": "QUANTUM_DAGGER",
        "name": "Quantum Dagger",
        "description": "A high-quality weapon item of quantum origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 6
        },
        "sellValue": {
                "material": "Essence",
                "amount": 60
        },
        "statBonus": {
                "damage": 3
        }
},
    FARADAY_LAUNCHER: {
        "key": "FARADAY_LAUNCHER",
        "name": "Faraday Launcher",
        "description": "A high-quality weapon item of faraday origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "Spores",
                "amount": 2
        },
        "sellValue": {
                "material": "Essence",
                "amount": 20
        },
        "statBonus": {
                "damage": 1
        }
},
    HYPER_LAUNCHER: {
        "key": "HYPER_LAUNCHER",
        "name": "Hyper Launcher",
        "description": "A high-quality weapon item of hyper origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 6
        },
        "sellValue": {
                "material": "Essence",
                "amount": 60
        },
        "statBonus": {
                "damage": 2
        }
},
    FUNGAL_RIFLE: {
        "key": "FUNGAL_RIFLE",
        "name": "Fungal Rifle",
        "description": "A high-quality weapon item of fungal origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 4
        },
        "sellValue": {
                "material": "Essence",
                "amount": 40
        },
        "statBonus": {
                "damage": 2
        }
},
    FUNGAL_SPEAR: {
        "key": "FUNGAL_SPEAR",
        "name": "Fungal Spear",
        "description": "A high-quality weapon item of fungal origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 6
        },
        "sellValue": {
                "material": "Essence",
                "amount": 60
        },
        "statBonus": {
                "damage": 1
        }
},
    SOLAR_SABER: {
        "key": "SOLAR_SABER",
        "name": "Solar Saber",
        "description": "A high-quality weapon item of solar origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "Essence",
                "amount": 57
        },
        "sellValue": {
                "material": "Essence",
                "amount": 22
        },
        "statBonus": {
                "damage": 2
        }
},
    LUNAR_SABER: {
        "key": "LUNAR_SABER",
        "name": "Lunar Saber",
        "description": "A high-quality weapon item of lunar origin. Ideal for transactions and trade.",
        "category": "WEAPON",
        "buyCost": {
                "material": "Spores",
                "amount": 6
        },
        "sellValue": {
                "material": "Essence",
                "amount": 60
        },
        "statBonus": {
                "damage": 3
        }
},
    AETHERIC_WELDER: {
        "key": "AETHERIC_WELDER",
        "name": "Aetheric Welder",
        "description": "A high-quality tool item of aetheric origin. Ideal for transactions and trade.",
        "category": "TOOL",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 3
        },
        "sellValue": {
                "material": "Essence",
                "amount": 30
        },
        "statBonus": {
                "harvestMultiplier": 1.1
        }
},
    NANO_DRILL: {
        "key": "NANO_DRILL",
        "name": "Nano Drill",
        "description": "A high-quality tool item of nano origin. Ideal for transactions and trade.",
        "category": "TOOL",
        "buyCost": {
                "material": "Essence",
                "amount": 44
        },
        "sellValue": {
                "material": "Essence",
                "amount": 17
        },
        "statBonus": {
                "harvestMultiplier": 1.2
        }
},
    VOID_HARVESTER: {
        "key": "VOID_HARVESTER",
        "name": "Void Harvester",
        "description": "A high-quality tool item of void origin. Ideal for transactions and trade.",
        "category": "TOOL",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 6
        },
        "sellValue": {
                "material": "Essence",
                "amount": 60
        },
        "statBonus": {
                "harvestMultiplier": 1.1
        }
},
    BIO_WELDER: {
        "key": "BIO_WELDER",
        "name": "Bio Welder",
        "description": "A high-quality tool item of bio origin. Ideal for transactions and trade.",
        "category": "TOOL",
        "buyCost": {
                "material": "Spores",
                "amount": 6
        },
        "sellValue": {
                "material": "Essence",
                "amount": 60
        },
        "statBonus": {
                "harvestMultiplier": 1.1
        }
},
    MYRMIDON_WELDER: {
        "key": "MYRMIDON_WELDER",
        "name": "Myrmidon Welder",
        "description": "A high-quality tool item of myrmidon origin. Ideal for transactions and trade.",
        "category": "TOOL",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 5
        },
        "sellValue": {
                "material": "Essence",
                "amount": 50
        },
        "statBonus": {
                "harvestMultiplier": 1.8
        }
},
    AETHERIC_CUTTER: {
        "key": "AETHERIC_CUTTER",
        "name": "Aetheric Cutter",
        "description": "A high-quality tool item of aetheric origin. Ideal for transactions and trade.",
        "category": "TOOL",
        "buyCost": {
                "material": "Spores",
                "amount": 5
        },
        "sellValue": {
                "material": "Essence",
                "amount": 50
        },
        "statBonus": {
                "harvestMultiplier": 1.7
        }
},
    SENTINEL_EXTRACTOR: {
        "key": "SENTINEL_EXTRACTOR",
        "name": "Sentinel Extractor",
        "description": "A high-quality tool item of sentinel origin. Ideal for transactions and trade.",
        "category": "TOOL",
        "buyCost": {
                "material": "Spores",
                "amount": 6
        },
        "sellValue": {
                "material": "Essence",
                "amount": 60
        },
        "statBonus": {
                "harvestMultiplier": 1.9
        }
},
    VOLCANIC_DRILL: {
        "key": "VOLCANIC_DRILL",
        "name": "Volcanic Drill",
        "description": "A high-quality tool item of volcanic origin. Ideal for transactions and trade.",
        "category": "TOOL",
        "buyCost": {
                "material": "Spores",
                "amount": 2
        },
        "sellValue": {
                "material": "Essence",
                "amount": 20
        },
        "statBonus": {
                "harvestMultiplier": 2
        }
},
    DECAYED_WRENCH: {
        "key": "DECAYED_WRENCH",
        "name": "Decayed Wrench",
        "description": "A high-quality tool item of decayed origin. Ideal for transactions and trade.",
        "category": "TOOL",
        "buyCost": {
                "material": "Essence",
                "amount": 28
        },
        "sellValue": {
                "material": "Essence",
                "amount": 11
        },
        "statBonus": {
                "harvestMultiplier": 1.4
        }
},
    VOID_DECODER: {
        "key": "VOID_DECODER",
        "name": "Void Decoder",
        "description": "A high-quality tool item of void origin. Ideal for transactions and trade.",
        "category": "TOOL",
        "buyCost": {
                "material": "Essence",
                "amount": 39
        },
        "sellValue": {
                "material": "Essence",
                "amount": 15
        },
        "statBonus": {
                "harvestMultiplier": 2
        }
},
    SOLAR_EXTRACTOR: {
        "key": "SOLAR_EXTRACTOR",
        "name": "Solar Extractor",
        "description": "A high-quality tool item of solar origin. Ideal for transactions and trade.",
        "category": "TOOL",
        "buyCost": {
                "material": "Spores",
                "amount": 3
        },
        "sellValue": {
                "material": "Essence",
                "amount": 30
        },
        "statBonus": {
                "harvestMultiplier": 1.9
        }
},
    QUANTUM_WRENCH: {
        "key": "QUANTUM_WRENCH",
        "name": "Quantum Wrench",
        "description": "A high-quality tool item of quantum origin. Ideal for transactions and trade.",
        "category": "TOOL",
        "buyCost": {
                "material": "Essence",
                "amount": 41
        },
        "sellValue": {
                "material": "Essence",
                "amount": 16
        },
        "statBonus": {
                "harvestMultiplier": 1.3
        }
},
    PLASMA_WELDER: {
        "key": "PLASMA_WELDER",
        "name": "Plasma Welder",
        "description": "A high-quality tool item of plasma origin. Ideal for transactions and trade.",
        "category": "TOOL",
        "buyCost": {
                "material": "Spores",
                "amount": 3
        },
        "sellValue": {
                "material": "Essence",
                "amount": 30
        },
        "statBonus": {
                "harvestMultiplier": 1.7
        }
},
    LUNAR_DRILL: {
        "key": "LUNAR_DRILL",
        "name": "Lunar Drill",
        "description": "A high-quality tool item of lunar origin. Ideal for transactions and trade.",
        "category": "TOOL",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 5
        },
        "sellValue": {
                "material": "Essence",
                "amount": 50
        },
        "statBonus": {
                "harvestMultiplier": 1.3
        }
},
    CHRONO_DRILL: {
        "key": "CHRONO_DRILL",
        "name": "Chrono Drill",
        "description": "A high-quality tool item of chrono origin. Ideal for transactions and trade.",
        "category": "TOOL",
        "buyCost": {
                "material": "Essence",
                "amount": 36
        },
        "sellValue": {
                "material": "Essence",
                "amount": 14
        },
        "statBonus": {
                "harvestMultiplier": 1
        }
},
    MYRMIDON_CUTTER: {
        "key": "MYRMIDON_CUTTER",
        "name": "Myrmidon Cutter",
        "description": "A high-quality tool item of myrmidon origin. Ideal for transactions and trade.",
        "category": "TOOL",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 6
        },
        "sellValue": {
                "material": "Essence",
                "amount": 60
        },
        "statBonus": {
                "harvestMultiplier": 1.2
        }
},
    TITAN_DRILL: {
        "key": "TITAN_DRILL",
        "name": "Titan Drill",
        "description": "A high-quality tool item of titan origin. Ideal for transactions and trade.",
        "category": "TOOL",
        "buyCost": {
                "material": "Spores",
                "amount": 4
        },
        "sellValue": {
                "material": "Essence",
                "amount": 40
        },
        "statBonus": {
                "harvestMultiplier": 1.3
        }
},
    SOVEREIGN_WRENCH: {
        "key": "SOVEREIGN_WRENCH",
        "name": "Sovereign Wrench",
        "description": "A high-quality tool item of sovereign origin. Ideal for transactions and trade.",
        "category": "TOOL",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 5
        },
        "sellValue": {
                "material": "Essence",
                "amount": 50
        },
        "statBonus": {
                "harvestMultiplier": 1.5
        }
},
    VOID_WELDER: {
        "key": "VOID_WELDER",
        "name": "Void Welder",
        "description": "A high-quality tool item of void origin. Ideal for transactions and trade.",
        "category": "TOOL",
        "buyCost": {
                "material": "Spores",
                "amount": 6
        },
        "sellValue": {
                "material": "Essence",
                "amount": 60
        },
        "statBonus": {
                "harvestMultiplier": 2
        }
},
    CHRONO_WRENCH: {
        "key": "CHRONO_WRENCH",
        "name": "Chrono Wrench",
        "description": "A high-quality tool item of chrono origin. Ideal for transactions and trade.",
        "category": "TOOL",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 2
        },
        "sellValue": {
                "material": "Essence",
                "amount": 20
        },
        "statBonus": {
                "harvestMultiplier": 1.2
        }
},
    PLASMA_DECODER: {
        "key": "PLASMA_DECODER",
        "name": "Plasma Decoder",
        "description": "A high-quality tool item of plasma origin. Ideal for transactions and trade.",
        "category": "TOOL",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 3
        },
        "sellValue": {
                "material": "Essence",
                "amount": 30
        },
        "statBonus": {
                "harvestMultiplier": 1.2
        }
},
    LUNAR_CRYSTAL: {
        "key": "LUNAR_CRYSTAL",
        "name": "Lunar Crystal",
        "description": "A high-quality harvest item of lunar origin. Ideal for transactions and trade.",
        "category": "HARVEST",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 4
        },
        "sellValue": {
                "material": "Essence",
                "amount": 40
        }
},
    CHRONO_CORE: {
        "key": "CHRONO_CORE",
        "name": "Chrono Core",
        "description": "A high-quality harvest item of chrono origin. Ideal for transactions and trade.",
        "category": "HARVEST",
        "buyCost": {
                "material": "Essence",
                "amount": 35
        },
        "sellValue": {
                "material": "Essence",
                "amount": 14
        }
},
    DECAYED_CRYSTAL: {
        "key": "DECAYED_CRYSTAL",
        "name": "Decayed Crystal",
        "description": "A high-quality harvest item of decayed origin. Ideal for transactions and trade.",
        "category": "HARVEST",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 6
        },
        "sellValue": {
                "material": "Essence",
                "amount": 60
        }
},
    TITAN_FUEL: {
        "key": "TITAN_FUEL",
        "name": "Titan Fuel",
        "description": "A high-quality harvest item of titan origin. Ideal for transactions and trade.",
        "category": "HARVEST",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 3
        },
        "sellValue": {
                "material": "Essence",
                "amount": 30
        }
},
    BIO_ORE: {
        "key": "BIO_ORE",
        "name": "Bio Ore",
        "description": "A high-quality harvest item of bio origin. Ideal for transactions and trade.",
        "category": "HARVEST",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 6
        },
        "sellValue": {
                "material": "Essence",
                "amount": 60
        }
},
    MAGNETIC_CORE: {
        "key": "MAGNETIC_CORE",
        "name": "Magnetic Core",
        "description": "A high-quality harvest item of magnetic origin. Ideal for transactions and trade.",
        "category": "HARVEST",
        "buyCost": {
                "material": "Essence",
                "amount": 55
        },
        "sellValue": {
                "material": "Essence",
                "amount": 22
        }
},
    FUNGAL_FUEL: {
        "key": "FUNGAL_FUEL",
        "name": "Fungal Fuel",
        "description": "A high-quality harvest item of fungal origin. Ideal for transactions and trade.",
        "category": "HARVEST",
        "buyCost": {
                "material": "Spores",
                "amount": 5
        },
        "sellValue": {
                "material": "Essence",
                "amount": 50
        }
},
    FARADAY_ALLOY: {
        "key": "FARADAY_ALLOY",
        "name": "Faraday Alloy",
        "description": "A high-quality harvest item of faraday origin. Ideal for transactions and trade.",
        "category": "HARVEST",
        "buyCost": {
                "material": "Essence",
                "amount": 16
        },
        "sellValue": {
                "material": "Essence",
                "amount": 6
        }
},
    SOLAR_SPORE: {
        "key": "SOLAR_SPORE",
        "name": "Solar Spore",
        "description": "A high-quality harvest item of solar origin. Ideal for transactions and trade.",
        "category": "HARVEST",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 4
        },
        "sellValue": {
                "material": "Essence",
                "amount": 40
        }
},
    AETHERIC_CRYSTAL: {
        "key": "AETHERIC_CRYSTAL",
        "name": "Aetheric Crystal",
        "description": "A high-quality harvest item of aetheric origin. Ideal for transactions and trade.",
        "category": "HARVEST",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 5
        },
        "sellValue": {
                "material": "Essence",
                "amount": 50
        }
},
    VECTOR_CORE: {
        "key": "VECTOR_CORE",
        "name": "Vector Core",
        "description": "A high-quality harvest item of vector origin. Ideal for transactions and trade.",
        "category": "HARVEST",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 5
        },
        "sellValue": {
                "material": "Essence",
                "amount": 50
        }
},
    AUREAN_DUST: {
        "key": "AUREAN_DUST",
        "name": "Aurean Dust",
        "description": "A high-quality harvest item of aurean origin. Ideal for transactions and trade.",
        "category": "HARVEST",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 4
        },
        "sellValue": {
                "material": "Essence",
                "amount": 40
        }
},
    CHRONO_CELL: {
        "key": "CHRONO_CELL",
        "name": "Chrono Cell",
        "description": "A high-quality harvest item of chrono origin. Ideal for transactions and trade.",
        "category": "HARVEST",
        "buyCost": {
                "material": "Essence",
                "amount": 25
        },
        "sellValue": {
                "material": "Essence",
                "amount": 10
        }
},
    SOLAR_ALLOY: {
        "key": "SOLAR_ALLOY",
        "name": "Solar Alloy",
        "description": "A high-quality harvest item of solar origin. Ideal for transactions and trade.",
        "category": "HARVEST",
        "buyCost": {
                "material": "Spores",
                "amount": 3
        },
        "sellValue": {
                "material": "Essence",
                "amount": 30
        }
},
    GLACIAL_CRYSTAL: {
        "key": "GLACIAL_CRYSTAL",
        "name": "Glacial Crystal",
        "description": "A high-quality harvest item of glacial origin. Ideal for transactions and trade.",
        "category": "HARVEST",
        "buyCost": {
                "material": "Essence",
                "amount": 26
        },
        "sellValue": {
                "material": "Essence",
                "amount": 10
        }
},
    UNSTABLE_SHARD: {
        "key": "UNSTABLE_SHARD",
        "name": "Unstable Shard",
        "description": "A high-quality harvest item of unstable origin. Ideal for transactions and trade.",
        "category": "HARVEST",
        "buyCost": {
                "material": "Spores",
                "amount": 4
        },
        "sellValue": {
                "material": "Essence",
                "amount": 40
        }
},
    VOLCANIC_FUEL: {
        "key": "VOLCANIC_FUEL",
        "name": "Volcanic Fuel",
        "description": "A high-quality harvest item of volcanic origin. Ideal for transactions and trade.",
        "category": "HARVEST",
        "buyCost": {
                "material": "Essence",
                "amount": 26
        },
        "sellValue": {
                "material": "Essence",
                "amount": 10
        }
},
    SOVEREIGN_AEGIS: {
        "key": "SOVEREIGN_AEGIS",
        "name": "Sovereign Aegis",
        "description": "A high-quality magic item of sovereign origin. Ideal for transactions and trade.",
        "category": "MAGIC",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 3
        },
        "sellValue": {
                "material": "Essence",
                "amount": 30
        },
        "statBonus": {
                "spellReach": 1,
                "damage": 1
        }
},
    NANO_GRIMOIRE: {
        "key": "NANO_GRIMOIRE",
        "name": "Nano Grimoire",
        "description": "A high-quality magic item of nano origin. Ideal for transactions and trade.",
        "category": "MAGIC",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 6
        },
        "sellValue": {
                "material": "Essence",
                "amount": 60
        },
        "statBonus": {
                "spellReach": 1
        }
},
    MYRMIDON_SCROLL: {
        "key": "MYRMIDON_SCROLL",
        "name": "Myrmidon Scroll",
        "description": "A high-quality magic item of myrmidon origin. Ideal for transactions and trade.",
        "category": "MAGIC",
        "buyCost": {
                "material": "Spores",
                "amount": 2
        },
        "sellValue": {
                "material": "Essence",
                "amount": 20
        },
        "statBonus": {
                "spellReach": 2,
                "damage": 1
        }
},
    CHRONO_RING: {
        "key": "CHRONO_RING",
        "name": "Chrono Ring",
        "description": "A high-quality magic item of chrono origin. Ideal for transactions and trade.",
        "category": "MAGIC",
        "buyCost": {
                "material": "Spores",
                "amount": 2
        },
        "sellValue": {
                "material": "Essence",
                "amount": 20
        },
        "statBonus": {
                "spellReach": 1
        }
},
    UNSTABLE_GAUNTLET: {
        "key": "UNSTABLE_GAUNTLET",
        "name": "Unstable Gauntlet",
        "description": "A high-quality magic item of unstable origin. Ideal for transactions and trade.",
        "category": "MAGIC",
        "buyCost": {
                "material": "Essence",
                "amount": 41
        },
        "sellValue": {
                "material": "Essence",
                "amount": 16
        },
        "statBonus": {
                "spellReach": 1,
                "damage": 2
        }
},
    CYBERNETIC_RING: {
        "key": "CYBERNETIC_RING",
        "name": "Cybernetic Ring",
        "description": "A high-quality magic item of cybernetic origin. Ideal for transactions and trade.",
        "category": "MAGIC",
        "buyCost": {
                "material": "Spores",
                "amount": 5
        },
        "sellValue": {
                "material": "Essence",
                "amount": 50
        },
        "statBonus": {
                "spellReach": 1
        }
},
    MYRMIDON_GRIMOIRE: {
        "key": "MYRMIDON_GRIMOIRE",
        "name": "Myrmidon Grimoire",
        "description": "A high-quality magic item of myrmidon origin. Ideal for transactions and trade.",
        "category": "MAGIC",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 6
        },
        "sellValue": {
                "material": "Essence",
                "amount": 60
        },
        "statBonus": {
                "spellReach": 1
        }
},
    SOVEREIGN_AMULET: {
        "key": "SOVEREIGN_AMULET",
        "name": "Sovereign Amulet",
        "description": "A high-quality magic item of sovereign origin. Ideal for transactions and trade.",
        "category": "MAGIC",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 3
        },
        "sellValue": {
                "material": "Essence",
                "amount": 30
        },
        "statBonus": {
                "spellReach": 1,
                "damage": 2
        }
},
    MAGNETIC_SCROLL: {
        "key": "MAGNETIC_SCROLL",
        "name": "Magnetic Scroll",
        "description": "A high-quality magic item of magnetic origin. Ideal for transactions and trade.",
        "category": "MAGIC",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 4
        },
        "sellValue": {
                "material": "Essence",
                "amount": 40
        },
        "statBonus": {
                "spellReach": 1,
                "damage": 1
        }
},
    HYPER_SCROLL: {
        "key": "HYPER_SCROLL",
        "name": "Hyper Scroll",
        "description": "A high-quality magic item of hyper origin. Ideal for transactions and trade.",
        "category": "MAGIC",
        "buyCost": {
                "material": "Spores",
                "amount": 3
        },
        "sellValue": {
                "material": "Essence",
                "amount": 30
        },
        "statBonus": {
                "spellReach": 1
        }
},
    BIO_STAFF: {
        "key": "BIO_STAFF",
        "name": "Bio Staff",
        "description": "A high-quality magic item of bio origin. Ideal for transactions and trade.",
        "category": "MAGIC",
        "buyCost": {
                "material": "Essence",
                "amount": 51
        },
        "sellValue": {
                "material": "Essence",
                "amount": 20
        },
        "statBonus": {
                "spellReach": 2,
                "damage": 2
        }
},
    BIO_RING: {
        "key": "BIO_RING",
        "name": "Bio Ring",
        "description": "A high-quality magic item of bio origin. Ideal for transactions and trade.",
        "category": "MAGIC",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 5
        },
        "sellValue": {
                "material": "Essence",
                "amount": 50
        },
        "statBonus": {
                "spellReach": 1
        }
},
    FARADAY_BOOTS: {
        "key": "FARADAY_BOOTS",
        "name": "Faraday Boots",
        "description": "A high-quality magic item of faraday origin. Ideal for transactions and trade.",
        "category": "MAGIC",
        "buyCost": {
                "material": "Spores",
                "amount": 2
        },
        "sellValue": {
                "material": "Essence",
                "amount": 20
        },
        "statBonus": {
                "spellReach": 1
        }
},
    GLACIAL_STAFF: {
        "key": "GLACIAL_STAFF",
        "name": "Glacial Staff",
        "description": "A high-quality magic item of glacial origin. Ideal for transactions and trade.",
        "category": "MAGIC",
        "buyCost": {
                "material": "Spores",
                "amount": 6
        },
        "sellValue": {
                "material": "Essence",
                "amount": 60
        },
        "statBonus": {
                "spellReach": 2
        }
},
    SOVEREIGN_SCROLL: {
        "key": "SOVEREIGN_SCROLL",
        "name": "Sovereign Scroll",
        "description": "A high-quality magic item of sovereign origin. Ideal for transactions and trade.",
        "category": "MAGIC",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 4
        },
        "sellValue": {
                "material": "Essence",
                "amount": 40
        },
        "statBonus": {
                "spellReach": 1,
                "damage": 2
        }
},
    BIO_GRIMOIRE: {
        "key": "BIO_GRIMOIRE",
        "name": "Bio Grimoire",
        "description": "A high-quality magic item of bio origin. Ideal for transactions and trade.",
        "category": "MAGIC",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 5
        },
        "sellValue": {
                "material": "Essence",
                "amount": 50
        },
        "statBonus": {
                "spellReach": 2,
                "damage": 2
        }
},
    VOID_CROWN: {
        "key": "VOID_CROWN",
        "name": "Void Crown",
        "description": "A high-quality magic item of void origin. Ideal for transactions and trade.",
        "category": "MAGIC",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 4
        },
        "sellValue": {
                "material": "Essence",
                "amount": 40
        },
        "statBonus": {
                "spellReach": 1,
                "damage": 1
        }
},
    FUNGAL_AEGIS: {
        "key": "FUNGAL_AEGIS",
        "name": "Fungal Aegis",
        "description": "A high-quality magic item of fungal origin. Ideal for transactions and trade.",
        "category": "MAGIC",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 4
        },
        "sellValue": {
                "material": "Essence",
                "amount": 40
        },
        "statBonus": {
                "spellReach": 1,
                "damage": 1
        }
},
    CHRONO_AMULET: {
        "key": "CHRONO_AMULET",
        "name": "Chrono Amulet",
        "description": "A high-quality magic item of chrono origin. Ideal for transactions and trade.",
        "category": "MAGIC",
        "buyCost": {
                "material": "CrystalShard",
                "amount": 6
        },
        "sellValue": {
                "material": "Essence",
                "amount": 60
        },
        "statBonus": {
                "spellReach": 1
        }
}
};
