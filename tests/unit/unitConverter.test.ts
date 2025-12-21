import { describe, it, expect } from 'vitest';
import { convertUnit, canConvert, compareQuantities } from '../../src/utils/unitConverter';

describe('unitConverter', () => {
    describe('convertUnit', () => {
        it('should convert weight (kg to g)', () => {
            expect(convertUnit(1, 'kg', 'g')).toBe(1000);
        });

        it('should convert weight (g to kg)', () => {
            expect(convertUnit(500, 'g', 'kg')).toBe(0.5);
        });

        it('should convert weight (oz to g)', () => {
            // 1 oz approx 28.3495 g
            expect(convertUnit(10, 'oz', 'g')).toBeCloseTo(283.495);
        });

        it('should convert volume (L to ml)', () => {
            expect(convertUnit(1, 'L', 'ml')).toBe(1000);
        });

        it('should convert volume (gal to L)', () => {
            expect(convertUnit(1, 'gal', 'L')).toBeCloseTo(3.78541);
        });

        it('should handle same unit', () => {
            expect(convertUnit(100, 'g', 'g')).toBe(100);
        });

        it('should throw error for incompatible units', () => {
            expect(() => convertUnit(1, 'kg', 'L')).toThrow(/Incompatible units/);
        });

        it('should throw error for unknown units', () => {
            expect(() => convertUnit(1, 'foo', 'bar')).toThrow(/Incompatible units/);
        });
    });

    describe('canConvert', () => {
        it('should return true for weight-weight', () => {
            expect(canConvert('kg', 'oz')).toBe(true);
        });

        it('should return true for volume-volume', () => {
            expect(canConvert('ml', 'gal')).toBe(true);
        });

        it('should return false for weight-volume', () => {
            expect(canConvert('kg', 'L')).toBe(false);
        });
    });

    describe('compareQuantities', () => {
        it('should return 0 for equal quantities', () => {
            expect(compareQuantities({ value: 1, unit: 'kg' }, { value: 1000, unit: 'g' })).toBe(0);
        });

        it('should return positive if q1 > q2', () => {
            expect(compareQuantities({ value: 2, unit: 'kg' }, { value: 1000, unit: 'g' })).toBeGreaterThan(0);
        });

        it('should return negative if q1 < q2', () => {
            expect(compareQuantities({ value: 500, unit: 'g' }, { value: 1, unit: 'kg' })).toBeLessThan(0);
        });
    });
});
