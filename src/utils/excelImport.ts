import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { EXCEL_IMPORT } from '../constants';
import type { Recipe, Ingredient, Menu, Unit } from '../types';

// Helper to normalize headers
const normalize = (str: string) => str?.toLowerCase().trim().replace(/[^a-z0-9]/g, '') || '';

interface RawRecipeRow {
    recipeName: string;
    station?: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    yield?: number;
    cost?: number;
    allergens?: string;
}

interface RawMenuRow {
    menuName: string;
    recipeName: string;
    sellPrice?: number;
}

export const parseRecipesFromExcel = async (file: File): Promise<{ recipes: Recipe[], ingredients: Ingredient[], errors: string[] }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                const recipesMap = new Map<string, Recipe>();
                const ingredientsMap = new Map<string, Ingredient>();
                const errors: string[] = [];

                // Strategy 1: Attempt "Flat List" detection (Single sheet with all recipes)
                let flatListSheetName = '';
                let flatListHeaderRow = 0;

                const recipeKeywords = ['RECETA', 'RECIPE', 'PLATO', 'DISH'];
                const ingredientKeywords = ['INGREDIENTE', 'INGREDIENT'];

                for (const sheetName of workbook.SheetNames) {
                    const sheet = workbook.Sheets[sheetName];
                    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z100');
                    // Check first rows for headers
                    for (let r = range.s.r; r <= Math.min(range.e.r, EXCEL_IMPORT.MAX_HEADER_SEARCH_ROWS); r++) {
                        const row: any[] = [];
                        for (let c = range.s.c; c <= range.e.c; c++) {
                            const cell = sheet[XLSX.utils.encode_cell({ r, c })];
                            row.push(cell ? String(cell.v).toUpperCase() : '');
                        }
                        if (row.some(v => recipeKeywords.some(k => v.includes(k))) &&
                            row.some(v => ingredientKeywords.some(k => v.includes(k)))) {
                            flatListSheetName = sheetName;
                            flatListHeaderRow = r;
                            break;
                        }
                    }
                    if (flatListSheetName) break;
                }

                if (flatListSheetName) {
                    // Logic for Flat List (same as before)
                    const sheet = workbook.Sheets[flatListSheetName];
                    const json = XLSX.utils.sheet_to_json(sheet, { range: flatListHeaderRow });
                    json.forEach((row: any) => {
                        const rowData: RawRecipeRow = {
                            recipeName: row['Receta'] || row['Recipe'] || row['Nombre Receta'] || row['Plato'] || row['Dish'],
                            station: row['Estacion'] || row['Station'] || 'hot',
                            ingredientName: row['Ingrediente'] || row['Ingredient'],
                            quantity: Number(row['Cantidad'] || row['Quantity'] || 0),
                            unit: (row['Unidad'] || row['Unit'] || 'kg') as string,
                            yield: Number(row['Merma'] || row['Yield'] || 0),
                            cost: Number(row['Coste'] || row['Cost'] || 0),
                            allergens: row['Alergenos'] || row['Allergens'] || '',
                        };

                        if (!rowData.recipeName || !rowData.ingredientName) return;

                        const ingKey = normalize(rowData.ingredientName);
                        let ingredient = ingredientsMap.get(ingKey);
                        if (!ingredient) {
                            ingredient = {
                                id: uuidv4(),
                                name: rowData.ingredientName,
                                unit: rowData.unit as Unit,
                                costPerUnit: rowData.cost || 0,
                                yield: rowData.yield || 0,
                                allergens: rowData.allergens ? String(rowData.allergens).split(',').map(s => s.trim()) : [],
                            };
                            ingredientsMap.set(ingKey, ingredient);
                        }

                        const recipeKey = normalize(rowData.recipeName);
                        let recipe = recipesMap.get(recipeKey);
                        if (!recipe) {
                            recipe = {
                                id: uuidv4(),
                                name: rowData.recipeName,
                                station: (rowData.station?.toLowerCase() as any) || 'hot',
                                ingredients: [],
                                totalCost: 0
                            };
                            recipesMap.set(recipeKey, recipe);
                        }

                        recipe.ingredients.push({
                            ingredientId: ingredient.id,
                            ingredient: ingredient,
                            quantity: rowData.quantity
                        });
                    });
                } else {
                    // Strategy 2: "Recipe Card" per sheet (Multi-Sheet)
                    const cardHeaderKeywords = ['DESCRIPCIÓN PRODUCTO', 'CANTIDAD NETA', 'PRECIO POR UNIDAD'];

                    workbook.SheetNames.forEach(sheetName => {
                        const sheet = workbook.Sheets[sheetName];
                        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z100');

                        // Look for header row
                        let headerRowIndex = -1;
                        for (let r = range.s.r; r <= Math.min(range.e.r, EXCEL_IMPORT.MAX_HEADER_SEARCH_ROWS); r++) {
                            const row: any[] = [];
                            for (let c = range.s.c; c <= range.e.c; c++) {
                                const cell = sheet[XLSX.utils.encode_cell({ r, c })];
                                row.push(cell ? String(cell.v).toUpperCase() : '');
                            }
                            // Check if matches enough keywords (at least 2)
                            const matchCount = cardHeaderKeywords.filter(k => row.some(cell => cell.includes(k))).length;
                            if (matchCount >= 2) {
                                headerRowIndex = r;
                                break;
                            }
                        }

                        if (headerRowIndex !== -1) {
                            // Found a Recipe Card Sheet!
                            // Extract Name (Assume Row 9 or near headerRow - 2)
                            // We'll scan row (headerRowIndex - 2) for text
                            let recipeName = '';
                            const nameRowIdx = Math.max(0, headerRowIndex - 2);
                            for (let c = range.s.c; c <= range.e.c; c++) {
                                const cell = sheet[XLSX.utils.encode_cell({ r: nameRowIdx, c })];
                                if (cell && cell.v) recipeName += cell.v + ' ';
                            }
                            recipeName = recipeName.trim() || `Recipe ${sheetName}`;

                            // Cleanup recipe name if it contains "ESCANDALLO" or similar noise
                            recipeName = recipeName.replace(/ESCANDALLO/i, '').trim();

                            // Create Recipe
                            const recipeKey = normalize(recipeName);
                            if (recipesMap.has(recipeKey)) return;

                            const recipe: Recipe = {
                                id: uuidv4(),
                                name: recipeName,
                                station: 'hot',
                                ingredients: [],
                                totalCost: 0
                            };
                            recipesMap.set(recipeKey, recipe);

                            // Parse Ingredients (Start from headerRow + 1)
                            const json = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });
                            json.forEach((row: any) => {
                                const rawName = row['DESCRIPCIÓN PRODUCTO PROVEEDOR'] || row['DESCRIPCIÓN'] || row['PRODUCTO'];
                                const rawQty = row['CANTIDAD NETA'] || row['CANTIDAD'] || row['NETO'];
                                const rawUnit = row['UNIDADES'] || row['UNIDAD'];
                                const rawCost = row['PRECIO POR UNIDAD'] || row['PRECIO'];

                                if (!rawName) return;

                                const ingName = String(rawName).trim();
                                // Filtering junk
                                if (ingName.toUpperCase() === 'TOTAL' || ingName.length < 2) return;

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
                    });
                }

                if (recipesMap.size === 0) {
                    resolve({
                        recipes: [],
                        ingredients: [],
                        errors: ['No recipes found. File format not recognized (neither Flat List nor Recipe Card).']
                    });
                    return;
                }

                resolve({
                    recipes: Array.from(recipesMap.values()),
                    ingredients: Array.from(ingredientsMap.values()),
                    errors
                });

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error parsing recipes';
                reject(new Error(`Failed to parse recipes: ${errorMessage}`));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read recipes file'));
        reader.readAsArrayBuffer(file);
    });
};

