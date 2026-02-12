import { test, expect } from '@playwright/test';

test('Stability Agent - Core App Health', async ({ page }) => {
    test.setTimeout(30000);

    // 1. Load Application
    console.log('Loading Application...');
    await page.goto('/');

    // 2. Check Core Layout
    await expect(page).toHaveTitle(/Helios/);
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('text=Nutrient Matrix')).toBeVisible();
    await expect(page.locator('text=Core Energy').first()).toBeVisible();
    // Actually NutrientMatrix might just show the matrix grid.

    // Check "What did you eat?" header
    await expect(page.locator('text=What did you eat?')).toBeVisible();

    // 3. Verify Components Render without Error
    const nutrientMatrix = page.locator('.col-span-2, .lg\\:col-span-2').first();
    await expect(nutrientMatrix).toBeVisible();

    const entryFeed = page.locator('text=Log History');
    await expect(entryFeed).toBeVisible();

    // 4. Test Input Interaction
    const input = page.locator('textarea, input[type="text"]').first();
    await expect(input).toBeVisible();
    await expect(input).toBeEditable();
    await input.fill('Testing input stability');
    await expect(input).toHaveValue('Testing input stability');

    // 5. Date Navigator
    const dateNav = page.locator('input[type="date"]').first();
    await expect(dateNav).toBeVisible();

    console.log('Stability Checks Passed!');
});
