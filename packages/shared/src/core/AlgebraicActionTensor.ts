import { getPhysicsSpecs } from "./PhysicsActionDataset";
import { AethericDiceEngine } from "./AethericDiceEngine";

/** Minimum resistance floor to prevent division by zero. */
const MIN_RESISTANCE = 0.1;

export interface OutcomeVector {
    damageApplied: number;
    energyDelta: number;
    displacementDistance: number;
    displacementType: 'push' | 'pull' | 'none';
    statusApplied: 'slowed' | 'rooted' | 'disarmed' | 'silenced' | 'none';
    successProbability: number;
    diceRoll?: number;
    diceFormula?: string;
}

/**
 * Properties of the hero (Thread) that the tensor needs for evaluation.
 * Replaces the previous `any` parameter with a strict contract.
 */
export interface ActionSource {
    id?: string;
    level?: number;
    luck?: number;
    isSlowed?: boolean;
}

/**
 * Properties of the target hex context needed by the tensor.
 */
export interface TargetHexContext {
    biome?: 'GLACIER' | 'TOXIC_SWAMP' | 'DESERT' | 'BARRENS' | 'LUSH_FOREST' | (string & {});
    friction?: number;
    hazardIndex?: number;
}

export class AlgebraicActionTensor {
    /**
     * Projektívna funkcia vyhodnotenia tenzora T_{i,j,k} pre výpočet výsledku hernej akcie.
     * @param source Hrdina (Thread), ktorý inštrukciu spúšťa (level, luck, isSlowed)
     * @param cardId ID zahranej karty
     * @param targetHex Cieľový hexagon arény (biome, friction, hazardIndex)
     */
    static evaluate(source: ActionSource | null | undefined, cardId: string, targetHex: TargetHexContext | null | undefined): OutcomeVector {
        const specs = getPhysicsSpecs(cardId);
        
        // 1. Základné hodnoty z fyzikálnej špecifikácie karty
        let damage = specs.damage !== undefined ? specs.damage : 1;
        
        const hazardIndex = targetHex?.hazardIndex ?? 0;
        const friction = targetHex?.friction ?? 0;
        const effectiveVoltage = specs.voltage + hazardIndex * 1.5;
        const rawResistance = specs.resistance + friction * 2.0;
        // Guard: prevent division by zero when both resistance and friction are 0
        const effectiveResistance = Math.max(MIN_RESISTANCE, rawResistance);
        const effectiveCurrent = effectiveVoltage / effectiveResistance;
        const effectivePowerLoad = effectiveVoltage * effectiveCurrent;

        let energy = effectivePowerLoad * 1.5;
        let pushPull = specs.kineticForce;
        let success = 100.0;
        let status: OutcomeVector['statusApplied'] = 'none';

        if (specs.effect) {
            if (specs.effect === 'slow') status = 'slowed';
            else if (specs.effect === 'root') status = 'rooted';
            else if (specs.effect === 'disarm') status = 'disarmed';
            else if (specs.effect === 'silence') status = 'silenced';
        }

        // Defenzívne a liečiace karty nekonajú poškodenie
        if (cardId.includes('shield') || cardId.includes('heal') || cardId.includes('grow') || cardId.includes('nature')) {
            damage = 0;
        }

        // 2. Vplyv vlastností terénu (Rozmer k)
        const biome = targetHex?.biome || 'LUSH_FOREST';
        
        if (biome === 'TOXIC_SWAMP') {
            if (damage > 0) {
                damage += 1;
                status = 'slowed';
            }
            energy += 8.0; // prekážky a trenie generujú viac systémového preťaženia
        } else if (biome === 'LUSH_FOREST') {
            if (cardId.includes('heal') || cardId.includes('nature')) {
                energy -= 4.0; // lesy absorbujú systémové preťaženie
            }
        } else if (biome === 'GLACIER') {
            if (damage > 0) {
                status = 'rooted'; // ľadovec znehybňuje
            }
            pushPull = Math.max(0, pushPull - 1); // ľad znižuje hybnosť
        }

        // 3. Vplyv vlastností hrdinu (Rozmer i)
        const level = source?.level ?? 1;
        const luck = source?.luck ?? 0.5;
        const isSlowed = source?.isSlowed ?? false;

        // Level modifikátor: lineárne navyšovanie základného poškodenia (+10% za level)
        damage = Math.round(damage * (1 + (level - 1) * 0.1));
        
        // 4. Aetheric Dice Roll Modification based on Protagonist Category
        const categoryKey = AethericDiceEngine.getCategoryByHero(source?.id ?? null);
        const diceOutcome = AethericDiceEngine.applyDiceModification(categoryKey, damage);
        damage = diceOutcome.modifiedValue;

        // Luck modifikátor: ovplyvňuje stabilitu úspechu akcie
        success = Math.min(100.0, Math.max(60.0, 85.0 + luck * 20.0));

        // Spomalenie znižuje hybnosť o polovicu
        if (isSlowed) {
            pushPull = Math.round(pushPull * 0.5);
        }

        // Final safety: ensure no NaN or Infinity escapes
        return {
            damageApplied: isFinite(damage) ? damage : 0,
            energyDelta: isFinite(energy) ? energy : 0,
            displacementDistance: isFinite(pushPull) ? Math.max(0, pushPull) : 0,
            displacementType: specs.displacementType,
            statusApplied: status,
            successProbability: isFinite(success) ? success : 60.0,
            diceRoll: diceOutcome.roll,
            diceFormula: diceOutcome.formula
        };
    }

    /**
     * Spätne vypočíta chýbajúce (neznáme) parametre potrebné na dosiahnutie určitého výsledku.
     * Generuje neznáme z inferencie tenzoru použitím trojčlenky.
     */
    static inferUnknown(
        cardId: string,
        targetHex: TargetHexContext | null | undefined,
        targetOutcome: Partial<OutcomeVector>
    ): { requiredLevel?: number; requiredHazardIndex?: number } {
        const specs = getPhysicsSpecs(cardId);
        const results: { requiredLevel?: number; requiredHazardIndex?: number } = {};

        // 1. Spätný prepočet levelu z targetOutcome.damageApplied pomocou trojčlenky
        if (targetOutcome.damageApplied !== undefined) {
            const baseDamage = specs.damage !== undefined ? specs.damage : 1;
            if (baseDamage > 0) {
                // damage = baseDamage * (1 + (level - 1) * 0.1)
                const multiplier = targetOutcome.damageApplied / baseDamage;
                results.requiredLevel = Math.round((multiplier - 1) / 0.1 + 1);
            }
        }

        // 2. Spätný prepočet hazardIndex z targetOutcome.energyDelta pomocou Ohmovho zákona
        if (targetOutcome.energyDelta !== undefined) {
            // energy = P_eff * 1.5 => P_eff = energy / 1.5
            const targetPowerLoad = targetOutcome.energyDelta / 1.5;
            const friction = targetHex?.friction ?? 0;
            const baseResistance = specs.resistance || 1.0;
            const effectiveResistance = Math.max(MIN_RESISTANCE, baseResistance + friction * 2.0);
            // P = V^2 / R => V = sqrt(P * R)
            const targetVoltage = Math.sqrt(targetPowerLoad * effectiveResistance);
            const baseVoltage = specs.voltage;
            results.requiredHazardIndex = parseFloat(((targetVoltage - baseVoltage) / 1.5).toFixed(2));
        }

        return results;
    }
}
