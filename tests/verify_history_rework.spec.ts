
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 720 } });

test('History View Rework Verification', async ({ page }) => {
    await page.goto('http://localhost:5173'); // Vite port

    // Wait for the app to load
    await page.waitForSelector('#root');

    // Check if we are on the landing/auth page
    const guestBtn = page.getByRole('button', { name: /Vendég Bejelentkezés/i });
    if (await guestBtn.isVisible()) {
        await guestBtn.click();
    }

    // Wait for dashboard
    await page.waitForSelector('h1:has-text("Arkánum")', { timeout: 30000 });

    // Open History (Napló) - it might be in the quick actions or menu
    // Based on previous knowledge, 'history' is one of the quick actions.
    const historyBtn = page.locator('button').filter({ hasText: 'Napló' }).first();
    if (await historyBtn.isVisible()) {
        await historyBtn.click();
    } else {
        // Try to find it in the navigation if exists
        const menuBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
        await menuBtn.click();
        await page.getByText('Napló').click();
    }

    // Verify History View elements
    await expect(page.getByText('Az Idő Fonalai')).toBeVisible({ timeout: 10000 });

    // Check for Back button
    await expect(page.locator('button[title="Vissza a főoldalra"]')).toBeVisible();

    // Check for Sort selector
    const sortSelect = page.locator('select').first();
    await expect(sortSelect).toBeVisible();
    await expect(sortSelect).toContainText('Legújabb elől');

    // Check for Compactness (indirectly via screenshots)
    await page.screenshot({ path: 'history_view_compact.png' });

    // Test back button
    await page.locator('button[title="Vissza a főoldalra"]').click();
    await expect(page.locator('h1:has-text("Arkánum")')).toBeVisible();
});
