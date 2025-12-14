import type { Event, Recipe, Ingredient, Menu } from '../types';

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

// Event validation
export const validateEvent = (event: Partial<Event>): ValidationResult => {
    const errors: string[] = [];

    if (!event.name || event.name.trim().length === 0) {
        errors.push('El nombre del evento es obligatorio');
    }

    if (event.name && event.name.length > 100) {
        errors.push('El nombre del evento no puede exceder 100 caracteres');
    }

    if (!event.date) {
        errors.push('La fecha del evento es obligatoria');
    }

    if (event.date) {
        const eventDate = new Date(event.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (eventDate < today) {
            errors.push('La fecha del evento no puede ser en el pasado');
        }
    }

    if (!event.pax || event.pax < 1) {
        errors.push('El número de personas (PAX) debe ser al menos 1');
    }

    if (event.pax && event.pax > 10000) {
        errors.push('El número de personas (PAX) no puede exceder 10,000');
    }

    if (!event.type) {
        errors.push('El tipo de evento es obligatorio');
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

// Recipe validation
export const validateRecipe = (recipe: Partial<Recipe>): ValidationResult => {
    const errors: string[] = [];

    if (!recipe.name || recipe.name.trim().length === 0) {
        errors.push('El nombre de la receta es obligatorio');
    }

    if (recipe.name && recipe.name.length > 150) {
        errors.push('El nombre de la receta no puede exceder 150 caracteres');
    }

    if (!recipe.station) {
        errors.push('La partida (hot/cold/dessert) es obligatoria');
    }

    if (!recipe.ingredients || recipe.ingredients.length === 0) {
        errors.push('La receta debe tener al menos un ingrediente');
    }

    if (recipe.ingredients) {
        recipe.ingredients.forEach((ri, index) => {
            if (!ri.ingredientId) {
                errors.push(`Ingrediente #${index + 1}: debe seleccionar un ingrediente`);
            }
            if (ri.quantity <= 0) {
                errors.push(`Ingrediente #${index + 1}: la cantidad debe ser mayor a 0`);
            }
        });
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

// Ingredient validation
export const validateIngredient = (ingredient: Partial<Ingredient>): ValidationResult => {
    const errors: string[] = [];

    if (!ingredient.name || ingredient.name.trim().length === 0) {
        errors.push('El nombre del ingrediente es obligatorio');
    }

    if (ingredient.name && ingredient.name.length > 100) {
        errors.push('El nombre del ingrediente no puede exceder 100 caracteres');
    }

    if (!ingredient.unit) {
        errors.push('La unidad de medida es obligatoria');
    }

    if (ingredient.costPerUnit !== undefined && ingredient.costPerUnit < 0) {
        errors.push('El coste por unidad no puede ser negativo');
    }

    if (ingredient.yield !== undefined && (ingredient.yield < 0 || ingredient.yield > 1)) {
        errors.push('El rendimiento debe estar entre 0 y 1 (0-100%)');
    }

    if (ingredient.stock !== undefined && ingredient.stock < 0) {
        errors.push('El stock no puede ser negativo');
    }

    if (ingredient.minStock !== undefined && ingredient.minStock < 0) {
        errors.push('El stock mínimo no puede ser negativo');
    }

    // Nutritional info validation
    if (ingredient.nutritionalInfo) {
        const { calories, protein, carbs, fat } = ingredient.nutritionalInfo;

        if (calories < 0 || protein < 0 || carbs < 0 || fat < 0) {
            errors.push('Los valores nutricionales no pueden ser negativos');
        }

        if (calories > 9000 || protein > 100 || carbs > 100 || fat > 100) {
            errors.push('Los valores nutricionales parecen estar fuera de rango razonable (por 100g/ml)');
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

// Menu validation
export const validateMenu = (menu: Partial<Menu>): ValidationResult => {
    const errors: string[] = [];

    if (!menu.name || menu.name.trim().length === 0) {
        errors.push('El nombre del menú es obligatorio');
    }

    if (menu.name && menu.name.length > 150) {
        errors.push('El nombre del menú no puede exceder 150 caracteres');
    }

    if (!menu.recipeIds || menu.recipeIds.length === 0) {
        errors.push('El menú debe tener al menos una receta');
    }

    if (menu.sellPrice !== undefined && menu.sellPrice < 0) {
        errors.push('El precio de venta no puede ser negativo');
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

// General helpers
export const formatValidationErrors = (errors: string[]): string => {
    if (errors.length === 0) return '';
    if (errors.length === 1) return errors[0];
    return '• ' + errors.join('\n• ');
};

export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
    // Simple validation for Spanish phone numbers
    const phoneRegex = /^[+]?[\d\s()-]{9,}$/;
    return phoneRegex.test(phone);
};
