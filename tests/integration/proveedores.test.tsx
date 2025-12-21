import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import { SupplierView } from '../../src/components/SupplierView';
import { proveedoresService } from '../../src/services/proveedoresService';
import { useStore } from '../../src/store/useStore';

// Mock dependencies
vi.mock('../../src/services/proveedoresService');
vi.mock('../../src/store/useStore');
vi.mock('../../src/components/common/ExcelImporter', () => ({
    ExcelImporter: () => <button>Importar Excel</button>
}));
vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual };
});

describe('SupplierView Integration', () => {
    const mockSuppliers = [
        { id: '1', name: 'Proveedor A', email: 'a@test.com', phone: '123', leadTime: 1, outletId: 'outlet1' },
        { id: '2', name: 'Proveedor B', email: 'b@test.com', phone: '456', leadTime: 2, outletId: 'outlet1' }
    ];

    const mockAddSupplier = vi.fn();
    const mockUpdateSupplier = vi.fn();
    const mockDeleteSupplier = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useStore as any).mockReturnValue({
            suppliers: mockSuppliers,
            addSupplier: mockAddSupplier,
            updateSupplier: mockUpdateSupplier,
            deleteSupplier: mockDeleteSupplier,
            ingredients: [],
            activeOutletId: 'outlet1'
        });
    });

    it('renders the list of suppliers', () => {
        render(<SupplierView />);
        expect(screen.getByText('Proveedor A')).toBeDefined();
        expect(screen.getByText('Proveedor B')).toBeDefined();
    });

    it('opens create modal when clicking "Nuevo Proveedor"', async () => {
        render(<SupplierView />);
        const newButton = screen.getByText('Nuevo Proveedor');
        fireEvent.click(newButton);
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeDefined();
        expect(within(dialog).getByText('Nuevo Proveedor', { selector: 'h3' })).toBeDefined();
    });

    it('calls create service and store on form submission', async () => {
        (proveedoresService.create as any).mockResolvedValue('new-id');
        render(<SupplierView />);

        fireEvent.click(screen.getByText('Nuevo Proveedor'));

        const dialog = screen.getByRole('dialog');
        // Fill form
        fireEvent.change(within(dialog).getByTestId('supplier-name-input'), { target: { value: 'Nuevo Prov' } });
        fireEvent.change(within(dialog).getByTestId('supplier-email-input'), { target: { value: 'new@test.com' } });

        // Submit
        fireEvent.click(within(dialog).getByTestId('supplier-submit-btn'));

        await waitFor(() => {
            expect(proveedoresService.create).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Nuevo Prov',
                email: 'new@test.com',
                outletId: 'outlet1'
            }));
            expect(mockAddSupplier).toHaveBeenCalledWith(expect.objectContaining({
                id: 'new-id',
                name: 'Nuevo Prov'
            }));
        });
    });

    it('opens edit modal and updates supplier', async () => {
        (proveedoresService.update as any).mockResolvedValue(undefined);
        render(<SupplierView />);

        // Find edit button for first supplier
        const editButtons = screen.getAllByTitle('Editar');
        fireEvent.click(editButtons[0]);

        const dialog = screen.getByRole('dialog');

        expect(within(dialog).getByDisplayValue('Proveedor A')).toBeDefined();

        fireEvent.change(within(dialog).getByTestId('supplier-name-input'), { target: { value: 'Proveedor A Editado' } });
        fireEvent.click(within(dialog).getByTestId('supplier-submit-btn'));

        await waitFor(() => {
            expect(proveedoresService.update).toHaveBeenCalledWith('1', expect.objectContaining({
                name: 'Proveedor A Editado'
            }));
            expect(mockUpdateSupplier).toHaveBeenCalled();
        });
    });

    it('deletes a supplier', async () => {
        (proveedoresService.delete as any).mockResolvedValue(undefined);
        // Mock window.confirm
        vi.spyOn(window, 'confirm').mockImplementation(() => true);

        render(<SupplierView />);
        const deleteButtons = screen.getAllByTitle('Eliminar');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(proveedoresService.delete).toHaveBeenCalledWith('1');
            expect(mockDeleteSupplier).toHaveBeenCalledWith('1');
        });
    });
});
