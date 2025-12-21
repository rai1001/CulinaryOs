# Palette's Journal

## 2025-12-21 - Systemic Form Accessibility Gaps
**Learning:** Consistently missing `htmlFor`/`id` associations in form components (`RecipeForm`, `EventForm`). This renders forms difficult to use for screen reader users.
**Action:** Establish a strict pattern of `label` + `input` pairing with unique IDs for all new form components. Refactor existing forms incrementally.