export const parseMenusFromExcel = async (file: File, existingRecipes: Recipe[]): Promise<{ menus: Menu[], errors: string[] }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                // Similar to recipes, we might need a smarter detection for Menus
                // For now, let's keep it simple or default to scanning all sheets if strict one isn't found.
                // Reverting to robust scan:

                let targetSheetName = '';
                let headerRowIndex = 0;

                const menuKeywords = ['MENU', 'MENÚ', 'NAME', 'NOMBRE'];
                const itemKeywords = ['RECETA', 'PLATO', 'DISH', 'ITEM'];

                for (const sheetName of workbook.SheetNames) {
                    const sheet = workbook.Sheets[sheetName];
                    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z100');
                    for (let r = range.s.r; r <= Math.min(range.e.r, EXCEL_IMPORT.MAX_HEADER_SEARCH_ROWS); r++) {
                        const row: any[] = [];
                        for (let c = range.s.c; c <= range.e.c; c++) {
                            const cell = sheet[XLSX.utils.encode_cell({ r, c })];
                            row.push(cell ? String(cell.v).toUpperCase() : '');
                        }
                        if (row.some(v => menuKeywords.some(k => v.includes(k))) &&
                            row.some(v => itemKeywords.some(k => v.includes(k)))) {
                            targetSheetName = sheetName;
                            headerRowIndex = r;
                            break;
                        }
                    }
                    if (targetSheetName) break;
                }

                const sheet = targetSheetName ? workbook.Sheets[targetSheetName] : workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });

                const menusMap = new Map<string, Menu>();
                const errors: string[] = [];

                json.forEach((row: any) => {
                    const rowData: RawMenuRow = {
                        menuName: row['Menu'] || row['Nombre Menu'] || row['Menu Name'],
                        recipeName: row['Plato'] || row['Receta'] || row['Dish'] || row['Recipe'],
                        sellPrice: Number(row['Precio'] || row['Price'] || 0)
                    };

                    if (!rowData.menuName || !rowData.recipeName) return;

                    const menuKey = normalize(rowData.menuName);
                    let menu = menusMap.get(menuKey);
                    if (!menu) {
                        menu = {
                            id: uuidv4(),
                            name: rowData.menuName,
                            recipeIds: [],
                            recipes: [],
                            sellPrice: rowData.sellPrice
                        };
                        menusMap.set(menuKey, menu);
                    }

                    const targetRecipe = existingRecipes.find(r => normalize(r.name) === normalize(rowData.recipeName));

                    if (targetRecipe) {
                        menu.recipeIds.push(targetRecipe.id);
                        menu.recipes?.push(targetRecipe);
                    } else {
                        errors.push(`Menu "${rowData.menuName}": Recipe "${rowData.recipeName}" not found in database.`);
                    }
                });

                resolve({
                    menus: Array.from(menusMap.values()),
                    errors
                });

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error parsing menus';
                reject(new Error(`Failed to parse menus: ${errorMessage}`));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read menus file'));
        reader.readAsArrayBuffer(file);
    });
};

