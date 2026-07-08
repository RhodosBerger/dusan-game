import { Thread } from './Thread';

export interface CraftingRecipe {
  recipeId: string;
  resultHelperType: 'trap' | 'bomb' | 'watcher' | 'tower';
  requiredMaterials: Record<string, number>;
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    recipeId: 'craft_tower',
    resultHelperType: 'tower',
    requiredMaterials: { CrystalShard: 3, Spores: 1 }
  },
  {
    recipeId: 'craft_bomb',
    resultHelperType: 'bomb',
    requiredMaterials: { Spores: 3, CrystalShard: 1 }
  },
  {
    recipeId: 'craft_trap',
    resultHelperType: 'trap',
    requiredMaterials: { Spores: 2 }
  },
  {
    recipeId: 'craft_watcher',
    resultHelperType: 'watcher',
    requiredMaterials: { CrystalShard: 2 }
  }
];

export class CraftingSimulator {
  /**
   * Pokúsi sa vyrobiť jednotku pre dané vlákno (Thread) na základe ID receptu.
   * Ak má dostatok surovín, odpočíta ich a vráti typ jednotky, inak vyhodí chybu.
   */
  public static craft(thread: Thread, recipeId: string): 'trap' | 'bomb' | 'watcher' | 'tower' {
    const recipe = CRAFTING_RECIPES.find(r => r.recipeId === recipeId);
    if (!recipe) {
      throw new Error(`Recept "${recipeId}" neexistuje.`);
    }

    // Skontrolujeme dostatok materiálov
    for (const [material, amount] of Object.entries(recipe.requiredMaterials)) {
      const currentAmount = thread.materials[material] || 0;
      if (currentAmount < amount) {
        throw new Error(`Nedostatok suroviny: ${material} (vyžaduje sa: ${amount}, máte: ${currentAmount}).`);
      }
    }

    // Odpočítame suroviny
    for (const [material, amount] of Object.entries(recipe.requiredMaterials)) {
      thread.materials[material] -= amount;
    }

    return recipe.resultHelperType;
  }
}
