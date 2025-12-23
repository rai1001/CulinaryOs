## 2024-05-24 - Backdoor in AuthWrapper for E2E testing
**Vulnerability:** A logic block in `AuthWrapper.tsx` checked `localStorage.getItem('E2E_TEST_USER')` and, if present, bypassed all Firebase authentication, impersonating the user defined in that local storage item.
**Learning:** Development convenience features (like mock auth for E2E tests) can easily become critical production vulnerabilities if not strictly guarded by environment checks.
**Prevention:** Always wrap development-only logic in `if (import.meta.env.DEV) { ... }` or similar build-time replacement guards to ensure dead-code elimination in production builds. Verify that such logic is unreachable in production artifacts.
