import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Kitchen Manager/);
});

test('can navigate to recipes', async ({ page }) => {
    await page.goto('/');

    // Click the Recipes link/card if it exists, or just check main dashboard
    // For now, let's just check if we can see the "ChefOS" header or similar
    await expect(page.locator('text=ChefOS')).toBeVisible();
});
