# Mobile QA Agent — Maw3edak Mobile

## Purpose
Static analysis of the React Native / Expo mobile application. Scans every screen, component, hook, context, and utility for real code issues.

## Scope

### Directories Scanned
- `app/` — All Expo Router screens (patient tabs, doctor tabs, auth flows)
- `components/` — Shared UI components
- `hooks/` — Custom React hooks
- `contexts/` — React context providers
- `utils/` — Utility functions
- `types/` — TypeScript type definitions

### What Is Detected

**Auth & Security**
- Sensitive data stored in unencrypted AsyncStorage (should use expo-secure-store)
- Hardcoded API keys or JWT tokens in source files
- Navigation without session/auth state verification
- Biometric gate bypass risks

**Supabase Integration**
- Supabase calls without `{ data, error }` destructuring
- Missing error handling after Supabase queries
- Realtime subscriptions without cleanup functions (memory leaks)
- Missing loading states for async Supabase operations

**React Native Patterns**
- `ScrollView` used for large dynamic lists (should be `FlatList`)
- `FlatList` without `keyExtractor`
- Inline arrow functions in `onPress` props (causes re-renders)
- `useEffect` subscriptions without cleanup return
- Direct state mutation
- Missing `key` prop in `.map()` rendered lists

**TypeScript Quality**
- `any` type usage that bypasses type checking
- Unhandled promise rejections (`.then()` without `.catch()`)
- Empty catch blocks that silently swallow errors

**UI / UX**
- Missing loading state indicators
- Missing error state displays
- Hardcoded URLs that should be environment variables
- Layout files missing ErrorBoundary wrappers
- Interactive elements without `accessibilityLabel`
- Large files (> 400 lines) that need decomposition

**Performance**
- Inline arrow functions causing unnecessary re-renders
- Subscriptions or listeners without cleanup (memory leaks)
- Large images without explicit dimensions

**Code Quality**
- `console.log` / `console.debug` in production code
- Unresolved TODO/FIXME/HACK comments

## Output
Generates `qa-agent/mobile/reports/mobile-report.md`

## Run
```bash
npm run qa:mobile
```
