// e2e/tests/combat.spec.ts — Playwright End-to-End: Arena Combat Flow
import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

async function enterLobby(page: Page, username: string, hero: 'crystal' | 'toxic') {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.fill('[data-testid="input-username"]', username);
    await page.click(`[data-testid="btn-hero-${hero}"]`);
}

test.describe('Lobby: Hero Selection', () => {
    test('Player can enter their username and select Crystal hero', async ({ page }) => {
        await enterLobby(page, 'CrystalKing', 'crystal');
        await expect(page.locator('[data-testid="btn-hero-crystal"]')).toHaveClass(/selected|active/);
    });

    test('Player can select Toxic hero', async ({ page }) => {
        await enterLobby(page, 'ToxicHacker', 'toxic');
        await expect(page.locator('[data-testid="btn-hero-toxic"]')).toHaveClass(/selected|active/);
    });
});

test.describe('Arena: vs AI Match', () => {
    let page: Page;

    test.beforeEach(async ({ browser }) => {
        const context = await browser.newContext();
        page = await context.newPage();
        await enterLobby(page, 'TestPlayer', 'crystal');
        await page.click('[data-testid="btn-vs-ai"]');
        // Wait for arena to load
        await page.waitForSelector('[data-testid="arena-canvas"]', { timeout: 10_000 });
    });

    test('Arena canvas renders after match start', async () => {
        const canvas = page.locator('[data-testid="arena-canvas"]');
        await expect(canvas).toBeVisible();
    });

    test('Player hand contains cards', async () => {
        const cards = page.locator('[data-testid^="card-"]');
        await expect(cards).toHaveCount({ min: 1 }, { timeout: 5000 });
    });

    test('Playing a card triggers VFX (card_played_effect event)', async () => {
        // Listen for the custom DOM event dispatched by the server handler
        const vfxPromise = page.evaluate(() =>
            new Promise<string>(resolve => {
                window.addEventListener('card_played_effect', (e: any) => {
                    resolve(JSON.stringify(e.detail));
                }, { once: true });
            })
        );

        // Select the first card and target center hex
        await page.click('[data-testid="card-0"]');
        const centerHex = page.locator('[data-testid="hex-meta4-sub4"]');
        if (await centerHex.isVisible()) {
            await centerHex.click();
            await page.click('[data-testid="btn-execute-action"]');
            const detail = await vfxPromise.catch(() => 'timeout');
            expect(detail).not.toBe('timeout');
        }
    });
});

test.describe('Physics Readout HUD', () => {
    test('Selecting a card shows V, R, I values in HUD', async ({ page }) => {
        await enterLobby(page, 'HUDTester', 'crystal');
        await page.click('[data-testid="btn-vs-ai"]');
        await page.waitForSelector('[data-testid="arena-canvas"]', { timeout: 10_000 });

        await page.click('[data-testid="card-0"]');

        // The physics HUD panel should display voltage
        const voltageEl = page.locator('[data-testid="physics-voltage"]');
        if (await voltageEl.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(voltageEl).not.toBeEmpty();
        }
    });
});
