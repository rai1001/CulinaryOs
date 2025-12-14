import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import type { Recipe, Ingredient, Menu, Unit } from '../types';

// Helper to normalize headers
const normalize = (str: string) => str?.toLowerCase().trim().replace(/[^a-z0-9]/g, '') || '';

// Type for flexible Excel row data (columns vary by sheet)
interface ExcelRow {
    [key: string]: string | number | boolean | null | undefined;
}

export type ParseResult = {
    ingredients: Ingredient[];
    recipes: Recipe[];
    menus: Menu[];
    summary: {
        ingredientsFound: number;
        recipesFound: number;
        menusFound: number;
        sheetsScaned: number;
    };
    errors: string[];
};

export const parseWorkbook = async (file: File): Promise<ParseResult> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                const result: ParseResult = {
                    ingredients: [],
                    recipes: [],
                    menus: [],
                    summary: {
                        ingredientsFound: 0,
                        recipesFound: 0,
                        menusFound: 0,
                        sheetsScaned: workbook.SheetNames.length
                    },
                    errors: []
                };

                const ingredientsMap = new Map<string, Ingredient>();
                const recipesMap = new Map<string, Recipe>();
                const menusMap = new Map<string, Menu>();

                // --- CLASSIFICATION & PARSING STRATEGY ---
                // Sheet detection is done inline via strong titles and header detection

                for (const sheetName of workbook.SheetNames) {
                    const sheet = workbook.Sheets[sheetName];
                    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z100');

                    // --- DETECTOR ---
                    let type: 'INGREDIENTS' | 'RECIPE_CARD' | 'MENU' | 'UNKNOWN' = 'UNKNOWN';
                    let headerRow = 0;

                    // Scan first 50 rows (increased from 20)
                    for (let r = range.s.r; r <= Math.min(range.e.r, 50); r++) {
                        const rowText: string[] = [];
                        for (let c = range.s.c; c <= range.e.c; c++) {
                            const cell = sheet[XLSX.utils.encode_cell({ r, c })];
                            if (cell && cell.v) rowText.push(String(cell.v).toUpperCase().trim());
                        }

                        if (rowText.length === 0) continue;
                        const rowString = rowText.join(' '); // For multi-cell title checks

                        // 1. Detect Strong Titles (Classifies the sheet, but doesn't set headerRow yet)
                        const strongRecipeTitles = ['PROPUESTA GASTRONÓMICA', 'PROPUESTA GASTRONOMICA', 'BASES', 'FICHA TÉCNICA', 'ESCANDALLO'];
                        const hasStrongRecipe = strongRecipeTitles.some(k => rowString.includes(k));

                        const strongIngredientTitles = ['LISTA DE PRODUCTOS', 'MASTER PRODUCTOS', 'LISTADO DE PRECIOS'];
                        const hasStrongIngredients = strongIngredientTitles.some(k => rowString.includes(k));

                        if (type === 'UNKNOWN') {
                            if (hasStrongRecipe) type = 'RECIPE_CARD';
                            else if (hasStrongIngredients) type = 'INGREDIENTS';
                        }

                        // 2. Detect Header Row (The actual table start)
                        // Heuristic: A row that contains multiple specific column headers
                        const isRecipeHeader = rowText.some(t => ['INGREDIENTE', 'PRODUCTO', 'DESCRIPCIÓN'].some(k => t.includes(k))) &&
                            rowText.some(t => ['CANTIDAD', 'PESO', 'NETO', 'Q'].some(k => t.includes(k)));

                        const isIngredientHeader = rowText.some(t => ['PRODUCTO', 'NOMBRE', 'DESCRIPCIÓN'].some(k => t.includes(k))) &&
                            rowText.some(t => ['PRECIO', 'COSTE', 'COST', '€'].some(k => t.includes(k)));

                        const isMenuHeader = rowText.some(t => ['MENÚ', 'MENU', 'PLATO'].some(k => t.includes(k)));

                        if (isRecipeHeader) {
                            if (type === 'UNKNOWN') type = 'RECIPE_CARD';
                            headerRow = r;
                            break; // Found the table!
                        }
                        if (isIngredientHeader) {
                            if (type === 'UNKNOWN') type = 'INGREDIENTS';
                            headerRow = r;
                            break; // Found the table!
                        }
                        if (isMenuHeader) {
                            type = 'MENU'; // Weak detection for menu
                            headerRow = r;
                            // Don't break immediately for menu, maybe look for better match? 
                            // Actually break is fine for now.
                            break;
                        }
                    }

                    // --- PARSER ---
                    if (type === 'INGREDIENTS') {
                        // Pass headerRow explicitly
                        const json = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { range: headerRow });
                        json.forEach((row) => {
                            // Find keys case-insensitively/fuzzy
                            const keys = Object.keys(row);
                            const findKey = (candidates: string[]) => keys.find(k => candidates.some(c => k.toUpperCase().includes(c)));

                            const nameKey = findKey(['PRODUCTO', 'NOMBRE', 'NAME', 'DESCRIPCIÓN', 'INGREDIENTE', 'ITEM', 'DESCRIPCION']);
                            const priceKey = findKey(['PRECIO', 'COSTE', 'COST', 'PRICE', '€']);
                            const unitKey = findKey(['UNIDAD', 'UNIT', 'FORMATO', 'U.']);
                            const allergenKey = findKey(['ALÉRGENO', 'ALERGENO', 'ALLERGEN']);

                            // Convert row values to appropriate types
                            const name = nameKey ? String(row[nameKey] ?? '') : null;
                            const price = priceKey ? Number(row[priceKey] ?? 0) : 0;
                            const unit = unitKey ? String(row[unitKey] ?? 'kg') : 'kg';
                            const allergenStr = allergenKey ? String(row[allergenKey] ?? '') : '';


                            if (!name || String(name).toUpperCase().includes('TOTAL')) return;

                            const ingKey = normalize(name);
                            if (!ingredientsMap.has(ingKey)) {
                                const ingredient: Ingredient = {
                                    id: uuidv4(),
                                    name: String(name).trim(),
                                    unit: String(unit).toLowerCase() as Unit,
                                    costPerUnit: Number(price || 0),
                                    yield: 0,
                                    allergens: allergenStr ? String(allergenStr).split(',').map(s => s.trim()) : []
                                };
                                ingredientsMap.set(ingKey, ingredient);
                            }
                        });

                    } else if (type === 'RECIPE_CARD') {
                        // Check if this is a "Bases" sheet
                        const isBaseSheet = sheetName.toUpperCase().includes('BASES') ||
                            sheetName.toUpperCase().includes('BASE');

                        let recipeName = '';
                        const nameRowIdx = Math.max(0, headerRow - 2);
                        for (let c = range.s.c; c <= range.e.c; c++) {
                            const cell = sheet[XLSX.utils.encode_cell({ r: nameRowIdx, c })];
                            if (cell && cell.v) recipeName += cell.v + ' ';
                        }
                        recipeName = recipeName.trim() || `Receta ${sheetName}`;
                        recipeName = recipeName.replace(/ESCANDALLO/i, '').trim();

                        // If it's a base sheet, clean up the name and ensure it starts with "BASE"
                        if (isBaseSheet) {
                            recipeName = recipeName.replace(/BASES?/i, '').trim();
                            if (!recipeName.toUpperCase().startsWith('BASE')) {
                                recipeName = 'BASE ' + recipeName;
                            }
                        }

                        const recipeKey = normalize(recipeName);
                        if (!recipesMap.has(recipeKey)) {
                            const recipe: Recipe = {
                                id: uuidv4(),
                                name: recipeName,
                                station: 'hot', // Default
                                ingredients: [],
                                isBase: isBaseSheet, // Mark as base if from Bases sheet
                                totalCost: 0
                            };
                            recipesMap.set(recipeKey, recipe);

                            const json = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { range: headerRow });
                            json.forEach((row) => {
                                const rawName = row['DESCRIPCIÓN PRODUCTO PROVEEDOR'] || row['DESCRIPCIÓN'] || row['PRODUCTO'];
                                const rawQty = row['CANTIDAD NETA'] || row['CANTIDAD'] || row['NETO'];
                                const rawUnit = row['UNIDADES'] || row['UNIDAD'];
                                const rawCost = row['PRECIO POR UNIDAD'] || row['PRECIO'];

                                if (!rawName) return;
                                const ingName = String(rawName).trim();
                                if (ingName.toUpperCase().includes('TOTAL') || ingName.length < 2) return;

                                const ingKey = normalize(ingName);
                                let ingredient = ingredientsMap.get(ingKey);

                                if (!ingredient) {
                                    ingredient = {
                                        id: uuidv4(),
                                        name: ingName,
                                        unit: (String(rawUnit || 'kg').toLowerCase()) as Unit,
                                        costPerUnit: Number(rawCost || 0),
                                        yield: 0,
                                        allergens: []
                                    };
                                    ingredientsMap.set(ingKey, ingredient);
                                }

                                recipe.ingredients.push({
                                    ingredientId: ingredient.id,
                                    ingredient: ingredient,
                                    quantity: Number(rawQty || 0)
                                });
                            });
                        }
                    } else if (type === 'MENU') {
                        // Simple Menu Parser
                        const json = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { range: headerRow });
                        json.forEach((row) => {
                            const menuName = row['Menu'] || row['Nombre Menú'] || row['MENU'];
                            const dishName = row['Plato'] || row['Receta'] || row['RECETA'] || row['PLATO'];
                            const price = row['Precio'] || row['Price'] || 0;

                            if (!menuName || !dishName) return;

                            const menuKey = normalize(String(menuName));
                            let menu = menusMap.get(menuKey);
                            if (!menu) {
                                menu = {
                                    id: uuidv4(),
                                    name: String(menuName).trim(),
                                    recipeIds: [],
                                    recipes: [],
                                    sellPrice: Number(price) || 0
                                };
                                menusMap.set(menuKey, menu);
                            }

                            // Note: This requires recipes to be found/created?
                            // Ideally we link to *existing* recipes found in this import or DB.
                            // For now we just check if it matches a recipe found in *this* import.
                            // (Advanced logic would check useStore state too, but let's keep it scoped to import file for now)
                            const foundRecipe = Array.from(recipesMap.values()).find(r => normalize(r.name) === normalize(String(dishName)));
                            if (foundRecipe) {
                                menu.recipeIds.push(foundRecipe.id);
                                menu.recipes?.push(foundRecipe);
                            }
                        });
                    }
                }

                result.ingredients = Array.from(ingredientsMap.values());
                result.recipes = Array.from(recipesMap.values());
                result.menus = Array.from(menusMap.values());

                result.summary.ingredientsFound = result.ingredients.length;
                result.summary.recipesFound = result.recipes.length;
                result.summary.menusFound = result.menus.length;

                resolve(result);

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error parsing workbook';
                reject(new Error(`Failed to parse workbook: ${errorMessage}`));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
};

// Legacy placeholders if you want to keep them to avoid breaking other files?
// Actually, I am overwriting, so I should NOT export them unless needed.
// Based on my check, only ExcelImporter used them, and I updated it.
