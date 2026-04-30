
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 720 } });

test('Daily Reading Insights Verification', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for guest login button and click it
    const guestBtn = page.getByRole('button', { name: /Vendég Bejelentkezés/i });
    await guestBtn.waitFor({ state: 'visible' });
    await guestBtn.click();

    // Wait for dashboard
    await page.waitForSelector('button:has-text("Összes")', { timeout: 20000 });

    // Switch to "Összes" category
    await page.getByRole('button', { name: 'Összes' }).click({ force: true });

    // Find and click Napi Húzás
    await page.getByText('Napi Húzás').first().click({ force: true });

    // Wait for the ReadingView to load
    await page.waitForSelector('h2:has-text("Napi Húzás")', { timeout: 10000 });

    // Click the card slot in the grid
    await page.locator('span').filter({ hasText: /^A Kártya$/ }).first().click({ force: true });

    // Wait for selector modal to open
    await page.waitForSelector('.fixed.inset-0', { timeout: 10000 });

    // Select first card in modal
    await page.locator('.fixed.inset-0 .grid .group').first().click({ force: true });

    // Modal should close
    await page.waitForSelector('.fixed.inset-0', { state: 'hidden', timeout: 5000 });

    // Click Save (Mentés) - Use exact match to avoid conflict with "Mentés & Telepítés"
    await page.getByRole('button', { name: 'Mentés', exact: true }).click({ force: true });

    // Wait for ReadingAnalysis to appear and the new tab to be visible
    const dailyTab = page.getByRole('button', { name: 'Napi Útravaló' });
    await expect(dailyTab).toBeVisible({ timeout: 15000 });

    // Click it
    await dailyTab.click();

    // Check features
    await expect(page.getByText('Napi Fókusz')).toBeVisible();
    await expect(page.getByText('Elemi Hangolódás')).toBeVisible();
    await expect(page.getByText('Napi Mikro-Kihívás')).toBeVisible();

    await page.screenshot({ path: 'debug_final_success.png' });
});
