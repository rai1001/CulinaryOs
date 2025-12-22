
import { test, expect } from '@playwright/test';

test.describe('Fichas Técnicas & Analytics E2E', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');

        await page.evaluate(() => {
            const today = new Date().toISOString();
            const user = {
                id: 'e2e-chef',
                name: 'E2E Chef Analytics',
                role: 'HEAD_CHEF',
                email: 'analytics@chef.com',
                allowedOutlets: ['e2e-outlet'],
                activeOutletId: 'e2e-outlet'
            };
            localStorage.setItem('E2E_TEST_USER', JSON.stringify(user));

            const mockState = {
                state: {
                    activeOutletId: 'e2e-outlet',
                    outlets: [{ id: 'e2e-outlet', name: 'E2E Kitchen', type: 'main_kitchen', isActive: true }],
                    ingredients: [
                        { id: 'ing-1', name: 'Solomillo', unit: 'kg', costPerUnit: 25, outletId: 'e2e-outlet' },
                        { id: 'ing-2', name: 'Patata', unit: 'kg', costPerUnit: 1.2, outletId: 'e2e-outlet' }
                    ],
                    recipes: [
                        { id: 'rec-1', name: 'Solomillo al Whisky', totalCost: 5, yieldPax: 1, ingredients: [{ ingredientId: 'ing-1', quantity: 0.2 }] },
                        { id: 'rec-2', name: 'Tortilla de Patatas', totalCost: 1.2, yieldPax: 8, ingredients: [{ ingredientId: 'ing-2', quantity: 1 }] }
                    ],
                    menus: [
                        { id: 'men-1', name: 'Menu Degustación', recipeIds: ['rec-1', 'rec-2'], sellPrice: 45 }
                    ],
                    events: [
                        { id: 'eve-1', name: 'Cena Gala', date: today, pax: 20, menuId: 'men-1', outletId: 'e2e-outlet' }
                    ]
                },
                version: 0
            };
            localStorage.setItem('kitchen-manager-storage', JSON.stringify(mockState));

            const mockDB = {
                fichasTecnicas: [
                    {
                        id: 'ficha-1',
                        nombre: 'Solomillo al Whisky',
                        categoria: 'comida',
                        porciones: 1,
                        dificultad: 'media',
                        outletId: 'e2e-outlet',
                        ingredientes: [
                            { ingredienteId: 'ing-1', nombre: 'Solomillo', cantidad: 0.2, unidad: 'kg', costoUnitario: 25, costoTotal: 5, esOpcional: false }
                        ],
                        costos: { ingredientes: 5, total: 5, porPorcion: 5 },
                        pricing: { precioVentaSugerido: 18, margenBruto: 72, margenObjetivo: 70 },
                        createdAt: today,
                        updatedAt: today
                    },
                    {
                        id: 'ficha-2',
                        nombre: 'Tortilla de Patatas',
                        categoria: 'comida',
                        porciones: 8,
                        dificultad: 'baja',
                        outletId: 'e2e-outlet',
                        ingredientes: [
                            { ingredienteId: 'ing-2', nombre: 'Patata', cantidad: 1, unidad: 'kg', costoUnitario: 1.2, costoTotal: 1.2, esOpcional: false }
                        ],
                        costos: { ingredientes: 1.2, total: 1.2, porPorcion: 0.15 },
                        pricing: { precioVentaSugerido: 12, margenBruto: 90, margenObjetivo: 70 },
                        createdAt: today,
                        updatedAt: today
                    }
                ]
            };
            localStorage.setItem('E2E_MOCK_DB', JSON.stringify(mockDB));
        });

        await page.reload();
    });

    test('should navigate through dashboard and view profitability analysis', async ({ page }) => {
        // 1. Go to Dashboard
        await page.getByRole('link', { name: 'Fichas Técnicas' }).click();

        // 2. Verify Dashboard content
        await expect(page.getByText('Fichas Técnicas', { exact: true })).toBeVisible();
        await expect(page.getByText('Total Fichas')).toBeVisible();
        await expect(page.getByText('2', { exact: true }).first()).toBeVisible();

        // 3. Search and Filter
        await page.getByPlaceholder('Busca por nombre o categoría...').fill('Solomillo');
        const displayArea = page.getByTestId('fichas-results');
        await expect(displayArea.getByText('Solomillo al Whisky')).toBeVisible();
        await expect(displayArea.getByText('Tortilla de Patatas')).not.toBeVisible();

        // Clear search
        await page.getByPlaceholder('Busca por nombre o categoría...').fill('');

        // 4. Go to Analysis Pro
        const analysisBtn = page.getByRole('button', { name: 'Ver Análisis Pro' });
        await expect(analysisBtn).toBeVisible();
        await analysisBtn.click();

        // 5. Verify Analysis Page
        await expect(page.getByText('Análisis de Rentabilidad')).toBeVisible();
        await expect(page.getByText('Márgenes por Categoría')).toBeVisible();
        await expect(page.getByText('Hub de Optimización')).toBeVisible();

        // 6. Test Comparator
        const multiSelect = page.locator('.react-select-container');
        await expect(multiSelect).toBeVisible();

        // Select dishes for comparison
        await multiSelect.click();
        await page.keyboard.type('Solomillo');
        await page.keyboard.press('Enter');

        await multiSelect.click();
        await page.keyboard.type('Tortilla');
        await page.keyboard.press('Enter');

        // Check if comparator shows the table
        await expect(page.getByText('Comparador de Rendimiento')).toBeVisible();
        await expect(page.getByRole('table')).toBeVisible();
        await expect(page.getByText('72%')).toBeVisible(); // Solomillo margin
        await expect(page.getByText('90%')).toBeVisible(); // Tortilla margin
    });
});
