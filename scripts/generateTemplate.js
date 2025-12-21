import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Define Sample Data
const recipesData = [
    // Recipe: Ensalada César
    { Receta: 'Ensalada César', Ingrediente: 'Lechuga Romana', Cantidad: 200, Unidad: 'g', Merma: 0.1, Coste: 1.5, Alergenos: '' },
    { Receta: 'Ensalada César', Ingrediente: 'Pollo Pechuga', Cantidad: 150, Unidad: 'g', Merma: 0, Coste: 5.0, Alergenos: '' },
    { Receta: 'Ensalada César', Ingrediente: 'Salsa César', Cantidad: 50, Unidad: 'ml', Merma: 0, Coste: 3.0, Alergenos: 'Huevo, Leche' },
    { Receta: 'Ensalada César', Ingrediente: 'Picatostes', Cantidad: 30, Unidad: 'g', Merma: 0, Coste: 2.0, Alergenos: 'Gluten' },

    // Recipe: Solomillo al Oporto
    { Receta: 'Solomillo al Oporto', Ingrediente: 'Solomillo de Ternera', Cantidad: 250, Unidad: 'g', Merma: 0.15, Coste: 25.0, Alergenos: '' },
    { Receta: 'Solomillo al Oporto', Ingrediente: 'Vino Oporto', Cantidad: 100, Unidad: 'ml', Merma: 0, Coste: 8.0, Alergenos: 'Sulfitos' },
    { Receta: 'Solomillo al Oporto', Ingrediente: 'Chalotas', Cantidad: 50, Unidad: 'g', Merma: 0.1, Coste: 3.0, Alergenos: '' },

    // Recipe: Tarta de Queso
    { Receta: 'Tarta de Queso', Ingrediente: 'Queso Crema', Cantidad: 200, Unidad: 'g', Merma: 0, Coste: 4.0, Alergenos: 'Leche' },
    { Receta: 'Tarta de Queso', Ingrediente: 'Huevos', Cantidad: 2, Unidad: 'un', Merma: 0, Coste: 0.2, Alergenos: 'Huevo' },
    { Receta: 'Tarta de Queso', Ingrediente: 'Azúcar', Cantidad: 100, Unidad: 'g', Merma: 0, Coste: 0.8, Alergenos: '' },
];

const menusData = [
    // Menu: Boda Clásica
    { Menu: 'Boda Clásica', Plato: 'Ensalada César', Precio: 85 },
    { Menu: 'Boda Clásica', Plato: 'Solomillo al Oporto', Precio: '' }, // Price is per menu, usually repeated or on first line only, but importer handles this? Let's simply fill it or leave blank on subsequent lines.
    { Menu: 'Boda Clásica', Plato: 'Tarta de Queso', Precio: '' },

    // Menu: Cena Empresa
    { Menu: 'Cena Empresa', Plato: 'Ensalada César', Precio: 45 },
    { Menu: 'Cena Empresa', Plato: 'Solomillo al Oporto', Precio: '' },
];

// 2. Create Workbook
const wb = XLSX.utils.book_new();

// 3. Create Sheets
const wsRecipes = XLSX.utils.json_to_sheet(recipesData);
const wsMenus = XLSX.utils.json_to_sheet(menusData);

// 4. Append Sheets
XLSX.utils.book_append_sheet(wb, wsRecipes, "Recetas");
XLSX.utils.book_append_sheet(wb, wsMenus, "Menus");

// 5. Write File
const outputPath = path.resolve(__dirname, '../Plantilla_Importacion.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`Template generated at: ${outputPath}`);
