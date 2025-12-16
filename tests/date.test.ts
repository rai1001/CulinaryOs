import { describe, it, expect } from 'vitest';
import { normalizeDate } from '../src/utils/date';

describe('normalizeDate', () => {
    it('should return YYYY-MM-DD for a date string', () => {
        expect(normalizeDate('2023-10-27')).toBe('2023-10-27');
    });

    it('should normalize ISO date string with time', () => {
        expect(normalizeDate('2023-10-27T14:30:00.000Z')).toBe('2023-10-27');
    });

    it('should normalize Date object', () => {
        const d = new Date('2023-10-27T10:00:00');
        expect(normalizeDate(d)).toBe('2023-10-27');
    });

    it('should handle invalid date', () => {
        expect(normalizeDate('invalid-date')).toBe('');
    });
});
