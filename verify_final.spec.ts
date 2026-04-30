
import { test, expect } from '@playwright/test';

test('verify analysis navigation and tabs', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Use Guest Login
    const guestBtn = page.getByRole('button', { name: /Vendég Bejelentkezés/i });
    await expect(guestBtn).toBeVisible({ timeout: 10000 });
    await guestBtn.click();

    // Wait for Dashboard
    await expect(page.getByText(/Üdv, Utazó/i)).toBeVisible({ timeout: 15000 });

    // Open Menu
    const menuBtn = page.getByLabel('Menü');
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    // Navigate to Elemzés
    const analysisBtn = page.getByRole('button', { name: /Elemzés/i });
    await expect(analysisBtn).toBeVisible();
    await analysisBtn.click();

    // Verify Analysis View is open
    await expect(page.getByRole('button', { name: /📊 Statisztika/i })).toBeVisible();

    // Change Time Range to see comparison button
    await page.getByRole('button', { name: /30 nap/i }).click();

    // Test Comparison toggle exists
    const compareBtn = page.getByText(/⚖️ Összehasonlítás/i);
    await expect(compareBtn).toBeVisible();

    // Change tab to Numerology
    await page.getByRole('button', { name: /🔢 Számmisztika/i }).click();
    await expect(page.getByText(/Személyes Számmisztika/i)).toBeVisible();

    // Go to Havi Összesítő
    await page.getByRole('button', { name: /📅 Havi Összesítő/i }).click();
    await expect(page.getByText(/Ebben a hónapban nem végeztél húzást/i)).toBeVisible();

    // Go to Soul Compass
    await page.getByRole('button', { name: /🧭 Lelki Iránytű/i }).click();
    await expect(page.getByRole('heading', { name: /Lelki Iránytű/i })).toBeVisible();

    await page.screenshot({ path: 'analysis_verified.png', fullPage: true });
});
