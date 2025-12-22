# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2025-12-21

### 🚀 Optimizations
- **Core Performance**: Implemented batched reads in `costosService.ts` to solve N+1 query issues during recipe cost calculation.
- **Sync Hooks**: Optimized `useProductionSync` and `usePurchaseOrdersSync` to filter data by date (Last 7 Days and Last 30 Days respectively), significantly reducing initial load time and Firestore read costs.
- **Database Indexing**: Updated `firestore.indexes.json` with new compound indexes (`outletId` + `date`) to support optimized queries.

### ♻️ Refactoring
- **FIFO Logic**: Unified duplicate inventory consumption logic. Removed `src/utils/inventory.ts` and centralized logic in `src/services/inventoryService.ts`.
- **Security**: Removed "Mock DB" bypass code from `pedidosService.ts`, ensuring all production traffic goes to authenticated Firestore endpoints.

### 🧪 Testing
- **Test Framework**: Established Vitest environment with `vi.mock` strategy for Firebase.
- **Unit Tests**:
  - `inventoryService`: Verified FIFO logic, partial consumption, and edge cases.
  - `necesidadesService`: Verified 14-day automatic purchase planning logic.
  - `costosService`: Verified cascade cost calculation and yield logic.

### 📚 Documentation
- **Architecture**: Added `docs/architecture/` with Schema and State Management guides.
- **User Guides**: Added `docs/user-guides/` for "Automatic Purchases" and "Technical Sheets" (Fichas Técnicas) with Mermaid diagrams.
- **Development**: Added `docs/development/TESTING_STRATEGY.md` with guidelines for future contributors.
