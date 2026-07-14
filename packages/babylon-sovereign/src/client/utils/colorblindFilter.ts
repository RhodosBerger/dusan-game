// ────────────────────────────────────────────────────────────────────────────
// colorblindFilter.ts — Runtime colorblind simulation + CSS variable overrides
//
// Applies an SVG feColorMatrix filter to the WebGL canvas for colorblind users.
// Also updates CSS custom properties so HUD/UI elements match the adjusted palette.
//
// Based on: Machado et al. (2009) — "A Physiologically-based Model for Simulation
//           of Color Vision Deficiency"
// ────────────────────────────────────────────────────────────────────────────

export type ColorblindMode = 'NONE' | 'PROTANOPIA' | 'DEUTERANOPIA' | 'TRITANOPIA' | 'ACHROMATOPSIA';

// SVG feColorMatrix 5×4 values for each mode (rows: R G B A offset)
const MATRICES: Record<ColorblindMode, string> = {
    NONE:
        '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0',
    PROTANOPIA:
        '0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0',
    DEUTERANOPIA:
        '0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0',
    TRITANOPIA:
        '0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0',
    ACHROMATOPSIA:
        '0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0',
};

// Faction palette overrides per mode
// Keys match CSS custom properties: --color-crystal, --color-toxic, --color-druid
const PALETTE_OVERRIDES: Record<ColorblindMode, Record<string, string> | null> = {
    NONE: null,
    PROTANOPIA: {
        '--color-crystal': '#0077ff',   // blue instead of cyan
        '--color-toxic':   '#ff8800',   // orange instead of green
        '--color-druid':   '#9900cc',   // purple instead of gold
    },
    DEUTERANOPIA: {
        '--color-crystal': '#0066cc',
        '--color-toxic':   '#ff7700',
        '--color-druid':   '#8800ff',
    },
    TRITANOPIA: {
        '--color-crystal': '#ff0066',
        '--color-toxic':   '#00dd99',
        '--color-druid':   '#ffcc00',   // gold stays legible
    },
    ACHROMATOPSIA: {
        '--color-crystal': '#cccccc',
        '--color-toxic':   '#888888',
        '--color-druid':   '#eeeeee',
    },
};

const FILTER_ID   = 'dusan-cb-filter';
const MATRIX_ID   = 'dusan-cb-matrix';

/** Inject SVG filter into DOM (idempotent — only injects once) */
function ensureSvgFilter(): void {
    if (document.getElementById(FILTER_ID)) return;
    document.body.insertAdjacentHTML('beforeend', `
    <svg style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">
      <defs>
        <filter id="${FILTER_ID}" color-interpolation-filters="linearRGB">
          <feColorMatrix id="${MATRIX_ID}" type="matrix" values="${MATRICES.NONE}" />
        </filter>
      </defs>
    </svg>`);
}

/**
 * Apply a colorblind simulation filter to the WebGL canvas and update HUD palette.
 * Persists the selection to localStorage.
 *
 * @param mode  The colorblind simulation mode to apply
 */
export function applyColorblindFilter(mode: ColorblindMode): void {
    ensureSvgFilter();

    // 1. Update feColorMatrix values
    const matrixEl = document.getElementById(MATRIX_ID);
    if (matrixEl) matrixEl.setAttribute('values', MATRICES[mode]);

    // 2. Apply / remove CSS filter on the Three.js canvas
    const canvas = document.querySelector<HTMLCanvasElement>('canvas');
    if (canvas) {
        canvas.style.filter = mode === 'NONE' ? '' : `url(#${FILTER_ID})`;
    }

    // 3. Override CSS custom properties for HUD elements
    const root      = document.documentElement;
    const overrides = PALETTE_OVERRIDES[mode];

    // Reset all overrides first
    ['--color-crystal', '--color-toxic', '--color-druid'].forEach(v =>
        root.style.removeProperty(v)
    );

    if (overrides) {
        Object.entries(overrides).forEach(([prop, val]) =>
            root.style.setProperty(prop, val)
        );
    }

    // 4. Persist selection
    localStorage.setItem('dusan-colorblind-mode', mode);
    console.log(`[a11y] Colorblind mode: ${mode}`);
}

/** Restore last saved colorblind mode on app startup */
export function restoreColorblindMode(): void {
    const saved = localStorage.getItem('dusan-colorblind-mode') as ColorblindMode | null;
    if (saved && MATRICES[saved]) {
        applyColorblindFilter(saved);
    }
}
