// packages/server/src/economy/CraftingSimulator.ts
import * as PrismaPkg from '@prisma/client';
const PrismaClient = (PrismaPkg as any).PrismaClient;

const prisma = new PrismaClient();

export interface CraftingRecipe {
    id:              string;
    name:            string;
    requiredSpores:  number;
    requiredShards:  number;
    requiredEssence: number;
    voltageMod:      number;
    resistanceMod:   number;
    targetCardId:    string;
}

export const CRAFTING_RECIPES: Record<string, CraftingRecipe> = {
    RECIPE_VOLTAGE_BOOST: {
        id:              'RECIPE_VOLTAGE_BOOST',
        name:            'Toxic Overcharge Voltage Upgrade',
        requiredSpores:  5,
        requiredShards:  0,
        requiredEssence: 100,
        voltageMod:      0.5,
        resistanceMod:   0.0,
        targetCardId:    'toxic_venom_spike'
    },
    RECIPE_CONDUCTIVITY_BOOST: {
        id:              'RECIPE_CONDUCTIVITY_BOOST',
        name:            'Crystal Superconductivity Upgrade',
        requiredSpores:  0,
        requiredShards:  3,
        requiredEssence: 80,
        voltageMod:      0.0,
        resistanceMod:   -0.5, // lowers resistance, which increases current flow (I = V/R)
        targetCardId:    'crystal_laser_burst'
    }
};

export class CraftingSimulator {

    /**
     * Burns a player card, deletes it from ownership, and rewards Essence to the player inventory.
     * Uses transaction to prevent database race conditions.
     */
    static async burnCard(playerId: string, playerCardId: string): Promise<{ rewardedEssence: number }> {
        return prisma.$transaction(async (tx: any) => {
            // 1. Fetch player card to confirm ownership and extract details
            const card = await tx.playerCard.findFirst({
                where: { id: playerCardId, playerId }
            });
            if (!card) {
                throw new Error('ERR_CARD_NOT_FOUND_OR_OWNED');
            }

            // 2. Delete the card atomically
            await tx.playerCard.delete({
                where: { id: playerCardId }
            });

            // 3. Determine essence reward (Ultimates yield more, base is 20)
            const reward = card.cardDefinitionId.includes('ultimate') ? 100 : 20;

            // 4. Increment the player's Essence balance in the inventory
            await tx.inventory.upsert({
                where: { playerId_materialKey: { playerId, materialKey: 'Essence' } },
                update: { amount: { increment: reward } },
                create: { playerId, materialKey: 'Essence', amount: reward }
            });

            console.log(`[ECONOMY] Player ${playerId} burned card ${card.cardDefinitionId}. Rewarded ${reward} Essence.`);
            return { rewardedEssence: reward };
        });
    }

    /**
     * Crafts a new card with customized parameters using materials and essence.
     * Executed within a strict transaction block to prevent duplication exploits.
     */
    static async craftCard(playerId: string, recipeId: string): Promise<any> {
        const recipe = CRAFTING_RECIPES[recipeId];
        if (!recipe) {
            throw new Error('ERR_INVALID_RECIPE');
        }

        return prisma.$transaction(async (tx: any) => {
            // 1. Fetch all inventory elements for player
            const inventory = await tx.inventory.findMany({
                where: { playerId }
            });

            const getAmount = (key: string) => inventory.find((i: any) => i.materialKey === key)?.amount ?? 0;

            const currentSpores  = getAmount('ToxicSpore');
            const currentShards  = getAmount('CrystalShard');
            const currentEssence = getAmount('Essence');

            // 2. Validate resource thresholds
            if (currentSpores < recipe.requiredSpores) {
                throw new Error('ERR_INSUFFICIENT_SPORES');
            }
            if (currentShards < recipe.requiredShards) {
                throw new Error('ERR_INSUFFICIENT_SHARDS');
            }
            if (currentEssence < recipe.requiredEssence) {
                throw new Error('ERR_INSUFFICIENT_ESSENCE');
            }

            // 3. Deduct materials
            if (recipe.requiredSpores > 0) {
                await tx.inventory.update({
                    where: { playerId_materialKey: { playerId, materialKey: 'ToxicSpore' } },
                    data: { amount: { decrement: recipe.requiredSpores } }
                });
            }
            if (recipe.requiredShards > 0) {
                await tx.inventory.update({
                    where: { playerId_materialKey: { playerId, materialKey: 'CrystalShard' } },
                    data: { amount: { decrement: recipe.requiredShards } }
                });
            }
            if (recipe.requiredEssence > 0) {
                await tx.inventory.update({
                    where: { playerId_materialKey: { playerId, materialKey: 'Essence' } },
                    data: { amount: { decrement: recipe.requiredEssence } }
                });
            }

            // 4. Create the modified crafted card
            const newCard = await tx.playerCard.create({
                data: {
                    playerId,
                    cardDefinitionId: recipe.targetCardId,
                    customVoltage:    recipe.voltageMod > 0 ? recipe.voltageMod : null,
                    customResistance: recipe.resistanceMod !== 0 ? recipe.resistanceMod : null,
                    isShiny:          true // upgraded cards are marked shiny
                }
            });

            console.log(`[ECONOMY] Player ${playerId} crafted card ${recipe.targetCardId} (Recipe: ${recipeId})`);
            return newCard;
        });
    }
}
