# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/check_daily_tab.spec.ts >> Daily Insight tab is visible in AnalysisView for 1-card readings
- Location: tests/check_daily_tab.spec.ts:4:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:8000/?force=true
Call log:
  - navigating to "http://localhost:8000/?force=true", waiting until "load"

```

# Test source

```ts
  1  |
  2  | import { test, expect } from '@playwright/test';
  3  |
  4  | test('Daily Insight tab is visible in AnalysisView for 1-card readings', async ({ page }) => {
> 5  |     await page.goto('http://localhost:8000/?force=true');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:8000/?force=true
  6  |
  7  |     // Login
  8  |     await page.fill('input[type="email"]', 'admin@arkantum.hu');
  9  |     await page.fill('input[type="password"]', 'admin123');
  10 |     await page.click('button:has-text("Belépés")');
  11 |
  12 |     // Go to Analysis
  13 |     await page.click('button[aria-label="Menü"]');
  14 |     await page.click('button:has-text("Elemzés")');
  15 |
  16 |     // Check if "Napi" tab exists (assuming there is at least one 1-card reading)
  17 |     const dailyTab = page.locator('button:has-text("Napi")');
  18 |     const isVisible = await dailyTab.isVisible();
  19 |     console.log('Daily tab visible in AnalysisView:', isVisible);
  20 |
  21 |     if (isVisible) {
  22 |         await dailyTab.click();
  23 |         await expect(page.locator('h2:has-text("Napi Útravaló")')).toBeVisible();
  24 |     }
  25 |
  26 |     // Check in History
  27 |     await page.click('button:has-text("Vissza")');
  28 |     await page.click('button[aria-label="Menü"]');
  29 |     await page.click('button:has-text("Napló")');
  30 |
  31 |     // Find a 1-card reading (Napi Húzás)
  32 |     const reading = page.locator('div:has-text("Napi Húzás")').first();
  33 |     if (await reading.isVisible()) {
  34 |         await reading.click();
  35 |         const detailTab = page.locator('button:has-text("Napi Útravaló")');
  36 |         console.log('Daily tab visible in ReadingAnalysis:', await detailTab.isVisible());
  37 |         await expect(detailTab).toBeVisible();
  38 |     }
  39 | });
  40 |
```