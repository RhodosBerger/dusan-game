import type {
    CardCategorization,
    CardEffect,
    CardSpecification,
    CardType,
    HeroId,
    UnitType,
} from "../../core/types";

export interface CardBase {
    id: string;
    heroId: HeroId;
    count: number;
    isUnit: boolean;
    isUltimate: boolean;
    cardCategorization: CardCategorization;
    specifications: CardSpecification[];
    effect?: CardEffect;
    cardTypes?: CardType[];
    unitType?: UnitType;
}

export interface HeroBase {
    id: HeroId;
    icon: string;
    color: string;
    imageExtension: string;
    imagePath?: string;
    iconPath?: string;
}

export interface LocalizedCard extends CardBase {
    name: string;
    description: string;
}

export interface LocalizedHero extends HeroBase {
    name: string;
    description: string;
    title: string;
    specialAbility: string;
    passiveAbility: string;
    playstyle: readonly string[];
}

export interface HeroTranslations {
    name: string;
    description: string;
    title: string;
    specialAbility: string;
    passiveAbility: string;
    playstyle: string[];
}

export interface CardTranslations {
    name: string;
    description: string;
}
