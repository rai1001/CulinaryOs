# Propuesta de Issues para CulinaryOs: Automatic Purchasing

He preparado 9 issues para organizar el desarrollo de la Fase 1. Debido a restricciones de autenticación, no he podido crearlos directamente en GitHub. Puedes usarlos como referencia para crearlos manualmente:

## 1. Feature: Auto-Purchasing UI Settings
**Descripción:** Implementar la interfaz de usuario para configurar las compras automáticas (frecuencia, umbrales, horas activas).
**Etiquetas:** frontend, enhancement

## 2. Backend: Weekly/Daily Stock Check Task
**Descripción:** Implementar una Cloud Function programada para analizar los niveles de stock frente a los puntos de pedido.
**Etiquetas:** backend, firebase-functions

## 3. Logic: Automatic Draft Order Generation
**Descripción:** Desarrollar la lógica central para consolidar las necesidades de inventario en órdenes de compra en borrador por proveedor.
**Etiquetas:** business-logic, inventory

## 4. Integration: Notification System for New Orders
**Descripción:** Alertas vía Slack/Email cuando se genera un borrador de pedido automático.
**Etiquetas:** integration, notifications

## 5. Supplier: Automatic Communication Bridge
**Descripción:** Infraestructura para enviar pedidos aprobados a proveedores mediante Email o WhatsApp API.
**Etiquetas:** service, communication

## 6. Cost: Historical Cost Analysis for Auto-Ordering
**Descripción:** Lógica para seleccionar proveedores basándose en el historial de precios y disponibilidad.
**Etiquetas:** internal-logic, analytics

## 7. Approval: Multi-level Order Approval Flow
**Descripción:** UX para que la gerencia apruebe pedidos automáticos que superen ciertos umbrales de coste.
**Etiquetas:** frontend, security

## 8. Real-time: Instant Reorder on Critical Stock Drop
**Descripción:** Reabastecimiento reactivo para ítems críticos que bajan del stock de seguridad antes de la programación regular.
**Etiquetas:** backend, performance

## 9. Analytics: Purchasing Demand Forecasting
**Descripción:** Lógica básica de proyección basada en consumos de semanas previas para ajustar cantidades sugeridas.
**Etiquetas:** research, logic
