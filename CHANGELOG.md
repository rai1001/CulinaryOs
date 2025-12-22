# Changelog

Todos los cambios notables en el proyecto **CulinaryOs** serán documentados en este archivo.

## [1.0.0] - 2025-12-22
### Añadido
- **Módulo de Fichas Técnicas**: Gestión completa de escandallos, versiones y trazabilidad de costos.
- **Importador de Recetas**: Herramienta para migrar recetas existentes a fichas técnicas con un click.
- **Logística de Hospitality**: Calculadora de necesidades basada en ocupación proyectada.
- **Mapa de Rentabilidad**: Visualización interactiva (Scatter Plot) de la rentabilidad vs costo.
- **Simulador de Escenarios**: Herramienta "What-if" para ajustar márgenes y porciones sin afectar datos reales.
- **Tema ChefOS Dark**: Refactorización estética premium de toda la interfaz (Inventory, Dashboard, Fichas).

### Cambiado
- **Aislamiento Multi-Outlet**: Implementación de seguridad en Firebase para garantizar que los datos no se mezclen entre puntos de venta.
- **Optimización de Inventario**: Nuevo flujo de escaneo de lotes con trazabilidad FIFO.
- **README y Documentación**: Actualización total para el lanzamiento oficial.

### Corregido
- Errores de sincronización de datos en el cambio de outlet.
- Warnings de build y errores de tipado TypeScript en servicios críticos.

## [0.1.0-alpha] - 2025-11-01
- Versión inicial con gestión básica de ingredientes y recetas.
- Implementación de Firebase Auth.
- Dashboard de stock bajo.

---
[1.0.0]: https://github.com/user/CulinaryOs/compare/v0.1.0-alpha...v1.0.0
