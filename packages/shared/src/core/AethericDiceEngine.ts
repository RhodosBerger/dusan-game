// packages/shared/src/core/AethericDiceEngine.ts
import { PROTAGONIST_CATEGORIES, ProtagonistCategoryKey } from '../data/warhammerFactions';

export interface DiceRollResult {
    roll: number;
    diceType: 'D6' | 'D12';
    modifierType: 'AVERAGE' | 'DIVIDE' | 'MULTIPLY';
    originalValue: number;
    modifiedValue: number;
    formula: string;
}

export class AethericDiceEngine {
    static bypassDice = false;
    
    /**
     * Resolves the protagonist class based on thread metadata (defaults to SOVEREIGN_EXEMPLAR).
     */
    static getCategoryByHero(heroId: string | null): ProtagonistCategoryKey {
        if (!heroId) return 'SOVEREIGN_EXEMPLAR';
        
        const lower = heroId.toLowerCase();
        if (lower.includes('wizard') || lower.includes('hacker') || lower.includes('spellweaver')) {
            return 'AETHER_SPELLWEAVER'; // Wizard has a larger range
        }
        if (lower.includes('myrmidon') || lower.includes('defender') || lower.includes('sentinel')) {
            return 'MYRMIDON_SENTINEL';
        }
        if (lower.includes('behemoth') || lower.includes('titan') || lower.includes('colossus') || lower.includes('king')) {
            return 'GIGANTIC_BEHEMOTH'; // High risk, heavy hitter
        }
        if (lower.includes('scout') || lower.includes('harbinger') || lower.includes('vanguard')) {
            return 'SWIFT_HARBINGER';
        }
        return 'SOVEREIGN_EXEMPLAR';
    }

    /**
     * Rolls a virtual die of specified size (6 or 12).
     */
    static rollDie(sides: 6 | 12): number {
        return Math.floor(Math.random() * sides) + 1;
    }

    /**
     * Applies the algebraic dice modification algorithm to a character's build value.
     */
    static applyDiceModification(
        categoryKey: ProtagonistCategoryKey,
        originalValue: number,
        customRoll?: number // optional for deterministic test overrides
    ): DiceRollResult {
        const category = PROTAGONIST_CATEGORIES[categoryKey] || PROTAGONIST_CATEGORIES.SOVEREIGN_EXEMPLAR;
        const sides = category.diceType === 'D12' ? 12 : 6;
        const roll = customRoll !== undefined ? customRoll : this.rollDie(sides);

        if (this.bypassDice) {
            return {
                roll: 0,
                diceType: category.diceType,
                modifierType: category.buildModifierType,
                originalValue,
                modifiedValue: originalValue,
                formula: 'Bypassed (Deterministic Test Mode)'
            };
        }

        let modifiedValue = originalValue;
        let formula = '';

        switch (category.buildModifierType) {
            case 'AVERAGE':
                // Averages the build value with the roll
                modifiedValue = Math.round((originalValue + roll) / 2);
                formula = `(${originalValue} + ${roll}) / 2`;
                break;
            case 'DIVIDE':
                // Divides the build by an entropy scale derived from the roll (low roll = heavy division/penalty)
                const factor = Math.max(1.0, (sides + 1 - roll) * 0.5);
                modifiedValue = Math.max(1, Math.round(originalValue / factor));
                formula = `${originalValue} / ${factor.toFixed(1)} (Roll: ${roll})`;
                break;
            case 'MULTIPLY':
                // Multiplies or amplifies the build value by the roll ratio
                const multiplier = 1.0 + (roll / sides);
                modifiedValue = Math.round(originalValue * multiplier);
                formula = `${originalValue} * ${multiplier.toFixed(2)} (Roll: ${roll})`;
                break;
        }

        return {
            roll,
            diceType: category.diceType,
            modifierType: category.buildModifierType,
            originalValue,
            modifiedValue,
            formula
        };
    }

    /**
     * Compares the rolls of the attacker and defender and adjusts damage.
     * If attacker rolls higher than defender: damage is amplified (1.5x).
     * If attacker rolls lower/equal to defender: damage is mitigated (0.5x).
     * The condition can also be "LESS" for stealth/toxic cards.
     */
    static calculateContestedDamage(
        attackerRoll: number,
        defenderRoll: number,
        baseDamage: number,
        condition: 'MORE' | 'LESS' = 'MORE'
    ): { finalDamage: number; success: boolean; log: string } {
        if (this.bypassDice) {
            return {
                finalDamage: baseDamage,
                success: true,
                log: 'Bypassed (Deterministic Test Mode)'
            };
        }

        let success = false;
        if (condition === 'MORE') {
            success = attackerRoll > defenderRoll;
        } else {
            success = attackerRoll < defenderRoll;
        }

        let finalDamage = baseDamage;
        let log = '';

        if (success) {
            finalDamage = Math.round(baseDamage * 1.5);
            log = `Contested Roll Success! Attacker rolled ${attackerRoll} vs Defender's ${defenderRoll} (${condition} condition met). Damage amplified to ${finalDamage} (1.5x).`;
        } else {
            finalDamage = Math.max(1, Math.round(baseDamage * 0.5));
            log = `Contested Roll Failed! Attacker rolled ${attackerRoll} vs Defender's ${defenderRoll} (${condition} condition NOT met). Damage mitigated to ${finalDamage} (0.5x).`;
        }

        return { finalDamage, success, log };
    }

    /**
     * Probabilistically determines the hit zone based on the attacker's luck stat.
     * Higher luck shifts weight towards Head and Chest critical zones.
     */
    static rollHitZone(luck: number): 'head' | 'chest' | 'left_arm' | 'right_arm' | 'left_leg' | 'right_leg' {
        let wHead = 5;
        let wChest = 50;
        let wLeftArm = 12.5;
        let wRightArm = 12.5;
        let wLeftLeg = 10;
        let wRightLeg = 10;

        // Luck shift: scale Head and Chest weights positively
        const luckShift = Math.max(-4, (luck - 0.5) * 30);
        wHead = Math.max(1, wHead + luckShift);
        wChest = Math.max(10, wChest + luckShift * 0.5);

        const total = wHead + wChest + wLeftArm + wRightArm + wLeftLeg + wRightLeg;
        const roll = Math.random() * total;

        let cumulative = 0;
        
        cumulative += wHead;
        if (roll < cumulative) return 'head';
        
        cumulative += wChest;
        if (roll < cumulative) return 'chest';
        
        cumulative += wLeftArm;
        if (roll < cumulative) return 'left_arm';
        
        cumulative += wRightArm;
        if (roll < cumulative) return 'right_arm';
        
        cumulative += wLeftLeg;
        if (roll < cumulative) return 'left_leg';
        
        return 'right_leg';
    }
}
