import { test, expect } from '@playwright/test';
import { login } from './login.spec';

test.describe('Purchasing Module (Compras)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page.getByText('ChefOS').first()).toBeVisible();
  });

  test('Create Supplier and Verify Purchasing Page', async ({ page }) => {
    test.setTimeout(90000);

    // --- 1. Create Supplier ---
    // Navigate to Suppliers
    const suppliersLink = page.getByRole('link', { name: 'Proveedores' });
    if (!(await suppliersLink.isVisible())) {
       // Expand Gestion Base if needed
       const gb = page.getByRole('button', { name: /Gestión Base/i });
       if (await gb.isVisible()) await gb.click();
    }
    await suppliersLink.click();

    // Check if supplier exists
    const supplierName = 'Proveedor Test Auto';
    const existingSupplier = page.getByText(supplierName).first();

    if (!(await existingSupplier.isVisible())) {
      // Create New
      await page.getByRole('button', { name: 'Nuevo Proveedor' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Fill Form (Name is usually the first input)
      await page.locator('input[type="text"]').first().fill(supplierName);
      // Fill Email (usually found by type email)
      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.count() > 0) {
          await emailInput.first().fill('proveedor@auto.test');
      }

      await page.getByRole('button', { name: /Guardar/i }).click();

      // Verify creation
      await expect(page.getByText(supplierName).first()).toBeVisible();
    }

    // --- 2. Verify Purchasing Module Loads ---
    // Navigate to Purchasing
    const purchasingLink = page.getByRole('link', { name: 'Compras Auto' });
    if (!(await purchasingLink.isVisible())) {
         const logistica = page.getByRole('button', { name: /Logística/i });
         if (await logistica.isVisible()) await logistica.click();
    }
    await purchasingLink.click();

    // Verify Title and Generate Button
    await expect(page.getByRole('heading', { name: /Compras|Pedidos/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Generar Pedido/i }).first()).toBeVisible();
  });
});
