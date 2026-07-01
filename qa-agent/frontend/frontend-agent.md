# Frontend QA Agent — Maw3edak Mobile

## Purpose
UI-layer static analysis focused on screens and components. Checks rendering patterns, design consistency, form handling, navigation structure, loading/error states, and accessibility.

## Scope

### Directories Scanned
- `app/` — All Expo Router screens
- `components/` — Shared UI components

### What Is Detected

**Rendering Performance**
- `ScrollView` wrapping `.map()` for server-driven lists (should be `FlatList`)
- Inline `style={{ }}` objects instead of `StyleSheet.create()` — causes re-renders on every render cycle
- Direct state mutation instead of using state setter
- `useMemo` / `useCallback` with potentially incorrect empty dependency array `[]`

**List Rendering**
- `.map()` without `key` prop on root element
- `FlatList` without `keyExtractor`

**State & UX**
- Screens with async data fetching but no `loading` / `isLoading` state variable
- Missing error state UI for failed requests
- Large component files (> 350 lines) that are hard to test and maintain

**Design Consistency**
- Hardcoded hex color values (> 3 per file) instead of theme constants
- Inconsistent style patterns across files

**Code Quality**
- `console.log` / `console.debug` in UI files
- Unresolved TODO / FIXME / HACK comments

**Accessibility**
- Interactive elements (`TouchableOpacity`, `Pressable`) missing `accessibilityLabel`

## Output
Generates `qa-agent/frontend/reports/frontend-report.md`

## Run
```bash
npm run qa:frontend
```
