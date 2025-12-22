# Arquitectura - Módulo de Fichas Técnicas

## Estructura de Datos (Firestore)

### Colección: `fichas_tecnicas`
Documentos principales que representan una receta estandarizada.
```typescript
interface FichaTecnica {
  id: string;
  nombre: string;
  categoria: 'comida' | 'bebida' | ...;
  ingredientes: {
      ingredienteId: string;
      cantidad: number;
      costoUnitario: number; // Snapshot del costo al momento
      costoTotal: number;
  }[];
  costos: {
      ingredientes: number;
      manoObra: number;
      total: number;
      porPorcion: number;
  };
  pricing: {
      precioVentaSugerido: number;
      margenBruto: number;
  };
  version: number;
  activa: boolean;
}
```

### Colección: `versiones_fichas`
Historial de cambios. Cada vez que se actualiza una ficha, se guarda una copia aquí si se solicita versionado.

## Servicios Clave

- **`fichasTecnicasService.ts`**: Maneja CRUD, versionado y cálculos de costos al guardar.
- **`analyticsService.ts`**: Contiene la lógica de negocio para cálculos de rentabilidad, detección de anomalías y simulaciones.
- **`recetaToFichaService.ts`**: Facilita la migración desde el módulo legacy de Recetas.

## Componentes UI

- `FichasTecnicasDashboard`: Orquestador principal.
- `FichaTecnicaForm`: Formulario complejo con validación y cálculos en tiempo real.
- `RentabilidadChart`: Visualización de datos usando SVG/Canvas.
- `SimuladorEscenarios`: Herramienta interactiva para proyección de costos.

## Flujo de Datos
1. El usuario crea/edita una ficha.
2. `fichasTecnicasService` obtiene precios actuales de `ingredients`.
3. Se calculan costos y márgenes.
4. Se guarda en Firestore.
5. El Dashboard lee `fichas_tecnicas` y `analyticsService` procesa las métricas globales en el cliente (para evitar cloud functions costosas en MVP).
