# Guía de Despliegue (CulinaryOs) 🚀

Este documento detalla el proceso para desplegar la aplicación en un entorno de producción utilizando **Firebase Hosting**.

## Requisitos Previos

1.  **Node.js**: v18 o superior.
2.  **Firebase CLI**: Instalado globalmente (`npm install -g firebase-tools`).
3.  **Cuenta de Firebase**: Acceso al proyecto con rol de Editor o Propietario.

## Pasos para el Despliegue

### 1. Preparación del Entorno
Asegúrate de tener un archivo `.env.production` con las credenciales correctas:
```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto
...
```

### 2. Login y Selección de Proyecto
```bash
firebase login
firebase use --add  # Selecciona el alias 'production'
```

### 3. Build de Producción
```bash
npm run build
```
> [!IMPORTANT]
> El build fallará si hay errores de TypeScript. Asegúrate de que `npx tsc` no devuelva errores antes de proceder.

### 4. Despliegue de Hosting
```bash
firebase deploy --only hosting
```

### 5. Despliegue de Reglas de Seguridad (Opcional)
Si has modificado `firestore.rules` o `storage.rules`:
```bash
firebase deploy --only firestore:rules
```

## Rollback
Si necesitas volver a una versión anterior rápidamente:
1. Ve a la consola de Firebase > Hosting.
2. Selecciona el historial de despliegues.
3. Elige la versión anterior y pulsa "Revertir".

## CI/CD (GitHub Actions)
El proyecto está preparado para desplegar automáticamente al hacer merge a `main`. Revisa `.github/workflows/firebase-hosting-merge.yml`.
