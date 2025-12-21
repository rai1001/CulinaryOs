import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { RecepcionPedido } from '../../src/components/purchasing/RecepcionPedido';
import { pedidosService } from '../../src/services/pedidosService';
import { recepcionService } from '../../src/services/recepcionService';
import { useStore } from '../../src/store/useStore';

// Mocks
vi.mock('../../src/services/pedidosService');
vi.mock('../../src/services/recepcionService');
vi.mock('../../src/store/useStore');
vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual };
});

describe('RecepcionPedido Integration', () => {
    const mockOrder = {
        id: 'o_rcv_1',
        orderNumber: 'PED-RCV-001',
        supplierId: 'sup1',
        status: 'ORDERED',
        date: new Date().toISOString(),
        items: [
            { ingredientId: 'i1', quantity: 10, unit: 'kg', tempDescription: 'Papas' }
        ],
        totalCost: 50,
        outletId: 'outlet1'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (pedidosService.getAll as any).mockResolvedValue([mockOrder]);
        (useStore as any).mockReturnValue({ user: { id: 'u1' } });
        window.confirm = vi.fn(() => true);
        window.alert = vi.fn();
    });

    it('displays orders ready to receive', async () => {
        render(<RecepcionPedido outletId="outlet1" />);
        await waitFor(() => {
            expect(screen.getByText('PED-RCV-001')).toBeDefined();
        });
    });

    it('selects an order and shows verify form', async () => {
        render(<RecepcionPedido outletId="outlet1" />);
        await waitFor(() => screen.getByText('PED-RCV-001'));

        fireEvent.click(screen.getByText('PED-RCV-001'));

        expect(screen.getByText('Papas')).toBeDefined();
        expect(screen.getByDisplayValue('10')).toBeDefined(); // Quantity input
    });

    it('submits reception and calls service', async () => {
        render(<RecepcionPedido outletId="outlet1" />);
        await waitFor(() => screen.getByText('PED-RCV-001'));

        fireEvent.click(screen.getByText('PED-RCV-001'));

        // Click Confirm
        fireEvent.click(screen.getByText('Confirmar Entrada'));

        await waitFor(() => {
            expect(recepcionService.receiveOrder).toHaveBeenCalledWith(
                mockOrder,
                expect.arrayContaining([
                    expect.objectContaining({ ingredientId: 'i1', quantity: 10 })
                ]),
                'u1'
            );
        });
    });
});
