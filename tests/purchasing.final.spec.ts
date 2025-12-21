import { test, expect } from '@playwright/test';

test.describe('Automatic Purchases Flow', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate to establish origin
        await page.goto('/');

        // Bypass Login with AuthWrapper E2E Hook & Mock DB
        await page.evaluate(() => {
            const today = new Date().toISOString();

            // User Data for AuthWrapper Bypass
            const user = {
                id: 'e2e-admin',
                name: 'E2E Chef',
                role: 'HEAD_CHEF',
                email: 'e2e@chef.com',
                allowedOutlets: ['e2e-outlet'],
                photoURL: null,
                activeOutletId: 'e2e-outlet'
            };
            localStorage.setItem('E2E_TEST_USER', JSON.stringify(user));

            // Initial State for Store (UI State)
            const mockState = {
                state: {
                    activeOutletId: 'e2e-outlet',
                    outlets: [
                        { id: 'e2e-outlet', name: 'E2E Kitchen', type: 'main_kitchen', isActive: true, autoPurchaseSettings: { enabled: true } }
                    ],
                    suppliers: [
                        {
                            id: 'sup-1',
                            name: 'Proveedor E2E',
                            email: 'test@supplier.com',
                            leadTime: 1,
                            orderDays: [],
                            outletId: 'e2e-outlet'
                        }
                    ],
                    purchaseOrders: [], // Orders loaded from E2E_MOCK_DB
                    ingredients: [
                        {
                            id: 'ing-1',
                            name: 'Tomate',
                            unit: 'kg',
                            costPerUnit: 2.5,
                            supplierId: 'sup-1',
                            outletId: 'e2e-outlet',
                            stock: 5,
                            reorderPoint: 10
                        }
                    ]
                },
                version: 0
            };
            localStorage.setItem('kitchen-manager-storage', JSON.stringify(mockState));

            // Mock DB (Service Layer Data)
            const mockDB = {
                purchaseOrders: [
                    {
                        id: 'po-e2e-1',
                        orderNumber: 'PED-E2E-001',
                        outletId: 'e2e-outlet',
                        supplierId: 'sup-1',
                        supplierName: 'Proveedor E2E',
                        status: 'DRAFT',
                        date: today,
                        items: [{
                            id: 'item-1',
                            ingredientId: 'ing-1',
                            name: 'Tomate',
                            quantity: 10,
                            unit: 'kg',
                            costPerUnit: 2.5,
                            tempDescription: 'Tomate'
                        }],
                        totalCost: 25,
                        type: 'AUTOMATIC',
                        createdAt: today,
                        updatedAt: today
                    }
                ]
            };
            localStorage.setItem('E2E_MOCK_DB', JSON.stringify(mockDB));
        });

        await page.reload();
    });

    test('should approve, send, and receive a purchase order', async ({ page }) => {
        // Global Dialog Handler: Accept all confirms and alerts
        page.on('dialog', async dialog => {
            console.log(`Dialog message: ${dialog.message()}`);
            await dialog.accept();
        });

        // 1. Navigate to Purchasing View
        await page.getByRole('link', { name: 'Compras Auto' }).click();

        // 2. Verify we are on the Dashboard
        await expect(page.getByText('Gestion de Compras')).toBeVisible();

        // 3. Switch to Approval Tab (Aprobación)
        await page.getByRole('button', { name: 'Aprobación' }).click();

        // 4. Find the Draft Order by Order Number
        const orderCard = page.getByText('PED-E2E-001');
        await expect(orderCard).toBeVisible();

        // Click on the order to see details 
        await orderCard.click();

        // 5. Approve Order
        // Wait for details panel to populate
        await expect(page.getByText('ID: po-e2e-1')).toBeVisible();

        const approveBtn = page.getByRole('button', { name: 'Aprobar' });
        await expect(approveBtn).toBeVisible();

        await approveBtn.click();

        // Wait for Details Panel to close (indicating action finished)
        await expect(page.getByText('ID: po-e2e-1')).not.toBeVisible();

        // 6. Send Order
        // The order is now APPROVED, so it disappears from DRAFT list.
        // We must switch filter to 'APPROVED'.
        await page.getByRole('button', { name: 'APPROVED' }).click();

        // Find and Click order again to open details
        // Wait for list to update by checking visibility first
        await expect(page.getByText('PED-E2E-001')).toBeVisible();
        await page.getByText('PED-E2E-001').click();

        // Now "Enviar a Proveedor" button should appear.
        const sendBtn = page.getByRole('button', { name: 'Enviar a Proveedor' });
        await expect(sendBtn).toBeVisible();
        await sendBtn.click();

        // 7. Switch to Receiving Tab (Recepción)
        // Wait slightly for any transition
        await page.waitForTimeout(500);
        await page.getByRole('button', { name: 'Recepción' }).click();

        // 8. Find the Order (Status ORDERED)
        await expect(page.getByText('PED-E2E-001')).toBeVisible();
        // In Receiving, the list might be different. If it's the same card style, click works.
        await page.getByText('PED-E2E-001').click();

        // 9. Receive Order
        const receiveBtn = page.getByRole('button', { name: 'Confirmar Entrada' });
        await expect(receiveBtn).toBeVisible();

        await receiveBtn.click();
        // Dialog handler will accept confirm, then accept alert.

        // 10. Verify Completed
        // Should disappear from list or update status
        await expect(page.getByText('PED-E2E-001')).not.toBeVisible();
    });
});
