# Bolt's Journal

## 2025-12-21 - Optimization: Memoize Inventory Counters

**Learning:** Large lists in React components often leak performance through un-memoized derived state. In `InventoryView`, the `expiringCount` and `lowStockCount` were recalculated on every render (including every keystroke in the search bar), iterating over the entire ingredient list even when only the search term changed.

**Action:** Always check for expensive array iterations (`.filter`, `.map`, `.reduce`) in the render body. If they depend on props/store data that changes less frequently than local state (like inputs), wrap them in `useMemo`.
