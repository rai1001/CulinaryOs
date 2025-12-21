import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import { AprobacionPedido } from '../../src/components/purchasing/AprobacionPedido';
import { pedidosService } from '../../src/services/pedidosService';
import { aprobacionService } from '../../src/services/aprobacionService';
import { useStore } from '../../src/store/useStore';

// Mocks
vi.mock('../../src/services/pedidosService');
vi.mock('../../src/services/aprobacionService');
vi.mock('../../src/store/useStore');
vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual };
});

describe('AprobacionPedido Integration', () => {
    const mockOrders = [
        {
            id: 'o1',
            orderNumber: 'PED-001',
            supplierId: 'sup1',
            status: 'DRAFT',
            date: new Date().toISOString(),
            items: [{ ingredientId: 'i1', quantity: 10, unit: 'kg', tempDescription: 'Tomates' }],
            totalCost: 100
        },
        {
            id: 'o2',
            orderNumber: 'PED-002',
            supplierId: 'sup1',
            status: 'APPROVED',
            date: new Date().toISOString(),
            items: [],
            totalCost: 200
        }
    ];

    const mockUser = { id: 'u1', name: 'Chef', role: 'HEAD_CHEF' };

    beforeEach(() => {
        vi.clearAllMocks();
        (pedidosService.getAll as any).mockResolvedValue(mockOrders);
        (useStore as any).mockReturnValue({ user: mockUser });
        window.confirm = vi.fn(() => true); // Auto-confirm
        window.alert = vi.fn();
    });

    it('renders list of orders', async () => {
        render(<AprobacionPedido outletId="outlet1" />);

        await waitFor(() => {
            expect(screen.getByText('PED-001')).toBeDefined();
        });
        // PED-002 might be hidden if filter default is DRAFT, let's check
        // Default filter is DRAFT in component
    });

    it('filters orders by status', async () => {
        render(<AprobacionPedido outletId="outlet1" />);

        await waitFor(() => {
            expect(screen.getByText('PED-001')).toBeDefined();
        });

        // Switch to APPROVED
        fireEvent.click(screen.getByText('APPROVED'));

        await waitFor(() => {
            expect(screen.getByText('PED-002')).toBeDefined();
            expect(screen.queryByText('PED-001')).toBeNull();
        });
    });

    it('selects an order and shows details', async () => {
        render(<AprobacionPedido outletId="outlet1" />);

        await waitFor(() => {
            expect(screen.getByText('PED-001')).toBeDefined();
        });

        fireEvent.click(screen.getByText('PED-001'));

        expect(screen.getByText('Tomates')).toBeDefined();
        expect(screen.getByText('Aprobar')).toBeDefined();
    });

    it('approves an order', async () => {
        render(<AprobacionPedido outletId="outlet1" />);

        await waitFor(() => expect(screen.getByText('PED-001')).toBeDefined());
        fireEvent.click(screen.getByText('PED-001'));

        fireEvent.click(screen.getByText('Aprobar'));

        await waitFor(() => {
            expect(aprobacionService.approveOrder).toHaveBeenCalledWith('o1', 'u1');
        });
    });
});
