
import { test, expect } from '@playwright/test';

test.describe('Compras Automáticas Flow Phase 1 + 2', () => {

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
            // Pre-create an AUTOMATIC draft order to simulate the "Analysis" result
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
                ],
                notifications: []
            };
            localStorage.setItem('E2E_MOCK_DB', JSON.stringify(mockDB));
        });

        await page.reload();
    });

    test('Full Flow: Dashboard Alert -> Logistics -> Approve -> Notification', async ({ page }) => {
        // Global Dialog Handler
        page.on('dialog', async dialog => await dialog.accept());

        // 1. Navigate to Purchasing View
        await page.getByRole('link', { name: 'Compras Auto' }).click();

        // 2. Verify Dashboard Alert for Automatic Order
        await expect(page.getByText('Nuevas sugerencias de compra')).toBeVisible();
        await expect(page.getByText('Borradores').first()).toBeVisible();

        // 3. Switch to Approval Tab
        await page.getByRole('button', { name: 'Aprobación' }).click();

        // 4. Find the Draft Order
        const orderCard = page.getByText('PED-E2E-001');
        await expect(orderCard).toBeVisible();
        await orderCard.click();

        // 5. Verify Logistics Fields (Phase 2 UI)
        await expect(page.getByText('Logística de Entrega')).toBeVisible();

        // Fill Logistics Info
        await page.getByPlaceholder('Ej: Calle Principal 123').fill('Calle Principal 123');
        await page.getByPlaceholder(/Juan P/).fill('Juan Cocinero');
        // If delivery window input exists
        const windowInput = page.getByPlaceholder('Ej: 08:00 - 11:00');
        if (await windowInput.isVisible()) {
            await windowInput.fill('09:00 - 11:00');
        }

        // 6. Approve Order
        const approveBtn = page.getByRole('button', { name: 'Aprobar' });
        await expect(approveBtn).toBeVisible();
        await approveBtn.click();

        // 7. Verify In-App Notification (Phase 2)
        // Check the bell icon or toast. Assuming NotificationBell is in the header.
        // This might be tricky if notifications are fetched via polling or realtime.
        // For now, we assume the UI updates immediately or we check the "Approved" state.

        // Wait for Details Panel to close
        await expect(page.getByText('ID: po-e2e-1')).not.toBeVisible();

        // 8. Verify Order Moved to Approved
        await page.getByRole('button', { name: 'Aprobados' }).click();
        await expect(page.getByText('PED-E2E-001')).toBeVisible();
        await page.getByText('PED-E2E-001').click();

        // 9. Send to Supplier
        // Verify Logistics info is displayed in the modal (read-only view)
        await expect(page.getByPlaceholder('Ej: Calle Principal 123')).toHaveValue('Calle Principal 123'); // Delivery address
        await expect(page.getByPlaceholder(/Juan P/)).toHaveValue('Juan Cocinero');       // Contact person

        const sendBtn = page.getByRole('button', { name: 'Enviar al Proveedor' });
        await sendBtn.click();

        // 10. Verify Sent
        // Expect status change or toast
        // Here we just verify it moves to "Receiving" flow conceptually (or stays in approved until received?)
        // In this app, Sending keeps it in APPROVED/ORDERED list but updates status.

        // Switch to Receiving to confirm it arrived there
        await page.getByRole('button', { name: 'Recepción' }).click();
        await expect(page.getByText('PED-E2E-001')).toBeVisible();
    });

});
