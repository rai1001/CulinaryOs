# Contexto de Migración Firestore

## Cambios Realizados (Sprint: Migración Queries)

Se ha eliminado la carga masiva de `purchaseOrders` y `events` al inicio de la aplicación para mejorar el rendimiento y optimizar costes de lectura en Firebase.

### Archivos Modificados
- **`src/services/firestoreService.ts`**: Añadidas funciones `getPurchaseOrdersPage` y `getEventsRange` para consultas optimizadas.
- **`src/store/slices/createPurchaseSlice.ts`**: Implementada lógica de paginación, filtros y recarga invalidante.
- **`src/store/slices/createEventSlice.ts`**: Implementada carga por rango de fechas (mensual).
- **`src/hooks/useFirestoreSync.ts`**: Eliminadas las llamadas `getAllDocuments` para las colecciones migradas.
- **`src/components/PurchasingView.tsx`**: UI actualizada para usar acciones asíncronas, filtros "server-side" y paginación.
- **`src/components/EventsView.tsx`**: UI actualizada para cargar eventos dinámicamente según el mes visualizado.
- **`firestore.indexes.json`**: Definidos índices compuestos necesarios para las nuevas queries.

## Plan de Pruebas Manuales (Verificación)

### 1. Carga Inicial
- [ ] Abrir la aplicación con la consola de desarrollador (F12) abierta.
- [ ] Verificar en la pestaña "Network" o logs que **NO** se realiza una descarga masiva de la colección `purchaseOrders` (anteriormente miles de documentos).
- [ ] La aplicación debe cargar más rápido al inicio.

### 2. Gestión de Compras
- [ ] Navegar a "Gestión de Compras".
- [ ] Debe aparecer un indicador de "Cargando..." brevemente.
- [ ] Verificar que se lista la primera página de pedidos (ordenados por fecha descendente).
- [ ] **Filtros**:
    - Seleccionar un proveedor: La lista debe recargarse mostrando solo ese proveedor.
    - Seleccionar "Sin Asignar": Debe mostrar pedidos con `supplierId: null`.
    - Cambiar estado: Debe filtrar correctamente.
- [ ] **Paginación**:
    - Si hay suficientes pedidos, hacer scroll al final y pulsar "Cargar más pedidos". Deben aparecer más items sin duplicados.

### 3. Calendario de Eventos
- [ ] Navegar a "Eventos".
- [ ] Verificar que se cargan los eventos del mes actual.
- [ ] Cambiar de mes (flechas adelante/atrás):
    - Debe aparecer "Cargando..." en el título.
    - Deben aparecer los eventos del nuevo mes seleccionado.

### 4. Mutaciones
- [ ] Crear un Pedido nuevo. Al volver a la lista, debe aparecer el primero (reset de lista).
- [ ] Crear un Evento. Debe aparecer en el calendario si está dentro del mes visible.
