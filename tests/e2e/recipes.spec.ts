import { test, expect } from '@playwright/test';
import { login } from './login.spec';

test.describe('Fichas Técnicas (Recipes) Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page.getByText('ChefOS').first()).toBeVisible();
    await page.waitForTimeout(1000);
  });

  test('Create Recipe and Verify Costs', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Manual Navigation
    const menuButton = page.getByRole('button', { name: /Estrategia Menús/i });
    if (await menuButton.isVisible()) {
        await menuButton.click();
    }

    const link = page.getByRole('link', { name: 'Fichas Técnicas' });
    await expect(link).toBeVisible();
    await link.click();

    // 2. Wait for Title
    await expect(page.getByRole('heading', { name: 'Fichas Técnicas' }).first()).toBeVisible({ timeout: 10000 });

    // 3. Click "Nueva Ficha"
    await page.getByRole('button', { name: 'Nueva Ficha' }).click();

    // 4. Verify Form
    const nameInput = page.getByPlaceholder('Nombre de la receta');
    await expect(nameInput).toBeVisible();

    // 5. Fill Name
    const recipeName = `Receta Auto ${Date.now()}`;
    await nameInput.fill(recipeName);

    // 6. Verify Cost
    await expect(page.getByText('Costo Total').first()).toBeVisible();

    // 7. Save
    const saveButton = page.getByRole('button', { name: 'Guardar Ficha' });
    if (await saveButton.isVisible()) {
        await saveButton.click();
        await expect(page.getByRole('heading', { name: 'Fichas Técnicas' }).first()).toBeVisible();
    }
  });
});
