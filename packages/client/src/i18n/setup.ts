// ────────────────────────────────────────────────────────────────────────────
// i18n/setup.ts — Internationalization configuration
//
// Namespaces:
//   common  — global UI strings (buttons, labels, menu items)
//   cards   — card names, descriptions (keyed by card ID)
//   quests  — quest titles and descriptions
//   arena   — in-game UI text (turn messages, status effects)
//
// Locale files are loaded from CDN: /locales/{lang}/{ns}.json
// Fallback: English ('en') if translation is missing
// ────────────────────────────────────────────────────────────────────────────

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Bundled fallback translations (always available, no HTTP required)
const BUNDLED_EN_COMMON = {
    'app.title':           'The Last Tribe',
    'lobby.choose_hero':   'Choose Your Hero',
    'lobby.start_ai':      'Fight vs AI',
    'lobby.start_pvp':     'PvP Matchmaking',
    'arena.your_turn':     "Your Turn",
    'arena.opponent_turn': "Opponent's Turn",
    'arena.end_turn':      'End Turn',
    'arena.execute':       'Execute Action',
    'arena.move_hero':     'Move Hero Here',
    'status.slowed':       'Slowed',
    'status.rooted':       'Rooted',
    'status.disarmed':     'Disarmed',
    'status.silenced':     'Silenced',
    'phase.preparation':   'Preparation',
    'phase.action':        'Action Phase',
    'phase.interrupt':     'Interrupt Window',
    'phase.resolve':       'Resolving...',
};

const BUNDLED_EN_CARDS = {
    'card.crystal_laser':  'Crystal Laser',
    'card.crystal_shield': 'Crystal Shield',
    'card.crystal_teleport': 'Teleport',
    'card.crystal_pulse':  'Pulse Wave',
    'card.snake_venom':    'Snake Venom',
    'card.acid_rain':      'Acid Rain',
    'card.toxic_hook':     'Toxic Hook',
    'card.mud_slide':      'Mud Slide',
    'card.bear_swipe':     'Bear Swipe',
    'card.forest_grow':    'Forest Growth',
    'card.wind_gust':      'Wind Gust',
    'card.nature_heal':    'Nature Heal',
};

const BUNDLED_SK_COMMON = {
    'app.title':           'Posledný Kmeň',
    'lobby.choose_hero':   'Vyber si Hrdinu',
    'lobby.start_ai':      'Hrať proti AI',
    'lobby.start_pvp':     'PvP Zápas',
    'arena.your_turn':     'Tvoj ťah',
    'arena.opponent_turn': 'Ťah súpera',
    'arena.end_turn':      'Ukončiť ťah',
    'arena.execute':       'Vykonať akciu',
    'arena.move_hero':     'Presunúť hrdinu sem',
    'status.slowed':       'Spomalený',
    'status.rooted':       'Zakorenený',
    'status.disarmed':     'Odzbrojený',
    'status.silenced':     'Umlčaný',
    'phase.preparation':   'Príprava',
    'phase.action':        'Akčná fáza',
    'phase.interrupt':     'Okno prerušenia',
    'phase.resolve':       'Vyhodnocovanie...',
};

const BUNDLED_SK_CARDS = {
    'card.crystal_laser':    'Krystalový Laser',
    'card.crystal_shield':   'Krystalový Štít',
    'card.crystal_teleport': 'Teleport',
    'card.crystal_pulse':    'Pulzná Vlna',
    'card.snake_venom':      'Hadie Jed',
    'card.acid_rain':        'Kyselinový Dážď',
    'card.toxic_hook':       'Toxický Hák',
    'card.mud_slide':        'Blatiská Lavína',
    'card.bear_swipe':       'Medvedie Máchnutie',
    'card.forest_grow':      'Rast Lesa',
    'card.wind_gust':        'Závan Vetra',
    'card.nature_heal':      'Prírodné Liečenie',
};

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                common: BUNDLED_EN_COMMON,
                cards:  BUNDLED_EN_CARDS,
            },
            sk: {
                common: BUNDLED_SK_COMMON,
                cards:  BUNDLED_SK_CARDS,
            },
        },
        lng:         detectLanguage(),
        fallbackLng: 'en',
        ns:          ['common', 'cards', 'quests', 'arena'],
        defaultNS:   'common',
        interpolation: {
            escapeValue: false,  // React already escapes
        },
        // Future: enable HTTP backend for CDN-loaded locales
        // backend: {
        //   loadPath: `${import.meta.env.VITE_CDN_URL}/locales/{{lng}}/{{ns}}.json`,
        // },
    });

/** Detect language from browser or localStorage */
function detectLanguage(): string {
    const saved = localStorage.getItem('dusan-language');
    if (saved) return saved;
    const browser = navigator.language?.split('-')[0] || 'en';
    return ['en', 'sk', 'cs', 'de', 'fr', 'es', 'pl'].includes(browser) ? browser : 'en';
}

/** Programmatically switch language and persist */
export function setLanguage(lang: string): Promise<void> {
    localStorage.setItem('dusan-language', lang);
    return i18n.changeLanguage(lang);
}

export const SUPPORTED_LANGUAGES = [
    { code: 'en', label: 'English',    flag: '🇬🇧' },
    { code: 'sk', label: 'Slovenčina', flag: '🇸🇰' },
    { code: 'cs', label: 'Čeština',    flag: '🇨🇿' },
    { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
    { code: 'fr', label: 'Français',   flag: '🇫🇷' },
    { code: 'es', label: 'Español',    flag: '🇪🇸' },
    { code: 'pl', label: 'Polski',     flag: '🇵🇱' },
];

export default i18n;
