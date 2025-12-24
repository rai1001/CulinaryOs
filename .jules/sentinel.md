## 2024-05-23 - Authentication Bypass in Production Build
**Vulnerability:** Found `E2E_TEST_USER` logic in `AuthWrapper.tsx` that allowed bypassing authentication by setting a localStorage key, without checking if the environment was development.
**Learning:** Developers often add "backdoors" or "shortcuts" for testing (E2E or manual) but forget to strip them from production builds.
**Prevention:** Always wrap test-specific logic (bypasses, mocks, seeders) in `if (import.meta.env.DEV)` or equivalent build-time flags so dead-code elimination removes them from production bundles.
