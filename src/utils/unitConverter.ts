
import type { Ingredient } from '../types/inventory';

// Default densities (g/ml) for common categories if specific data is missing
export const DEFAULT_DENSITIES: Record<string, number> = {
  'water': 1.0,
  'milk': 1.03,
  'oil': 0.92,
  'flour': 0.53,
  'sugar': 0.85,
  'honey': 1.42,
  'butter': 0.911,
  'alcohol': 0.789,
  // Generic fallbacks by category
  'dairy': 1.03,
  'beverage': 1.0,
  'sauce': 1.1,
  'other': 1.0,
};

// Standard conversion factors to base units (g or ml)
const STANDARD_CONVERSIONS: Record<string, number> = {
  // Mass (base: g)
  'kg': 1000,
  'g': 1,
  'mg': 0.001,
  'lb': 453.592,
  'oz': 28.3495,

  // Volume (base: ml)
  'l': 1000,
  'L': 1000,
  'ml': 1,
  'cl': 10,
  'dl': 100,
  'gal': 3785.41,
  'cup': 236.588, // US Cup
  'taza': 250, // Metric Cup (common in EU/LatAm recipes)
  'tbsp': 14.7868,
  'cucharada': 15,
  'tsp': 4.92892,
  'cucharadita': 5,

  // Units
  'un': 1,
  'ud': 1,
  'unit': 1,
  'manojo': 1 // Default, can be overridden by avgUnitWeight
};

// Helper to determine unit type
const getUnitType = (unit: string): 'mass' | 'volume' | 'unit' => {
  const normalized = unit.toLowerCase();
  if (['kg', 'g', 'mg', 'lb', 'oz'].includes(normalized)) return 'mass';
  if (['l', 'ml', 'cl', 'dl', 'gal', 'cup', 'taza', 'tbsp', 'cucharada', 'tsp', 'cucharadita'].includes(normalized)) return 'volume';
  return 'unit';
};

/**
 * Converts a quantity from one unit to another, optionally using Ingredient context for density/weight.
 * @param quantity The amount to convert
 * @param fromUnit The source unit
 * @param toUnit The target unit
 * @param ingredient Optional ingredient context for advanced conversions (density, unit weight)
 * @returns The converted quantity
 * @throws Error if conversion is impossible
 */
export const convertUnit = (
  quantity: number,
  fromUnit: string,
  toUnit: string,
  ingredient?: Ingredient
): number => {
  if (quantity === 0) return 0;
  if (fromUnit === toUnit) return quantity;

  const fromType = getUnitType(fromUnit);
  const toType = getUnitType(toUnit);

  // Normalize units to base (g or ml) first
  let baseQuantity = quantity;
  let baseUnit = fromType === 'mass' ? 'g' : (fromType === 'volume' ? 'ml' : 'un');

  // 1. Convert "From" -> Base Unit (g/ml/un)
  if (STANDARD_CONVERSIONS[fromUnit] !== undefined) {
    baseQuantity = quantity * STANDARD_CONVERSIONS[fromUnit];
  } else if (fromType === 'unit' && ingredient?.avgUnitWeight) {
    // If starting from a custom unit (like 'un') and we need weight
    // We treat 'un' as base for now, but if we need to cross types, we'll handle it below
    baseQuantity = quantity;
  }

  // 2. Handle Cross-Type Conversion (Mass <-> Volume <-> Unit)
  // We need to get to the target base unit type

  // Target base unit
  const targetBaseUnit = toType === 'mass' ? 'g' : (toType === 'volume' ? 'ml' : 'un');

  if (baseUnit !== targetBaseUnit) {
    // Mass <-> Volume (Needs Density)
    if ((baseUnit === 'g' && targetBaseUnit === 'ml') || (baseUnit === 'ml' && targetBaseUnit === 'g')) {
      let density = ingredient?.density;

      // Fallback density
      if (!density && ingredient?.category) {
        // Try specific category or generic
        density = DEFAULT_DENSITIES[ingredient.category.toLowerCase()] || 1.0;
      }

      if (!density) {
        // Last resort: assume water density if no info provided (standard behavior but risky)
        // Better: if strict mode, throw. Here we default to 1.0 to prevent crash,
        // but user prompt implied we should be smart.
        density = 1.0;
      }

      if (baseUnit === 'g' && targetBaseUnit === 'ml') {
        // Mass / Density = Volume
        baseQuantity = baseQuantity / density;
      } else {
        // Volume * Density = Mass
        baseQuantity = baseQuantity * density;
      }
    }

    // Unit <-> Mass (Needs avgUnitWeight)
    else if ((baseUnit === 'un' && targetBaseUnit === 'g') || (baseUnit === 'g' && targetBaseUnit === 'un')) {
      const unitWeight = ingredient?.avgUnitWeight;

      if (!unitWeight) {
         throw new Error(`Cannot convert Unit to Mass for ${ingredient?.name || 'unknown item'}: Missing avgUnitWeight.`);
      }

      if (baseUnit === 'un' && targetBaseUnit === 'g') {
        // Units * Weight = Total Mass
        baseQuantity = baseQuantity * unitWeight;
      } else {
        // Mass / Weight = Units
        baseQuantity = baseQuantity / unitWeight;
      }
    }

    // Unit <-> Volume (Needs avgUnitWeight AND Density)
    // Convert Unit -> Weight -> Volume or Volume -> Weight -> Unit
    else if ((baseUnit === 'un' && targetBaseUnit === 'ml') || (baseUnit === 'ml' && targetBaseUnit === 'un')) {
        const unitWeight = ingredient?.avgUnitWeight;
        const density = ingredient?.density || 1.0;

        if (!unitWeight) {
            throw new Error(`Cannot convert Unit to Volume for ${ingredient?.name || 'unknown item'}: Missing avgUnitWeight.`);
        }

        if (baseUnit === 'un') {
            // Unit -> Mass (g)
            const mass = baseQuantity * unitWeight;
            // Mass -> Vol (ml)
            baseQuantity = mass / density;
        } else {
            // Vol -> Mass (g)
            const mass = baseQuantity * density;
            // Mass -> Unit
            baseQuantity = mass / unitWeight;
        }
    }
  }

  // 3. Convert Base Unit -> Target Unit
  if (STANDARD_CONVERSIONS[toUnit] !== undefined) {
    return baseQuantity / STANDARD_CONVERSIONS[toUnit];
  }

  // Should not reach here if units are standard
  return baseQuantity;
};