export const parseIngredientsFromExcel = async (file: File): Promise<{ ingredients: Ingredient[], errors: string[] }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                const ingredientsMap = new Map<string, Ingredient>();
                const errors: string[] = [];

                // Look for "LIST. PRODUCTOS" or scan for header
                let targetSheetName = '';
                let headerRowIndex = 0;

                // Prioritize specific sheet name
                const likelySheets = ['LIST. PRODUCTOS', 'LISTA PRODUCTOS', 'INGREDIENTES', 'BASE DE DATOS'];
                for (const name of likelySheets) {
                    if (workbook.SheetNames.find(s => s.toUpperCase().includes(name))) {
                        targetSheetName = workbook.SheetNames.find(s => s.toUpperCase().includes(name))!;
                        break;
                    }
                }

                // If not found by name, or to confirm header row, scan
                if (!targetSheetName) {
                    // Start scanning all sheets
                    // If not found by name, we proceed to scan logic below
                }

                // If we found a sheet or default to first?
                if (!targetSheetName) {
                    // Try to find a sheet with "PRODUCTO" in header
                    for (const sheetName of workbook.SheetNames) {
                        const sheet = workbook.Sheets[sheetName];
                        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:Z100');
                        for (let r = range.s.r; r <= Math.min(range.e.r, EXCEL_IMPORT.MAX_HEADER_SEARCH_ROWS); r++) {
                            const row: any[] = [];
                            for (let c = range.s.c; c <= range.e.c; c++) {
                                const cell = sheet[XLSX.utils.encode_cell({ r, c })];
                                row.push(cell ? String(cell.v).toUpperCase() : '');
                            }
                            if (row.some(v => v.includes('PRODUCTO')) && row.some(v => v.includes('PRECIO'))) {
                                targetSheetName = sheetName;
                                headerRowIndex = r;
                                break;
                            }
                        }
                        if (targetSheetName) break;
                    }
                }

                if (!targetSheetName) {
                    resolve({ ingredients: [], errors: ['No suitable Ingredients sheet found (looked for "PRODUCTO" and "PRECIO" columns).'] });
                    return;
                }

                const sheet = workbook.Sheets[targetSheetName];
                const json = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });

                json.forEach((row: any) => {
                    const name = row['Producto'] || row['Nombre'] || row['Name'] || row['PRODUCTO'] || row['DESCRIPCIÓN'];
                    const price = row['Precio'] || row['Coste'] || row['Cost'] || row['PRECIO'] || row['PRECIO MEDIO'] || 0;
                    const unit = row['Unidad'] || row['Unit'] || row['FORMATO'] || 'kg';
                    const allergenStr = row['Alérgenos'] || row['Alergenos'] || row['Allergens'] || '';

                    if (!name) return;

                    const ingKey = normalize(name);
                    if (ingredientsMap.has(ingKey)) return;

                    const ingredient: Ingredient = {
                        id: uuidv4(),
                        name: String(name).trim(),
                        unit: String(unit).toLowerCase() as Unit,
                        costPerUnit: Number(price || 0),
                        yield: 0, // Default to 0 if not found
                        allergens: allergenStr ? String(allergenStr).split(',').map(s => s.trim()) : []
                    };
                    ingredientsMap.set(ingKey, ingredient);
                });

                resolve({
                    ingredients: Array.from(ingredientsMap.values()),
                    errors
                });

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error parsing ingredients';
                reject(new Error(`Failed to parse ingredients: ${errorMessage}`));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read ingredients file'));
        reader.readAsArrayBuffer(file);
    });
};

