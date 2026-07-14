import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Starting Prisma Database Seeding...');

  // 1. Clean up existing records to make seeder idempotent
  await prisma.playerCard.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.player.deleteMany({});

  console.log('[SEED] Cleaned up existing Player, PlayerCard, and Inventory records.');

  // 2. Create Crystal King Player
  const crystalPlayer = await prisma.player.create({
    data: {
      username: 'crystal_king',
      email: 'crystal.king@kmen.io',
      passwordHash: 'argon2_hashed_password_placeholder',
      level: 5,
      xp: 450,
      mmr: 1200,
      inventory: {
        createMany: {
          data: [
            { materialKey: 'CrystalShard', amount: 25 },
            { materialKey: 'Essence', amount: 150 },
          ]
        }
      },
      cardDeck: {
        createMany: {
          data: [
            { cardDefinitionId: 'crystal_laser_01', isShiny: false },
            { cardDefinitionId: 'crystal_shield_01', isShiny: false },
            { cardDefinitionId: 'crystal_move_01', isShiny: false },
            { cardDefinitionId: 'crystal_attack_01', isShiny: false },
            { cardDefinitionId: 'crystal_laser_burst', isShiny: true, customVoltage: 1.2 }
          ]
        }
      }
    }
  });
  console.log(`[SEED] Created Player: ${crystalPlayer.username}`);

  // 3. Create Toxic Hacker Player
  const toxicPlayer = await prisma.player.create({
    data: {
      username: 'toxic_hacker',
      email: 'toxic.hacker@kmen.io',
      passwordHash: 'argon2_hashed_password_placeholder',
      level: 4,
      xp: 220,
      mmr: 1050,
      inventory: {
        createMany: {
          data: [
            { materialKey: 'ToxicSpore', amount: 30 },
            { materialKey: 'Essence', amount: 80 },
          ]
        }
      },
      cardDeck: {
        createMany: {
          data: [
            { cardDefinitionId: 'toxic_snake_01', isShiny: false },
            { cardDefinitionId: 'toxic_acid_01', isShiny: false },
            { cardDefinitionId: 'toxic_move_01', isShiny: false },
            { cardDefinitionId: 'toxic_venom_spike', isShiny: true, customResistance: -0.4 }
          ]
        }
      }
    }
  });
  console.log(`[SEED] Created Player: ${toxicPlayer.username}`);

  // 4. Create Void Weaver Player (New Building Element!)
  const voidPlayer = await prisma.player.create({
    data: {
      username: 'void_weaver',
      email: 'void.weaver@kmen.io',
      passwordHash: 'argon2_hashed_password_placeholder',
      level: 6,
      xp: 680,
      mmr: 1350,
      inventory: {
        createMany: {
          data: [
            { materialKey: 'CrystalShard', amount: 10 },
            { materialKey: 'ToxicSpore', amount: 10 },
            { materialKey: 'Essence', amount: 200 },
          ]
        }
      },
      cardDeck: {
        createMany: {
          data: [
            { cardDefinitionId: 'voidBolt', isShiny: false },
            { cardDefinitionId: 'entropyShield', isShiny: false },
            { cardDefinitionId: 'voidGate', isShiny: false },
            { cardDefinitionId: 'voidErosion', isShiny: true, customVoltage: 0.8 },
            { cardDefinitionId: 'rootTrap', isShiny: false }
          ]
        }
      }
    }
  });
  console.log(`[SEED] Created Player: ${voidPlayer.username}`);

  console.log('[SEED] Database Seeding Completed successfully.');
}

main()
  .catch((e) => {
    console.error('[SEED ERROR] Seeder execution failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
