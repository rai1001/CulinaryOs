import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    crearFichaTecnica,
    actualizarFichaTecnica,
    duplicarFicha,
    obtenerFichaTecnica
} from '../../src/services/fichasTecnicasService';
import { firestoreService } from '../../src/services/firestoreService';
import * as costosService from '../../src/services/costosService';

// Mock services
vi.mock('../../src/services/firestoreService', () => ({
    firestoreService: {
        getById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        query: vi.fn()
    }
}));

vi.mock('../../src/services/costosService', () => ({
    calcularCostosFicha: vi.fn()
}));

describe('fichasTecnicasService', () => {
    const userId = 'user-123';
    const mockFicha = {
        id: 'f-1',
        nombre: 'Test Recipe',
        version: 1,
        activa: true,
        ingredientes: [],
        costos: { total: 10, porPorcion: 2.5 },
        pricing: {}
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('crearFichaTecnica', () => {
        it('should create a ficha with calculated costs', async () => {
            (costosService.calcularCostosFicha as any).mockResolvedValue({ total: 15, porPorcion: 3.75 });
            (firestoreService.create as any).mockResolvedValue('generated-id');

            const dto = { nombre: 'New Ficha', porciones: 4, ingredientes: [] };
            const result = await crearFichaTecnica(dto as any, userId);

            expect(result.id).toBe('generated-id');
            expect(result.version).toBe(1);
            expect(result.costos.total).toBe(15);
            expect(firestoreService.create).toHaveBeenCalled();
        });
    });

    describe('actualizarFichaTecnica', () => {
        it('should create a new version when updating', async () => {
            (firestoreService.getById as any).mockResolvedValue(mockFicha);
            (costosService.calcularCostosFicha as any).mockResolvedValue({ total: 20, porPorcion: 5 });

            const updates = { nombre: 'Updated Name', ingredientes: [{ id: 'i1' }] };
            const result = await actualizarFichaTecnica('f-1', updates as any, userId, true);

            expect(result.version).toBe(2);
            expect(firestoreService.create).toHaveBeenCalled(); // Version snapshot
            expect(firestoreService.update).toHaveBeenCalled(); // Update main doc
        });

        it('should update without new version if specified', async () => {
            (firestoreService.getById as any).mockResolvedValue(mockFicha);
            const updates = { nombre: 'Minor Fix' };
            const result = await actualizarFichaTecnica('f-1', updates as any, userId, false);

            expect(result.version).toBe(1);
            expect(firestoreService.create).not.toHaveBeenCalled();
            expect(firestoreService.update).toHaveBeenCalled();
        });
    });

    describe('duplicarFicha', () => {
        it('should create a new ficha based on original', async () => {
            (firestoreService.getById as any).mockResolvedValue(mockFicha);
            (costosService.calcularCostosFicha as any).mockResolvedValue(mockFicha.costos);
            (firestoreService.create as any).mockResolvedValue('duplicated-id');

            const result = await duplicarFicha('f-1', 'Copy of Test', userId);

            expect(result.id).toBe('duplicated-id');
            expect(result.nombre).toBe('Copy of Test');
            expect(result.version).toBe(1);
        });
    });
});
