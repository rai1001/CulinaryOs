# Estrategia de Testing y Desarrollo - ChefOS

## 1. Stack de Testing
Utilizamos **Vitest** como runner principal debido a su velocidad e integración nativa con Vite.

*   **Unit Testing:** Vitest + React Testing Library.
*   **Mocking:** `vi.mock` (Vitest native).
*   **Coverage:** v8 (c8).

## 2. Estructura de Tests
Fomentamos la **co-ubicación** de tests unitarios junto al código fuente para servicios y utilidades.

```text
src/
├── services/
│   ├── inventoryService.ts
│   ├── inventoryService.test.ts  <-- Test Unitario
│   ├── costosService.ts
│   └── costosService.test.ts     <-- Test Unitario
```

Para tests de integración o componentes complejos, usamos la carpeta `tests/`.

## 3. Guía de Mocking para Firebase

Para aislar la lógica de negocio de la base de datos real, mockeamos `firestoreService`.

**Patrón Recomendado:**
```typescript
import { vi } from 'vitest';
import { firestoreService } from './firestoreService';

vi.mock('./firestoreService', () => ({
    firestoreService: {
        getById: vi.fn(),
        query: vi.fn(),
        create: vi.fn(),
        update: vi.fn()
    }
}));

// En el test:
(firestoreService.getById as any).mockResolvedValue(mockData);
```

## 4. Ejecución de Tests

*   **Correr todos los tests:**
    ```bash
    npm test
    ```
*   **Correr con Coverage:**
    ```bash
    npm run coverage
    ```
*   **Modo Watch (Desarrollo):**
    ```bash
    npm run test:watch
    ```

## 5. Principios de Calidad
1.  **Lógica Crítica Blindada:** Módulos financieros (Costos) e Inventario (FIFO) deben tener coverage > 80%.
2.  **No Mock Logic in Production:** Evitar banderas tipo `useMockDB` en código de producción. Usar inyección de dependencias o mocks a nivel de test.
3.  **Performance First:** Tests deben verificar no solo el resultado, sino la eficiencia (ej. que `batch query` fue llamado en lugar de N llamadas individuales).
