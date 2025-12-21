/**
 * @file src/utils/unitConverter.ts
 * @description Robust unit conversion system for kitchen ingredients.
 * Supports Weight (kg, g, lb, oz) and Volume (L, ml, gal, cup, tbsp, tsp).
 */

export type WeightUnit = 'kg' | 'g' | 'lb' | 'oz';
export type VolumeUnit = 'L' | 'ml' | 'gal' | 'cup' | 'tbsp' | 'tsp';
export type CountUnit = 'un' | 'manojo' | 'pieza'; // Add more as needed
export type AnyUnit = WeightUnit | VolumeUnit | CountUnit | string;

// Base units: kg for weight, L for volume
const WEIGHT_CONVERSIONS: Record<WeightUnit, number> = {
    kg: 1,
    g: 0.001,
    lb: 0.453592,
    oz: 0.0283495
};

const VOLUME_CONVERSIONS: Record<VolumeUnit, number> = {
    L: 1,
    ml: 0.001,
    gal: 3.78541,
    cup: 0.236588,
    tbsp: 0.0147868,
    tsp: 0.00492892
};

export const isWeightUnit = (unit: string): unit is WeightUnit => unit in WEIGHT_CONVERSIONS;
export const isVolumeUnit = (unit: string): unit is VolumeUnit => unit in VOLUME_CONVERSIONS;

/**
 * Converts a value from one unit to another.
 * Throws error if units are incompatible (e.g. weight to volume without density).
 */
export function convertUnit(value: number, fromUnit: AnyUnit, toUnit: AnyUnit): number {
    if (fromUnit === toUnit) return value;

    if (isWeightUnit(fromUnit as string) && isWeightUnit(toUnit as string)) {
        const valueInBase = value * WEIGHT_CONVERSIONS[fromUnit as WeightUnit];
        return valueInBase / WEIGHT_CONVERSIONS[toUnit as WeightUnit];
    }

    if (isVolumeUnit(fromUnit as string) && isVolumeUnit(toUnit as string)) {
        const valueInBase = value * VOLUME_CONVERSIONS[fromUnit as VolumeUnit];
        return valueInBase / VOLUME_CONVERSIONS[toUnit as VolumeUnit];
    }

    // Check for trivial "Unit" conversions (just equality)
    // TODO: Add density-based conversion logic if density provided

    // If we reach here, incompatible
    // For specific cases like 'un' to 'un', handled by first check.
    // If trying to convert 'un' to 'kg', return 0 or throw?
    // Prompt says "Error para conversiones imposibles"
    throw new Error(`Incompatible units: cannot convert ${fromUnit} to ${toUnit}`);
}

/**
 * Checks if two units can be converted between each other.
 */
export function canConvert(fromUnit: AnyUnit, toUnit: AnyUnit): boolean {
    if (fromUnit === toUnit) return true;
    if (isWeightUnit(fromUnit as string) && isWeightUnit(toUnit as string)) return true;
    if (isVolumeUnit(fromUnit as string) && isVolumeUnit(toUnit as string)) return true;
    return false;
}

/**
 * Compare two quantities.
 * Returns negative if q1 < q2, positive if q1 > q2, 0 if equal.
 * Throws if incompatible.
 */
export function compareQuantities(
    q1: { value: number; unit: AnyUnit },
    q2: { value: number; unit: AnyUnit }
): number {
    const val1 = q1.value;
    const val2Converted = convertUnit(q2.value, q2.unit, q1.unit);

    // Allow small float tolerance
    const diff = val1 - val2Converted;
    if (Math.abs(diff) < 0.0001) return 0;
    return diff;
}
