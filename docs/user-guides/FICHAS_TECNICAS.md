# Guía de Usuario: Fichas Técnicas

## 1. Introducción
Las Fichas Técnicas son el corazón de la rentabilidad en ChefOS. Permiten estandarizar recetas, calcular costos exactos y fijar precios de venta basados en datos.

## 2. Creación de una Ficha Técnica

### Paso 1: Datos Básicos
Ingrese el nombre, categoría (ej. Entrante, Principal), y número de porciones (Yield).

### Paso 2: Ingredientes y Costos
1.  Busque y seleccione ingredientes del inventario.
2.  Ingrese la cantidad bruta (Raw) necesaria.
3.  El sistema calculará automáticamente el costo basándose en el precio de última compra y el rendimiento (Merma).

**Nota sobre Mermas:**
Si un ingrediente tiene un rendimiento del 80% (Yield = 0.8) en el inventario, el sistema ajustará el costo proporcionalmente.

### Paso 3: Costos Operativos
Añada costos estimados de:
*   Mano de Obra (Tiempo x Costo Hora).
*   Energía / Suministros.

### Paso 4: Fijación de Precios
Establezca su **Margen Objetivo** (ej. 70%). El sistema sugerirá un Precio de Venta recomendado.

---

## 3. Diagrama de Cálculo de Costos

```mermaid
flowchart TD
    A[Inicio: Calcular Costos] --> B{Tiene Ingredientes?}
    B -- No --> H[Costos Ingredientes = 0]
    B -- Si --> C[Obtener IDs de Ingredientes]

    C --> D[Batch Fetch Firestore]
    D --> E[Obtener Precios Actuales]

    E --> F[Iterar Ingredientes Receta]
    F --> G[Costo Item = (Cantidad / Yield) * Precio]
    G --> F

    F -- Fin Iteración --> I[Sumar Costos Ingredientes]

    I --> J[Sumar Mano de Obra + Energía]
    J --> K[Total Costo Receta]
    K --> L[Calcular Costo por Porción]
    L --> M[Actualizar Sugerencia Precio Venta]
```
