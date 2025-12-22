import { test, expect } from '@playwright/test';

test.describe('Multi-Outlet Isolation E2E', () => {

    const BAR_USER = {
        id: 'bar-user-id',
        name: 'Bar Manager',
        role: 'USER',
        email: 'bar-user@test.com',
        allowedOutlets: ['outlet-bar'],
        activeOutletId: 'outlet-bar'
    };

    const ADMIN_USER = {
        id: 'admin-user-id',
        name: 'Global Admin',
        role: 'ADMIN',
        email: 'admin@test.com',
        allowedOutlets: ['outlet-bar', 'outlet-kitchen'],
        activeOutletId: 'outlet-bar'
    };

    const setupMockState = async (page, user, outletId) => {
        await page.evaluate(({ user, outletId }) => {
            // 1. Initial State for Store (UI/Auth State)
            const mockState = {
                state: {
                    currentUser: user,
                    activeOutletId: outletId,
                    outlets: [
                        { id: 'outlet-bar', name: 'Bar Central', type: 'bar', isActive: true },
                        { id: 'outlet-kitchen', name: 'Cocina Principal', type: 'main_kitchen', isActive: true }
                    ],
                    ingredients: [], // Will be loaded from Mock DB via sync
                    recipes: [],
                    staff: [],
                    suppliers: [],
                    fichasTecnicas: []
                },
                version: 0
            };
            localStorage.setItem('kitchen-manager-storage', JSON.stringify(mockState));
            localStorage.setItem('E2E_TEST_USER', JSON.stringify(user));

            // 2. Mock DB Data (Service Layer)
            const mockDB = {
                ingredients: [
                    { id: 'ing-bar', name: 'Ginebra Premium', outletId: 'outlet-bar', stock: 10, unit: 'botella', costPerUnit: 20 },
                    { id: 'ing-kitchen', name: 'Solomillo', outletId: 'outlet-kitchen', stock: 5, unit: 'kg', costPerUnit: 25 }
                ],
                recipes: [
                    { id: 'rec-bar', name: 'Gin Tonic', nombre: 'Gin Tonic', outletId: 'outlet-bar', ingredients: [] },
                    { id: 'rec-kitchen', name: 'Solomillo al Whisky', nombre: 'Solomillo al Whisky', outletId: 'outlet-kitchen', ingredients: [] }
                ],
                outlets: [
                    { id: 'outlet-bar', name: 'Bar Central', type: 'bar', isActive: true },
                    { id: 'outlet-kitchen', name: 'Cocina Principal', type: 'main_kitchen', isActive: true }
                ]
            };
            localStorage.setItem('E2E_MOCK_DB', JSON.stringify(mockDB));
        }, { user, outletId });
    };

    test.beforeEach(async ({ page }) => {
        // Go to root to establish origin
        await page.goto('/');
    });

    test('01 - User of one outlet does not see data from another', async ({ page }) => {
        await setupMockState(page, BAR_USER, 'outlet-bar');
        await page.reload();

        // 1. Check Ingredients
        await page.getByRole('link', { name: 'Ingredientes' }).click();
        await expect(page.getByText('Ginebra Premium')).toBeVisible();
        await expect(page.getByText('Solomillo')).not.toBeVisible();

        // 2. Check Recipes
        await page.getByRole('link', { name: 'Recetas' }).click();
        await expect(page.getByText('Gin Tonic')).toBeVisible();
        await expect(page.getByText('Solomillo al Whisky')).not.toBeVisible();
    });

    test('02 - Admin can switch between outlets and see different data', async ({ page }) => {
        await setupMockState(page, ADMIN_USER, 'outlet-bar');
        await page.reload();

        // Initially in Bar
        await page.getByRole('link', { name: 'Ingredientes' }).click();
        await expect(page.getByText('Ginebra Premium')).toBeVisible();
        await expect(page.getByText('Solomillo')).not.toBeVisible();

        // Switch Outlet via Selector
        await page.getByText('Bar Central').click();
        await page.getByText('Cocina Principal').click();

        // Verify data updated to Kitchen
        await expect(page.getByText('Solomillo')).toBeVisible();
        await expect(page.getByText('Ginebra Premium')).not.toBeVisible();
    });

    test('03 - Cross-outlet data isolation in search', async ({ page }) => {
        await setupMockState(page, BAR_USER, 'outlet-bar');
        await page.reload();

        await page.getByRole('link', { name: 'Ingredientes' }).click();

        // Search for item that belongs to OTHER outlet
        const searchInput = page.getByPlaceholder('Buscar ingrediente...');
        await searchInput.fill('Solomillo');

        // Should not appear even with explicit search
        await expect(page.getByText('Solomillo')).not.toBeVisible();

        // Search for item that belongs to CURRENT outlet
        await searchInput.fill('Ginebra');
        await expect(page.getByText('Ginebra Premium')).toBeVisible();
    });

});
