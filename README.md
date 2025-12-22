# CulinaryOs 🍳
**Sistema de Gestión Inteligente para Cocinas Profesionales**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

CulinaryOs es una plataforma SaaS diseñada para optimizar la logística, el control de inventario y la rentabilidad en entornos de hostelería premium. Desde la trazabilidad de lotes hasta la generación automática de pedidos basada en demanda predecible.

## ✨ Características Principales

*   **📦 Gestión de Inventario Inteligente**: Control por lotes (FIFO), alertas de caducidad y stock mínimo.
*   **🛒 Compras Automáticas**: Generación de pedidos basada en previsiones de ocupación y eventos.
*   **📝 Fichas Técnicas 2.0**: Escandallos precisos con actualización de costos en tiempo real y análisis de rentabilidad.
*   **📊 Analytics & Engineering**: Matriz de Boston para ingeniería de menús y dashboards de KPIs operativos.
*   **🛡️ Control HACCP Digital**: Registros de temperatura y tareas de higiene con alertas críticas.
*   **🤖 AI Advisor**: Asistente inteligente para optimización de menús y resolución de roturas de stock.

## 🚀 Stack Tecnológico

*   **Frontend**: React 18, TypeScript, Vite, Tailwind CSS.
*   **Backend/BaaS**: Firebase (Firestore, Auth, Hosting).
*   **Estado**: Zustand (gestión ligera y eficiente).
*   **Iconografía**: Lucide React.
*   **Testing**: Playwright (E2E), Vitest (Unit).

## 🛠️ Instalación y Desarrollo

1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/user/CulinaryOs.git
    cd CulinaryOs
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Configurar Firebase**:
    Crea un proyecto en Firebase y añade tus credenciales en un archivo `.env` basado en `.env.example`.

4.  **Iniciar en modo desarrollo**:
    ```bash
    npm run dev
    ```

## 🧪 Testing

```bash
# Ejecutar tests unitarios
npm run test

# Ejecutar tests E2E
npx playwright test
```

## 🗺️ Roadmap v1.x
- [ ] Integración con TPVs (Alegra, CoverManager).
- [ ] Módulo de gestión de personal y turnos avanzado.
- [ ] App móvil nativa para inventariado rápido.

---
Desarrollado con ❤️ para la industria de la hospitalidad.
