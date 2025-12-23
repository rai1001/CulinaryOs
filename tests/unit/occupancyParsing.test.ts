import { describe, it, expect } from 'vitest';
import { parseOccupancyImport } from '../../src/services/occupancyService';

describe('parseOccupancyImport', () => {
    it('should parse English columns correctly', () => {
        const rawData = [
            { 'Date': '2025-12-25', 'Total Rooms': 100, 'Occupied Rooms': 80, 'Pax': 150 }
        ];
        const parsed = parseOccupancyImport(rawData);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].occupiedRooms).toBe(80);
        expect(parsed[0].estimatedPax).toBe(150);
        expect(parsed[0].date.getFullYear()).toBe(2025);
    });

    it('should parse Spanish columns correctly', () => {
        const rawData = [
            { 'Fecha': '2025-12-26', 'Habitaciones Totales': 100, 'Habitaciones Ocupadas': 90, 'Personas': 180 }
        ];
        const parsed = parseOccupancyImport(rawData);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].occupiedRooms).toBe(90);
        expect(parsed[0].estimatedPax).toBe(180);
    });

    it('should handle native Date objects from Excel', () => {
        const mockDate = new Date(2025, 11, 27);
        const rawData = [
            { 'Date': mockDate, 'Occupied Rooms': 50 }
        ];
        const parsed = parseOccupancyImport(rawData);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].date).toBe(mockDate);
        expect(parsed[0].occupiedRooms).toBe(50);
    });

    it('should split multi-meal rows into separate records', () => {
        const rawData = [
            { 'Fecha': '2025-12-28', 'Desayunos': 50, 'Comidas': 30, 'Cenas': 20 }
        ];
        const parsed = parseOccupancyImport(rawData);
        expect(parsed).toHaveLength(3);

        const breakfast = parsed.find(p => p.mealType === 'breakfast');
        const lunch = parsed.find(p => p.mealType === 'lunch');
        const dinner = parsed.find(p => p.mealType === 'dinner');

        expect(breakfast?.estimatedPax).toBe(50);
        expect(lunch?.estimatedPax).toBe(30);
        expect(dinner?.estimatedPax).toBe(20);
    });

    it('should handle Spanish DD/MM/YYYY date strings', () => {
        const rawData = [
            { 'Fecha': '28/12/2025', 'Desayunos': 50 }
        ];
        const parsed = parseOccupancyImport(rawData);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].date.getFullYear()).toBe(2025);
        expect(parsed[0].date.getMonth()).toBe(11); // December is 11
        expect(parsed[0].date.getDate()).toBe(28);
    });

    it('should be case-insensitive and trim headers', () => {
        const rawData = [
            { ' Fecha  ': '2025-12-28', ' DESAYUNOS ': 100 }
        ];
        const parsed = parseOccupancyImport(rawData);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].estimatedPax).toBe(100);
    });

    it('should filter out invalid dates', () => {
        const rawData = [
            { 'Date': 'not-a-date', 'Occupied Rooms': 50 }
        ];
        const parsed = parseOccupancyImport(rawData);
        expect(parsed).toHaveLength(0);
    });
});
