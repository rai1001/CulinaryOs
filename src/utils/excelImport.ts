import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import type { Recipe, Ingredient, Menu, Unit } from '../types';

// Helper to normalize headers
const normalize = (str: string) => str?.toLowerCase().trim().replace(/[^a-z0-9]/g, '') || '';

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
                const ingredientKeywords = ['PRODUCTO', 'DESCRIPCIÓN', 'INGREDIENTE', 'NAME'];
                const priceKeywords = ['PRECIO', 'COSTE', 'COST', 'PRICE'];
                const recipeCardKeywords = ['DESCRIPCIÓN PRODUCTO', 'CANTIDAD NETA', 'PRECIO POR UNIDAD'];
                const menuKeywords = ['NOMBRE MENÚ', 'MENU NAME', 'PLATO 1', 'DISH 1'];
                // Note: Menu template might vary, assuming simple list for now or specific headers

                for (const sheetName of workbook.SheetNames) {
                    const sheet = workbook.Sheets[sheetName];
                    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z100');

                    // --- DETECTOR ---
                    let type: 'INGREDIENTS' | 'RECIPE_CARD' | 'MENU' | 'UNKNOWN' = 'UNKNOWN';
                    let headerRow = 0;

                    // Scan first 20 rows
                    for (let r = range.s.r; r <= Math.min(range.e.r, 20); r++) {
                        const rowText: string[] = [];
                        for (let c = range.s.c; c <= range.e.c; c++) {
                            const cell = sheet[XLSX.utils.encode_cell({ r, c })];
                            if (cell && cell.v) rowText.push(String(cell.v).toUpperCase());
                        }

                        // Check signature
                        if (rowText.some(t => recipeCardKeywords.some(k => t.includes(k))) &&
                            rowText.filter(t => recipeCardKeywords.some(k => t.includes(k))).length >= 2) {
                            type = 'RECIPE_CARD';
                            headerRow = r;
                            break;
                        }
                        // Ingredient sheet needs BOTH "Producto" and "Precio" (or similar)
                        if (rowText.some(t => ingredientKeywords.some(k => t === k)) &&
                            rowText.some(t => priceKeywords.some(k => t.includes(k)))) {
                            type = 'INGREDIENTS';
                            headerRow = r;
                            break;
                        }
                        // Menu detection
                        if (rowText.some(t => t.includes('MENU')) && rowText.some(t => t.includes('PLATO') || t.includes('RECETA'))) {
                            type = 'MENU';
                            headerRow = r;
                            break;
                        }
                    }

                    // --- PARSER ---
                    if (type === 'INGREDIENTS') {
                        const json = XLSX.utils.sheet_to_json(sheet, { range: headerRow });
                        json.forEach((row: any) => {
                            const name = row['Producto'] || row['Nombre'] || row['Name'] || row['PRODUCTO'] || row['DESCRIPCIÓN'] || row['INGREDIENTE'];
                            const price = row['Precio'] || row['Coste'] || row['Cost'] || row['PRECIO'] || row['PRECIO MEDIO'] || 0;
                            const unit = row['Unidad'] || row['Unit'] || row['FORMATO'] || row['UNIDAD'] || 'kg';
                            const allergenStr = row['Alérgenos'] || row['Alergenos'] || row['Allergens'] || '';

                            if (!name || String(name).toUpperCase() === 'TOTAL') return;

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
                        let recipeName = '';
                        const nameRowIdx = Math.max(0, headerRow - 2);
                        for (let c = range.s.c; c <= range.e.c; c++) {
                            const cell = sheet[XLSX.utils.encode_cell({ r: nameRowIdx, c })];
                            if (cell && cell.v) recipeName += cell.v + ' ';
                        }
                        recipeName = recipeName.trim() || `Receta ${sheetName}`;
                        recipeName = recipeName.replace(/ESCANDALLO/i, '').trim();

                        const recipeKey = normalize(recipeName);
                        if (!recipesMap.has(recipeKey)) {
                            const recipe: Recipe = {
                                id: uuidv4(),
                                name: recipeName,
                                station: 'hot', // Default
                                ingredients: [],
                                totalCost: 0
                            };
                            recipesMap.set(recipeKey, recipe);

                            const json = XLSX.utils.sheet_to_json(sheet, { range: headerRow });
                            json.forEach((row: any) => {
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
                        const json = XLSX.utils.sheet_to_json(sheet, { range: headerRow });
                        json.forEach((row: any) => {
                            const menuName = row['Menu'] || row['Nombre Menú'] || row['MENU'];
                            const dishName = row['Plato'] || row['Receta'] || row['RECETA'] || row['PLATO'];
                            const price = row['Precio'] || row['Price'] || 0;

                            if (!menuName || !dishName) return;

                            const menuKey = normalize(menuName);
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
                            const foundRecipe = Array.from(recipesMap.values()).find(r => normalize(r.name) === normalize(dishName));
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
