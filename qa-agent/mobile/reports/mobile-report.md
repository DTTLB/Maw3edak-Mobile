# 📱 Mobile QA Report — Maw3edak Mobile

**Generated:** 06/13/2026, 07:28:31 PM  
**React Native:** 0.81.5  
**Expo:** ~54.0.32  
**Backend:** Supabase  
**Scanned:** app, components, hooks, contexts, utils, types  

---

## Summary

| Severity | Count |
|---|---|
| 🔴 Critical | **0** |
| 🟠 High | **25** |
| 🟡 Medium | **149** |
| 🔵 Low | **1294** |
| ☁️ Supabase | **2** |
| 🔐 Security | **25** |
| ⚡ Performance | **439** |
| 📄 Files Affected | **67** |

---

## 🔴 Critical Issues

_No issues found._

---

## 🟠 High Issues

### H-001: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/(doctor-tabs)/index.tsx` (line 165)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-002: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 77)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-003: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 174)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-004: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 206)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-005: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 250)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-006: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/(doctor-tabs)/settings.tsx` (line 56)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-007: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/(doctor-tabs)/settings.tsx` (line 130)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-008: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/(doctor-tabs)/settings.tsx` (line 201)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-009: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/(tabs)/dental.tsx` (line 92)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-010: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/(tabs)/doctor-responses.tsx` (line 77)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-011: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/(tabs)/doctor-responses.tsx` (line 146)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-012: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/(tabs)/index.tsx` (line 181)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-013: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/(tabs)/index.tsx` (line 232)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-014: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/(tabs)/index.tsx` (line 269)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-015: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/(tabs)/invoices.tsx` (line 107)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-016: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/(tabs)/invoices.tsx` (line 171)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-017: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/(tabs)/orders.tsx` (line 78)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-018: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/(tabs)/packages.tsx` (line 56)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-019: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/(tabs)/prescriptions.tsx` (line 102)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-020: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/(tabs)/statement.tsx` (line 75)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-021: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/(tabs)/vision.tsx` (line 124)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-022: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/notifications.tsx` (line 86)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-023: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/notifications.tsx` (line 166)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-024: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/notifications.tsx` (line 193)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

### H-025: Sensitive data stored in unencrypted AsyncStorage
- **File:** `app/notifications.tsx` (line 225)
- **Detail:** const sessionData = await AsyncStorage.getItem('supabase_session');
- **Fix:** Use expo-secure-store for tokens, passwords, and auth data. AsyncStorage is plaintext-accessible on rooted devices.

---

## 🟡 Medium Issues

### M-001: TypeScript `any` type — bypasses type checking
- **File:** `app/_layout.tsx` (line 131)
- **Detail:** } catch (e: any) {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-002: Async data fetching without loading state
- **File:** `app/_layout.tsx` (line 1)
- **Detail:** No loading/isLoading variable found in file with data fetching
- **Fix:** Add `const [loading, setLoading] = useState(true)` and show <ActivityIndicator /> while loading.

### M-003: Layout file missing ErrorBoundary wrapper
- **File:** `app/(auth)/_layout.tsx` (line 1)
- **Detail:** No <ErrorBoundary> found — runtime errors will white-screen the app
- **Fix:** Wrap <Slot /> with <ErrorBoundary> to gracefully handle crashes and show a fallback UI.

### M-004: Large file (493 lines) — hard to maintain
- **File:** `app/(auth)/doctor-login.tsx` (line 1)
- **Detail:** 493 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-005: Async data fetching without loading state
- **File:** `app/(auth)/otp-verify.tsx` (line 1)
- **Detail:** No loading/isLoading variable found in file with data fetching
- **Fix:** Add `const [loading, setLoading] = useState(true)` and show <ActivityIndicator /> while loading.

### M-006: TypeScript `any` type — bypasses type checking
- **File:** `app/(auth)/patient-login.tsx` (line 178)
- **Detail:** } catch (tokenError: any) {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-007: TypeScript `any` type — bypasses type checking
- **File:** `app/(auth)/patient-login.tsx` (line 197)
- **Detail:** } catch (error: any) {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-008: Large file (557 lines) — hard to maintain
- **File:** `app/(auth)/patient-login.tsx` (line 1)
- **Detail:** 557 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-009: Large file (944 lines) — hard to maintain
- **File:** `app/(auth)/patient-register.tsx` (line 1)
- **Detail:** 944 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-010: Async data fetching without loading state
- **File:** `app/(auth)/patient-register.tsx` (line 1)
- **Detail:** No loading/isLoading variable found in file with data fetching
- **Fix:** Add `const [loading, setLoading] = useState(true)` and show <ActivityIndicator /> while loading.

### M-011: Async data fetching without loading state
- **File:** `app/(auth)/reset-password-otp.tsx` (line 1)
- **Detail:** No loading/isLoading variable found in file with data fetching
- **Fix:** Add `const [loading, setLoading] = useState(true)` and show <ActivityIndicator /> while loading.

### M-012: Large file (486 lines) — hard to maintain
- **File:** `app/(auth)/reset-password.tsx` (line 1)
- **Detail:** 486 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-013: Layout file missing ErrorBoundary wrapper
- **File:** `app/(doctor-tabs)/_layout.tsx` (line 1)
- **Detail:** No <ErrorBoundary> found — runtime errors will white-screen the app
- **Fix:** Wrap <Slot /> with <ErrorBoundary> to gracefully handle crashes and show a fallback UI.

### M-014: TypeScript `any` type — bypasses type checking
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 737)
- **Detail:** const createStyles = (colors: any) => StyleSheet.create({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-015: Large file (1033 lines) — hard to maintain
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 1)
- **Detail:** 1033 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-016: Large file (1189 lines) — hard to maintain
- **File:** `app/(doctor-tabs)/dental.tsx` (line 1)
- **Detail:** 1189 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-017: TypeScript `any` type — bypasses type checking
- **File:** `app/(doctor-tabs)/finance.tsx` (line 202)
- **Detail:** (data.transactions || []).map((tx: any) => ({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-018: TypeScript `any` type — bypasses type checking
- **File:** `app/(doctor-tabs)/finance.tsx` (line 847)
- **Detail:** const createStyles = (colors: any) => StyleSheet.create({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-019: Large file (1441 lines) — hard to maintain
- **File:** `app/(doctor-tabs)/finance.tsx` (line 1)
- **Detail:** 1441 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-020: TypeScript `any` type — bypasses type checking
- **File:** `app/(doctor-tabs)/index.tsx` (line 420)
- **Detail:** onPress={() => router.push(item.route as any)}
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-021: TypeScript `any` type — bypasses type checking
- **File:** `app/(doctor-tabs)/index.tsx` (line 442)
- **Detail:** onPress={() => router.push(item.route as any)}
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-022: Large file (836 lines) — hard to maintain
- **File:** `app/(doctor-tabs)/index.tsx` (line 1)
- **Detail:** 836 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-023: Large file (1104 lines) — hard to maintain
- **File:** `app/(doctor-tabs)/medications.tsx` (line 1)
- **Detail:** 1104 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-024: TypeScript `any` type — bypasses type checking
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 521)
- **Detail:** const createStyles = (colors: any) => StyleSheet.create({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-025: Large file (716 lines) — hard to maintain
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 1)
- **Detail:** 716 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-026: TypeScript `any` type — bypasses type checking
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 26)
- **Detail:** current_status: any;
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-027: TypeScript `any` type — bypasses type checking
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 479)
- **Detail:** {filteredNutritionData.goals.slice(0, 3).map((goal: any) => (
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-028: TypeScript `any` type — bypasses type checking
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 501)
- **Detail:** {filteredNutritionData.measurements.slice(0, 3).map((measurement: any) => (
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-029: TypeScript `any` type — bypasses type checking
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 529)
- **Detail:** {filteredNutritionData.follow_ups.slice(0, 3).map((followUp: any) => (
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-030: TypeScript `any` type — bypasses type checking
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 552)
- **Detail:** {filteredNutritionData.meal_plans.slice(0, 3).map((plan: any) => (
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-031: TypeScript `any` type — bypasses type checking
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 573)
- **Detail:** {filteredNutritionData.documents.slice(0, 3).map((doc: any) => (
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-032: Large file (1175 lines) — hard to maintain
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 1)
- **Detail:** 1175 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-033: Large file (1090 lines) — hard to maintain
- **File:** `app/(doctor-tabs)/orders.tsx` (line 1)
- **Detail:** 1090 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-034: TypeScript `any` type — bypasses type checking
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 26)
- **Detail:** options?: any;
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-035: Large file (1231 lines) — hard to maintain
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 1)
- **Detail:** 1231 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-036: TypeScript `any` type — bypasses type checking
- **File:** `app/(doctor-tabs)/patient-appointments.tsx` (line 80)
- **Detail:** const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-037: TypeScript `any` type — bypasses type checking
- **File:** `app/(doctor-tabs)/patient-appointments.tsx` (line 104)
- **Detail:** icon: any; label: string; value: string; color?: string;
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-038: TypeScript `any` type — bypasses type checking
- **File:** `app/(doctor-tabs)/patient-appointments.tsx` (line 130)
- **Detail:** appt: Appointment; isLast: boolean; colors: any; isDark: boolean;
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-039: Large file (502 lines) — hard to maintain
- **File:** `app/(doctor-tabs)/patient-appointments.tsx` (line 1)
- **Detail:** 502 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-040: TypeScript `any` type — bypasses type checking
- **File:** `app/(doctor-tabs)/questions.tsx` (line 39)
- **Detail:** options?: any;
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-041: TypeScript `any` type — bypasses type checking
- **File:** `app/(doctor-tabs)/questions.tsx` (line 400)
- **Detail:** const targetQuestionnaire = assignments.find((q: any) => q.id === questionnaireId);
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-042: Large file (2073 lines) — hard to maintain
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1)
- **Detail:** 2073 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-043: TypeScript `any` type — bypasses type checking
- **File:** `app/(doctor-tabs)/settings.tsx` (line 116)
- **Detail:** const content = helpContent.find((item: any) => item.section === section);
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-044: Large file (608 lines) — hard to maintain
- **File:** `app/(doctor-tabs)/settings.tsx` (line 1)
- **Detail:** 608 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-045: TypeScript `any` type — bypasses type checking
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 344)
- **Detail:** if (selectedClinic && !result.data.clinics.some((c: any) => c.id === selectedClinic.id)) {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-046: TypeScript `any` type — bypasses type checking
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 897)
- **Detail:** } catch (error: any) {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-047: Large file (3251 lines) — hard to maintain
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1)
- **Detail:** 3251 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-048: Large file (1247 lines) — hard to maintain
- **File:** `app/(doctor-tabs)/vision.tsx` (line 1)
- **Detail:** 1247 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-049: Layout file missing ErrorBoundary wrapper
- **File:** `app/(tabs)/_layout.tsx` (line 1)
- **Detail:** No <ErrorBoundary> found — runtime errors will white-screen the app
- **Fix:** Wrap <Slot /> with <ErrorBoundary> to gracefully handle crashes and show a fallback UI.

### M-050: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/appointments.tsx` (line 708)
- **Detail:** const createStyles = (colors: any) => StyleSheet.create({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-051: Large file (1025 lines) — hard to maintain
- **File:** `app/(tabs)/appointments.tsx` (line 1)
- **Detail:** 1025 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-052: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/dental.tsx` (line 611)
- **Detail:** const createStyles = (colors: any) => StyleSheet.create({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-053: Large file (1016 lines) — hard to maintain
- **File:** `app/(tabs)/dental.tsx` (line 1)
- **Detail:** 1016 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-054: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/doctor-responses.tsx` (line 14)
- **Detail:** options?: any;
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-055: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/doctor-responses.tsx` (line 61)
- **Detail:** const [formData, setFormData] = useState<{ [key: string]: any }>({});
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-056: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/doctor-responses.tsx` (line 629)
- **Detail:** const createStyles = (colors: any) => StyleSheet.create({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-057: Large file (1077 lines) — hard to maintain
- **File:** `app/(tabs)/doctor-responses.tsx` (line 1)
- **Detail:** 1077 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-058: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/doctors.tsx` (line 396)
- **Detail:** const createStyles = (colors: any) => StyleSheet.create({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-059: Large file (626 lines) — hard to maintain
- **File:** `app/(tabs)/doctors.tsx` (line 1)
- **Detail:** 626 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-060: Hardcoded URL — should be an environment variable
- **File:** `app/(tabs)/doctors.tsx` (line 161)
- **Detail:** window.open(`https://wa.me/${cleanNumber}`, '_blank');
- **Fix:** Move to .env as EXPO_PUBLIC_API_URL and access via process.env.EXPO_PUBLIC_API_URL.

### M-061: Hardcoded URL — should be an environment variable
- **File:** `app/(tabs)/doctors.tsx` (line 165)
- **Detail:** `https://wa.me/${cleanNumber}`,
- **Fix:** Move to .env as EXPO_PUBLIC_API_URL and access via process.env.EXPO_PUBLIC_API_URL.

### M-062: Hardcoded URL — should be an environment variable
- **File:** `app/(tabs)/doctors.tsx` (line 166)
- **Detail:** `https://api.whatsapp.com/send?phone=${cleanNumber}`
- **Fix:** Move to .env as EXPO_PUBLIC_API_URL and access via process.env.EXPO_PUBLIC_API_URL.

### M-063: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/index.tsx` (line 39)
- **Detail:** icon: any;
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-064: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/index.tsx` (line 357)
- **Detail:** onPress={() => router.push('/notifications' as any)}
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-065: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/index.tsx` (line 407)
- **Detail:** onPress={() => router.push('/edit-profile' as any)}
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-066: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/index.tsx` (line 485)
- **Detail:** onPress={() => router.push('/book-appointment' as any)}
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-067: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/index.tsx` (line 593)
- **Detail:** const createStyles = (width: number, colors: any) => StyleSheet.create({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-068: Large file (972 lines) — hard to maintain
- **File:** `app/(tabs)/index.tsx` (line 1)
- **Detail:** 972 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-069: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/invoices.tsx` (line 764)
- **Detail:** const createStyles = (colors: any) => StyleSheet.create({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-070: Large file (1280 lines) — hard to maintain
- **File:** `app/(tabs)/invoices.tsx` (line 1)
- **Detail:** 1280 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-071: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/nutrition.tsx` (line 16)
- **Detail:** current_status: any;
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-072: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/nutrition.tsx` (line 81)
- **Detail:** const body: any = { medicalId: session.patient.medical_id };
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-073: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/nutrition.tsx` (line 152)
- **Detail:** const openDocument = async (doc: any) => {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-074: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/nutrition.tsx` (line 419)
- **Detail:** {nutritionData.goals.slice(0, 3).map((goal: any) => (
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-075: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/nutrition.tsx` (line 441)
- **Detail:** {nutritionData.measurements.slice(0, 3).map((measurement: any) => (
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-076: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/nutrition.tsx` (line 469)
- **Detail:** {nutritionData.follow_ups.slice(0, 3).map((followUp: any) => (
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-077: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/nutrition.tsx` (line 492)
- **Detail:** {nutritionData.meal_plans.slice(0, 3).map((plan: any) => (
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-078: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/nutrition.tsx` (line 513)
- **Detail:** {nutritionData.documents.slice(0, 3).map((doc: any) => (
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-079: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/nutrition.tsx` (line 535)
- **Detail:** const createStyles = (colors: any) => StyleSheet.create({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-080: Large file (922 lines) — hard to maintain
- **File:** `app/(tabs)/nutrition.tsx` (line 1)
- **Detail:** 922 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-081: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/orders.tsx` (line 128)
- **Detail:** const formattedOrders = result.orders.map((order: any) => ({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-082: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/orders.tsx` (line 574)
- **Detail:** const createStyles = (colors: any) => StyleSheet.create({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-083: Large file (891 lines) — hard to maintain
- **File:** `app/(tabs)/orders.tsx` (line 1)
- **Detail:** 891 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-084: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/packages.tsx` (line 278)
- **Detail:** const createStyles = (colors: any) => StyleSheet.create({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-085: Large file (509 lines) — hard to maintain
- **File:** `app/(tabs)/packages.tsx` (line 1)
- **Detail:** 509 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-086: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/prescriptions.tsx` (line 149)
- **Detail:** const formattedDoctors = doctorsData.doctors.map((doc: any) => ({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-087: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/prescriptions.tsx` (line 652)
- **Detail:** const createStyles = (colors: any) => StyleSheet.create({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-088: Large file (1024 lines) — hard to maintain
- **File:** `app/(tabs)/prescriptions.tsx` (line 1)
- **Detail:** 1024 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-089: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/profile.tsx` (line 363)
- **Detail:** } as any);
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-090: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/profile.tsx` (line 427)
- **Detail:** const updatePayload: any = {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-091: Large file (1058 lines) — hard to maintain
- **File:** `app/(tabs)/profile.tsx` (line 1)
- **Detail:** 1058 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-092: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/settings.tsx` (line 155)
- **Detail:** const content = helpContent.find((item: any) => item.section === section);
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-093: Large file (960 lines) — hard to maintain
- **File:** `app/(tabs)/settings.tsx` (line 1)
- **Detail:** 960 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-094: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/statement.tsx` (line 91)
- **Detail:** const requestBody: any = { medicalId };
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-095: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/statement.tsx` (line 467)
- **Detail:** const createStyles = (colors: any) => StyleSheet.create({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-096: Large file (865 lines) — hard to maintain
- **File:** `app/(tabs)/statement.tsx` (line 1)
- **Detail:** 865 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-097: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/vision.tsx` (line 154)
- **Detail:** const formattedDoctors = doctorsData.doctors.map((doc: any) => ({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-098: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/vision.tsx` (line 195)
- **Detail:** const requestBody: any = { medicalId };
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-099: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/vision.tsx` (line 654)
- **Detail:** const createStyles = (colors: any) => StyleSheet.create({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-100: Large file (1082 lines) — hard to maintain
- **File:** `app/(tabs)/vision.tsx` (line 1)
- **Detail:** 1082 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-101: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/visit-history.tsx` (line 119)
- **Detail:** const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-102: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/visit-history.tsx` (line 151)
- **Detail:** icon: any; label: string; value: string; color?: string; colors: any;
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-103: TypeScript `any` type — bypasses type checking
- **File:** `app/(tabs)/visit-history.tsx` (line 176)
- **Detail:** appt: Appointment; isLast: boolean; colors: any; isDark: boolean;
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-104: Large file (682 lines) — hard to maintain
- **File:** `app/(tabs)/visit-history.tsx` (line 1)
- **Detail:** 682 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-105: TypeScript `any` type — bypasses type checking
- **File:** `app/book-appointment.tsx` (line 67)
- **Detail:** const steps: { id: Step; label: string; icon: any }[] = [
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-106: Large file (1410 lines) — hard to maintain
- **File:** `app/book-appointment.tsx` (line 1)
- **Detail:** 1410 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-107: TypeScript `any` type — bypasses type checking
- **File:** `app/debug-token.tsx` (line 77)
- **Detail:** } catch (err: any) {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-108: TypeScript `any` type — bypasses type checking
- **File:** `app/debug-token.tsx` (line 133)
- **Detail:** } catch (error: any) {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-109: Large file (407 lines) — hard to maintain
- **File:** `app/debug-token.tsx` (line 1)
- **Detail:** 407 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-110: TypeScript `any` type — bypasses type checking
- **File:** `app/device-token-debug.tsx` (line 74)
- **Detail:** } catch (err: any) {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-111: TypeScript `any` type — bypasses type checking
- **File:** `app/device-token-debug.tsx` (line 124)
- **Detail:** } catch (err: any) {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-112: Large file (521 lines) — hard to maintain
- **File:** `app/device-token-debug.tsx` (line 1)
- **Detail:** 521 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-113: TypeScript `any` type — bypasses type checking
- **File:** `app/edit-profile.tsx` (line 146)
- **Detail:** } catch (error: any) {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-114: TypeScript `any` type — bypasses type checking
- **File:** `app/edit-profile.tsx` (line 299)
- **Detail:** } as any);
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-115: TypeScript `any` type — bypasses type checking
- **File:** `app/edit-profile.tsx` (line 332)
- **Detail:** } catch (error: any) {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-116: TypeScript `any` type — bypasses type checking
- **File:** `app/edit-profile.tsx` (line 374)
- **Detail:** const updatePayload: any = {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-117: TypeScript `any` type — bypasses type checking
- **File:** `app/edit-profile.tsx` (line 431)
- **Detail:** } catch (error: any) {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-118: Large file (993 lines) — hard to maintain
- **File:** `app/edit-profile.tsx` (line 1)
- **Detail:** 993 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-119: TypeScript `any` type — bypasses type checking
- **File:** `app/help-center.tsx` (line 215)
- **Detail:** const createStyles = (colors: any) => StyleSheet.create({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-120: TypeScript `any` type — bypasses type checking
- **File:** `app/notifications.tsx` (line 385)
- **Detail:** const createStyles = (colors: any) => StyleSheet.create({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-121: Large file (481 lines) — hard to maintain
- **File:** `app/notifications.tsx` (line 1)
- **Detail:** 481 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-122: Large file (914 lines) — hard to maintain
- **File:** `app/payment-methods.tsx` (line 1)
- **Detail:** 914 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-123: Async data fetching without loading state
- **File:** `app/test-device-token.tsx` (line 1)
- **Detail:** No loading/isLoading variable found in file with data fetching
- **Fix:** Add `const [loading, setLoading] = useState(true)` and show <ActivityIndicator /> while loading.

### M-124: Large file (437 lines) — hard to maintain
- **File:** `components/BiometricAuthGate.tsx` (line 1)
- **Detail:** 437 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-125: Large file (482 lines) — hard to maintain
- **File:** `components/CardScannerModal.tsx` (line 1)
- **Detail:** 482 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-126: Async data fetching without loading state
- **File:** `components/CardScannerModal.tsx` (line 1)
- **Detail:** No loading/isLoading variable found in file with data fetching
- **Fix:** Add `const [loading, setLoading] = useState(true)` and show <ActivityIndicator /> while loading.

### M-127: Large file (406 lines) — hard to maintain
- **File:** `components/ImageCaptcha.tsx` (line 1)
- **Detail:** 406 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-128: TypeScript `any` type — bypasses type checking
- **File:** `components/NotificationCard.tsx` (line 128)
- **Detail:** const createStyles = (colors: any, read: boolean) => StyleSheet.create({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-129: TypeScript `any` type — bypasses type checking
- **File:** `components/NotificationDetail.tsx` (line 223)
- **Detail:** const createStyles = (colors: any) => StyleSheet.create({
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-130: TypeScript `any` type — bypasses type checking
- **File:** `contexts/AuthContext.tsx` (line 188)
- **Detail:** let authSubscription: any = null;
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-131: TypeScript `any` type — bypasses type checking
- **File:** `contexts/AuthContext.tsx` (line 225)
- **Detail:** new Promise<{ data: { session: null }, error: any }>((resolve) =>
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-132: TypeScript `any` type — bypasses type checking
- **File:** `contexts/AuthContext.tsx` (line 244)
- **Detail:** } catch (error: any) {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-133: Supabase call result not destructured for error
- **File:** `contexts/AuthContext.tsx` (line 46)
- **Detail:** const { data: { session: currentSession } } = await supabase.auth.getSession();
- **Fix:** Use `const { data, error } = await supabase...` then `if (error) throw error` before using data.

### M-134: Supabase call result not destructured for error
- **File:** `contexts/AuthContext.tsx` (line 154)
- **Detail:** await supabase.auth.signOut();
- **Fix:** Use `const { data, error } = await supabase...` then `if (error) throw error` before using data.

### M-135: TypeScript `any` type — bypasses type checking
- **File:** `utils/auth.ts` (line 16)
- **Detail:** [key: string]: any;
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-136: TypeScript `any` type — bypasses type checking
- **File:** `utils/auth.ts` (line 30)
- **Detail:** [key: string]: any;
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-137: TypeScript `any` type — bypasses type checking
- **File:** `utils/auth.ts` (line 100)
- **Detail:** export const handleTokenExpiration = async (error: any, router?: any): Promise<boolean> => {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-138: TypeScript `any` type — bypasses type checking
- **File:** `utils/firebase.ts` (line 3)
- **Detail:** let firebaseApp: any = null;
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-139: TypeScript `any` type — bypasses type checking
- **File:** `utils/notifications.ts` (line 9)
- **Detail:** let messaging: any = null;
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-140: TypeScript `any` type — bypasses type checking
- **File:** `utils/notifications.ts` (line 11)
- **Detail:** function handleNotificationNavigation(remoteMessage: any) {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-141: TypeScript `any` type — bypasses type checking
- **File:** `utils/notifications.ts` (line 546)
- **Detail:** const unsubscribeForeground = msg().onMessage(async (remoteMessage: any) => {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-142: TypeScript `any` type — bypasses type checking
- **File:** `utils/notifications.ts` (line 570)
- **Detail:** const unsubscribeBackgroundTap = msg().onNotificationOpenedApp((remoteMessage: any) => {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-143: TypeScript `any` type — bypasses type checking
- **File:** `utils/notifications.ts` (line 619)
- **Detail:** msg().setBackgroundMessageHandler(async (remoteMessage: any) => {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-144: Promise .then() without .catch() — unhandled rejection
- **File:** `utils/notifications.ts` (line 581)
- **Detail:** getInitialNotification().then((remoteMessage) => {
- **Fix:** Add .catch(err => ...) or rewrite as async/await with try/catch to cover all error paths.

### M-145: Large file (657 lines) — hard to maintain
- **File:** `utils/notifications.ts` (line 1)
- **Detail:** 657 lines of code in a single file
- **Fix:** Extract sub-components into separate files and move business logic into custom hooks.

### M-146: Async data fetching without loading state
- **File:** `utils/notifications.ts` (line 1)
- **Detail:** No loading/isLoading variable found in file with data fetching
- **Fix:** Add `const [loading, setLoading] = useState(true)` and show <ActivityIndicator /> while loading.

### M-147: TypeScript `any` type — bypasses type checking
- **File:** `utils/supabase.ts` (line 31)
- **Detail:** let supabaseClient: any;
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-148: TypeScript `any` type — bypasses type checking
- **File:** `utils/supabase.ts` (line 65)
- **Detail:** } catch (error: any) {
- **Fix:** Define a specific interface or union type. Use `unknown` + type guard when the shape is truly dynamic.

### M-149: Async data fetching without loading state
- **File:** `utils/supabase.ts` (line 1)
- **Detail:** No loading/isLoading variable found in file with data fetching
- **Fix:** Add `const [loading, setLoading] = useState(true)` and show <ActivityIndicator /> while loading.

---

## 🔵 Low Issues

### L-001: console statement in production code
- **File:** `app/_layout.tsx` (line 27)
- **Detail:** console.log('Initializing Firebase...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-002: console statement in production code
- **File:** `app/_layout.tsx` (line 30)
- **Detail:** console.log('✅ Firebase initialized successfully');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-003: console statement in production code
- **File:** `app/_layout.tsx` (line 34)
- **Detail:** console.error('❌ Firebase initialization failed. Notifications will not work.');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-004: console statement in production code
- **File:** `app/_layout.tsx` (line 35)
- **Detail:** console.error('Make sure to:');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-005: console statement in production code
- **File:** `app/_layout.tsx` (line 36)
- **Detail:** console.error('1. Uninstall old app completely');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-006: console statement in production code
- **File:** `app/_layout.tsx` (line 37)
- **Detail:** console.error('2. Run: cd android && ./gradlew clean');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-007: console statement in production code
- **File:** `app/_layout.tsx` (line 38)
- **Detail:** console.error('3. Rebuild: npx expo run:android');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-008: console statement in production code
- **File:** `app/_layout.tsx` (line 43)
- **Detail:** console.log('App starting on platform:', Platform.OS);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-009: console statement in production code
- **File:** `app/_layout.tsx` (line 44)
- **Detail:** console.log('Environment variables loaded:', {
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-010: console statement in production code
- **File:** `app/_layout.tsx` (line 51)
- **Detail:** console.error('Global Error:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-011: console statement in production code
- **File:** `app/_layout.tsx` (line 52)
- **Detail:** console.error('Stack:', error.stack);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-012: console statement in production code
- **File:** `app/_layout.tsx` (line 53)
- **Detail:** console.error('Is Fatal:', isFatal);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-013: console statement in production code
- **File:** `app/_layout.tsx` (line 56)
- **Detail:** console.error('ANDROID ERROR DETAILS:', {
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-014: console statement in production code
- **File:** `app/_layout.tsx` (line 91)
- **Detail:** console.log('=== APP INITIALIZATION START ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-015: console statement in production code
- **File:** `app/_layout.tsx` (line 92)
- **Detail:** console.log('Timestamp:', new Date().toISOString());
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-016: console statement in production code
- **File:** `app/_layout.tsx` (line 96)
- **Detail:** console.error('⚠️ EMERGENCY TIMEOUT - Force starting app after 5 seconds');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-017: console statement in production code
- **File:** `app/_layout.tsx` (line 103)
- **Detail:** console.log('Fonts loaded:', fontsLoaded);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-018: console statement in production code
- **File:** `app/_layout.tsx` (line 104)
- **Detail:** console.log('Font error:', fontError);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-019: console statement in production code
- **File:** `app/_layout.tsx` (line 109)
- **Detail:** console.log('Fonts ready immediately');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-020: console statement in production code
- **File:** `app/_layout.tsx` (line 115)
- **Detail:** console.log('Fonts ready after check');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-021: console statement in production code
- **File:** `app/_layout.tsx` (line 122)
- **Detail:** console.log('Font timeout - continuing anyway');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-022: console statement in production code
- **File:** `app/_layout.tsx` (line 130)
- **Detail:** console.log(`App preparation completed in ${elapsed}ms`);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-023: console statement in production code
- **File:** `app/_layout.tsx` (line 132)
- **Detail:** console.error('❌ Preparation error:', e);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-024: console statement in production code
- **File:** `app/_layout.tsx` (line 137)
- **Detail:** console.log('✓ Setting app ready');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-025: console statement in production code
- **File:** `app/_layout.tsx` (line 140)
- **Detail:** .then(() => console.log('✓ Splash screen hidden'))
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-026: console statement in production code
- **File:** `app/_layout.tsx` (line 141)
- **Detail:** .catch((e) => console.warn('Error hiding splash:', e));
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-027: console statement in production code
- **File:** `app/_layout.tsx` (line 147)
- **Detail:** console.log('Starting app initialization...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-028: console statement in production code
- **File:** `app/_layout.tsx` (line 159)
- **Detail:** console.error('App error state:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-029: console statement in production code
- **File:** `app/_layout.tsx` (line 167)
- **Detail:** console.log('Setting up notification listeners...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-030: console statement in production code
- **File:** `app/_layout.tsx` (line 170)
- **Detail:** console.log('Cleaning up notification listeners');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-031: console statement in production code
- **File:** `app/_layout.tsx` (line 181)
- **Detail:** console.log('Root back handler triggered');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-032: console statement in production code
- **File:** `app/_layout.tsx` (line 197)
- **Detail:** <BiometricAuthGate onAuthComplete={() => console.log('Biometric auth completed')
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-033: console statement in production code
- **File:** `app/(auth)/doctor-login.tsx` (line 52)
- **Detail:** console.log('Attempting doctor login with email:', email.trim());
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-034: console statement in production code
- **File:** `app/(auth)/doctor-login.tsx` (line 59)
- **Detail:** console.log('Initializing Firebase for notifications...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-035: console statement in production code
- **File:** `app/(auth)/doctor-login.tsx` (line 62)
- **Detail:** console.log('Getting FCM token...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-036: console statement in production code
- **File:** `app/(auth)/doctor-login.tsx` (line 64)
- **Detail:** console.log('FCM token obtained:', tokenToUse ? 'Yes' : 'No');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-037: console statement in production code
- **File:** `app/(auth)/doctor-login.tsx` (line 75)
- **Detail:** console.warn('Firebase initialization failed, continuing without token');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-038: console statement in production code
- **File:** `app/(auth)/doctor-login.tsx` (line 78)
- **Detail:** console.error('Failed to get FCM token:', tokenError);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-039: console statement in production code
- **File:** `app/(auth)/doctor-login.tsx` (line 100)
- **Detail:** console.log('Response status:', response.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-040: console statement in production code
- **File:** `app/(auth)/doctor-login.tsx` (line 102)
- **Detail:** console.log('Response data:', data);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-041: console statement in production code
- **File:** `app/(auth)/doctor-login.tsx` (line 105)
- **Detail:** console.log('=== MULTIPLE CLINICS FOUND ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-042: console statement in production code
- **File:** `app/(auth)/doctor-login.tsx` (line 106)
- **Detail:** console.log('Number of clinics:', data.companies.length);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-043: console statement in production code
- **File:** `app/(auth)/doctor-login.tsx` (line 114)
- **Detail:** console.log('=== DOCTOR LOGIN SUCCESS ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-044: console statement in production code
- **File:** `app/(auth)/doctor-login.tsx` (line 115)
- **Detail:** console.log('User ID:', data.user?.id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-045: console statement in production code
- **File:** `app/(auth)/doctor-login.tsx` (line 116)
- **Detail:** console.log('Company ID:', data.user?.company_id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-046: console statement in production code
- **File:** `app/(auth)/doctor-login.tsx` (line 125)
- **Detail:** console.log('Session saved successfully');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-047: console statement in production code
- **File:** `app/(auth)/doctor-login.tsx` (line 128)
- **Detail:** console.log('Auth context refreshed');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-048: console statement in production code
- **File:** `app/(auth)/doctor-login.tsx` (line 131)
- **Detail:** console.log('✅ Device token registered during login');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-049: console statement in production code
- **File:** `app/(auth)/doctor-login.tsx` (line 133)
- **Detail:** console.log('⚠️ No device token registered - notifications may not work');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-050: console statement in production code
- **File:** `app/(auth)/doctor-login.tsx` (line 142)
- **Detail:** console.error('Login error:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-051: console statement in production code
- **File:** `app/(auth)/doctor-login.tsx` (line 151)
- **Detail:** console.log('=== CLINIC SELECTED ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-052: console statement in production code
- **File:** `app/(auth)/doctor-login.tsx` (line 152)
- **Detail:** console.log('Clinic Name:', company.company_name);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-053: console statement in production code
- **File:** `app/(auth)/doctor-login.tsx` (line 153)
- **Detail:** console.log('Clinic ID:', company.company_id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-054: console statement in production code
- **File:** `app/(auth)/doctor-login.tsx` (line 154)
- **Detail:** console.log('User Role:', company.role);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-055: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/doctor-login.tsx` (line 168)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-056: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/doctor-login.tsx` (line 200)
- **Detail:** onPress={() => handleCompanySelect(company)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-057: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/doctor-login.tsx` (line 239)
- **Detail:** onPress={() => router.back()}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-058: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/doctor-login.tsx` (line 299)
- **Detail:** onPress={() => setShowPassword(!showPassword)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-059: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/doctor-login.tsx` (line 313)
- **Detail:** onPress={() => handleSignIn()}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-060: console statement in production code
- **File:** `app/(auth)/forgot-password.tsx` (line 98)
- **Detail:** console.error('Error:', err);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-061: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/forgot-password.tsx` (line 118)
- **Detail:** onPress={() => router.back()}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-062: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/forgot-password.tsx` (line 174)
- **Detail:** onPress={() => router.back()}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-063: console statement in production code
- **File:** `app/(auth)/otp-verify.tsx` (line 114)
- **Detail:** console.error('OTP verification error:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-064: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/otp-verify.tsx` (line 139)
- **Detail:** onPress={() => router.back()}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-065: Touchable element missing accessibilityLabel
- **File:** `app/(auth)/otp-verify.tsx` (line 200)
- **Detail:** <TouchableOpacity onPress={handleResendOTP} disabled={isVerifying}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-066: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 69)
- **Detail:** console.log('=== PATIENT LOGIN ATTEMPT ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-067: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 70)
- **Detail:** console.log('Login Method:', loginMethod);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-068: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 71)
- **Detail:** console.log('Medical ID:', medicalId);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-069: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 72)
- **Detail:** console.log('Mobile Number:', mobileNumber);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-070: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 73)
- **Detail:** console.log('Supabase URL:', config.supabaseUrl);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-071: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 95)
- **Detail:** console.log('Response status:', response.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-072: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 96)
- **Detail:** console.log('Response ok:', response.ok);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-073: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 99)
- **Detail:** console.log('Response data:', JSON.stringify(data, null, 2));
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-074: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 102)
- **Detail:** console.log('=== LOGIN SUCCESS ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-075: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 103)
- **Detail:** console.log('Patient ID:', data.patient?.id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-076: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 104)
- **Detail:** console.log('User ID:', data.user?.id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-077: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 114)
- **Detail:** console.log('Session saved successfully');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-078: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 117)
- **Detail:** console.log('Auth context refreshed');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-079: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 121)
- **Detail:** console.log('Web platform - skipping device token registration');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-080: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 126)
- **Detail:** console.log('=== STARTING PUSH NOTIFICATION REGISTRATION ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-081: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 129)
- **Detail:** console.log('Initializing Firebase for notifications...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-082: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 132)
- **Detail:** console.error('❌ Firebase initialization failed - continuing without notificatio
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-083: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 136)
- **Detail:** console.log('✅ Firebase initialized');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-084: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 140)
- **Detail:** console.log('=== PUSH TOKEN RESULT ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-085: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 141)
- **Detail:** console.log('Token:', pushToken);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-086: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 142)
- **Detail:** console.log('Token type:', typeof pushToken);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-087: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 143)
- **Detail:** console.log('Token length:', pushToken?.length);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-088: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 146)
- **Detail:** console.error('❌ NO TOKEN RECEIVED - continuing without notifications');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-089: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 152)
- **Detail:** console.error('❌ MISSING PATIENT DATA');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-090: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 157)
- **Detail:** console.log('=== SAVING DEVICE TOKEN ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-091: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 158)
- **Detail:** console.log('Patient ID:', data.patient.id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-092: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 159)
- **Detail:** console.log('Medical ID:', data.patient.medical_id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-093: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 160)
- **Detail:** console.log('Token (first 30 chars):', pushToken.substring(0, 30) + '...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-094: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 170)
- **Detail:** console.log('=== DEVICE TOKEN SAVE RESULT ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-095: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 171)
- **Detail:** console.log('Saved:', saved);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-096: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 174)
- **Detail:** console.log('✅ DEVICE TOKEN SAVED SUCCESSFULLY');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-097: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 176)
- **Detail:** console.error('❌ FAILED TO SAVE DEVICE TOKEN');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-098: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 179)
- **Detail:** console.error('❌ TOKEN REGISTRATION ERROR:', tokenError);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-099: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 183)
- **Detail:** console.log('=== NAVIGATING TO TABS ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-100: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 186)
- **Detail:** console.error('=== LOGIN FAILED ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-101: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 187)
- **Detail:** console.error('Response OK:', response.ok);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-102: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 188)
- **Detail:** console.error('Response status:', response.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-103: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 189)
- **Detail:** console.error('Has Session:', !!data.session);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-104: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 190)
- **Detail:** console.error('Has User:', !!data.user);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-105: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 191)
- **Detail:** console.error('Error:', data.error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-106: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 192)
- **Detail:** console.error('Full response data:', data);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-107: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 198)
- **Detail:** console.error('=== LOGIN EXCEPTION ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-108: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 199)
- **Detail:** console.error('Error:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-109: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 200)
- **Detail:** console.error('Error message:', error?.message);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-110: console statement in production code
- **File:** `app/(auth)/patient-login.tsx` (line 201)
- **Detail:** console.error('Error stack:', error?.stack);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-111: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/patient-login.tsx` (line 230)
- **Detail:** onPress={() => router.back()}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-112: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/patient-login.tsx` (line 257)
- **Detail:** onPress={() => setLoginMethod('medical_id')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-113: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/patient-login.tsx` (line 280)
- **Detail:** onPress={() => setLoginMethod('mobile')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-114: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/patient-login.tsx` (line 349)
- **Detail:** onPress={() => setShowPassword(!showPassword)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-115: Touchable element missing accessibilityLabel
- **File:** `app/(auth)/patient-login.tsx` (line 361)
- **Detail:** <TouchableOpacity onPress={handleForgotPassword}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-116: Touchable element missing accessibilityLabel
- **File:** `app/(auth)/patient-login.tsx` (line 381)
- **Detail:** <TouchableOpacity onPress={handleRegister}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-117: console statement in production code
- **File:** `app/(auth)/patient-register.tsx` (line 90)
- **Detail:** console.error('Error checking email:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-118: console statement in production code
- **File:** `app/(auth)/patient-register.tsx` (line 138)
- **Detail:** console.error('Error checking phone:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-119: console statement in production code
- **File:** `app/(auth)/patient-register.tsx` (line 233)
- **Detail:** console.log('Sending registration request...', {
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-120: console statement in production code
- **File:** `app/(auth)/patient-register.tsx` (line 262)
- **Detail:** console.log('Response status:', response.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-121: console statement in production code
- **File:** `app/(auth)/patient-register.tsx` (line 264)
- **Detail:** console.log('Response body:', responseText);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-122: console statement in production code
- **File:** `app/(auth)/patient-register.tsx` (line 270)
- **Detail:** console.error('Failed to parse response:', parseError);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-123: console statement in production code
- **File:** `app/(auth)/patient-register.tsx` (line 276)
- **Detail:** console.log('OTP Code received:', data.otp);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-124: console statement in production code
- **File:** `app/(auth)/patient-register.tsx` (line 286)
- **Detail:** console.error('Registration failed:', data);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-125: console statement in production code
- **File:** `app/(auth)/patient-register.tsx` (line 290)
- **Detail:** console.error('Registration error:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-126: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/patient-register.tsx` (line 368)
- **Detail:** onPress={() => setShowGenderModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-127: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/patient-register.tsx` (line 382)
- **Detail:** onPress={() => setShowBloodTypeModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-128: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/patient-register.tsx` (line 398)
- **Detail:** onPress={() => setShowCountryModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-129: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/patient-register.tsx` (line 573)
- **Detail:** <TouchableOpacity onPress={() => router.back()}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-130: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/patient-register.tsx` (line 590)
- **Detail:** onPress={() => setShowGenderModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-131: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/patient-register.tsx` (line 598)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-132: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/patient-register.tsx` (line 619)
- **Detail:** onPress={() => setShowBloodTypeModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-133: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/patient-register.tsx` (line 627)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-134: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/patient-register.tsx` (line 648)
- **Detail:** onPress={() => setShowCountryModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-135: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/patient-register.tsx` (line 657)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-136: Touchable element missing accessibilityLabel
- **File:** `app/(auth)/patient-register.tsx` (line 573)
- **Detail:** <TouchableOpacity onPress={() => router.back()}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-137: console statement in production code
- **File:** `app/(auth)/reset-password-otp.tsx` (line 109)
- **Detail:** console.error('Resend error:', err);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-138: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/reset-password-otp.tsx` (line 127)
- **Detail:** onPress={() => router.back()}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-139: Touchable element missing accessibilityLabel
- **File:** `app/(auth)/reset-password-otp.tsx` (line 183)
- **Detail:** <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-140: console statement in production code
- **File:** `app/(auth)/reset-password.tsx` (line 113)
- **Detail:** console.error('Error:', err);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-141: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/reset-password.tsx` (line 133)
- **Detail:** onPress={() => router.back()}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-142: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/reset-password.tsx` (line 173)
- **Detail:** onPress={() => setShowPassword(!showPassword)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-143: Inline arrow function in onPress — causes re-renders
- **File:** `app/(auth)/reset-password.tsx` (line 301)
- **Detail:** onPress={() => setShowConfirmPassword(!showConfirmPassword)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-144: console statement in production code
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 153)
- **Detail:** console.error('Error loading appointments:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-145: console statement in production code
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 298)
- **Detail:** console.error('Error updating appointment status:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-146: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 371)
- **Detail:** onPress={() => setShowFilterModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-147: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 469)
- **Detail:** onPress={() => handleCallPatient(appointment.patientPhone, appointment.patientName)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-148: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 480)
- **Detail:** onPress={() => handleCompleteAppointment(appointment.id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-149: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 489)
- **Detail:** onPress={() => handleCancelAppointment(appointment.id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-150: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 515)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-151: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 526)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-152: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 548)
- **Detail:** onPress={() => setActiveDropdown(activeDropdown === 'date' ? null : 'date')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-153: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 568)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-154: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 587)
- **Detail:** onPress={() => setActiveDropdown(activeDropdown === 'doctor' ? null : 'doctor')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-155: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 600)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-156: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 613)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-157: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 633)
- **Detail:** onPress={() => setActiveDropdown(activeDropdown === 'clinic' ? null : 'clinic')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-158: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 646)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-159: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 659)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-160: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 678)
- **Detail:** onPress={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-161: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 690)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-162: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 703)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-163: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 721)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-164: console statement in production code
- **File:** `app/(doctor-tabs)/dental.tsx` (line 166)
- **Detail:** console.error('No global_id found in session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-165: console statement in production code
- **File:** `app/(doctor-tabs)/dental.tsx` (line 192)
- **Detail:** console.error('Error loading patients:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-166: console statement in production code
- **File:** `app/(doctor-tabs)/dental.tsx` (line 205)
- **Detail:** console.error('No global_id found in session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-167: console statement in production code
- **File:** `app/(doctor-tabs)/dental.tsx` (line 227)
- **Detail:** console.error('Error loading doctors:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-168: console statement in production code
- **File:** `app/(doctor-tabs)/dental.tsx` (line 275)
- **Detail:** console.error('No global_id found in session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-169: console statement in production code
- **File:** `app/(doctor-tabs)/dental.tsx` (line 297)
- **Detail:** console.error('Error loading dental encounters:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-170: console statement in production code
- **File:** `app/(doctor-tabs)/dental.tsx` (line 318)
- **Detail:** console.error('No global_id found in session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-171: console statement in production code
- **File:** `app/(doctor-tabs)/dental.tsx` (line 342)
- **Detail:** console.error('Error loading encounter detail:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-172: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/dental.tsx` (line 390)
- **Detail:** onPress={() => router.push('/(doctor-tabs)')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-173: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/dental.tsx` (line 401)
- **Detail:** onPress={() => setShowDateModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-174: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/dental.tsx` (line 412)
- **Detail:** onPress={() => setShowDoctorModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-175: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/dental.tsx` (line 435)
- **Detail:** onPress={() => selectedDoctor && setShowPatientModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-176: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/dental.tsx` (line 479)
- **Detail:** onPress={() => loadEncounterDetail(encounter.id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-177: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/dental.tsx` (line 540)
- **Detail:** onPress={() => setShowDoctorModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-178: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/dental.tsx` (line 550)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-179: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/dental.tsx` (line 571)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-180: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/dental.tsx` (line 612)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-181: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/dental.tsx` (line 625)
- **Detail:** <TouchableOpacity onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-182: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/dental.tsx` (line 643)
- **Detail:** <TouchableOpacity onPress={() => setPatientSearchQuery('')} style={styles.clearButton}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-183: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/dental.tsx` (line 669)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-184: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/dental.tsx` (line 705)
- **Detail:** <TouchableOpacity onPress={() => setShowDetail(false)}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-185: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/dental.tsx` (line 804)
- **Detail:** onPress={() => setShowDateModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-186: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/dental.tsx` (line 814)
- **Detail:** <TouchableOpacity onPress={() => setShowDateModal(false)}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-187: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/dental.tsx` (line 830)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-188: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/dental.tsx` (line 550)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-189: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/dental.tsx` (line 625)
- **Detail:** <TouchableOpacity onPress={() => {
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-190: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/dental.tsx` (line 643)
- **Detail:** <TouchableOpacity onPress={() => setPatientSearchQuery('')} style={styles.clearButton}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-191: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/dental.tsx` (line 705)
- **Detail:** <TouchableOpacity onPress={() => setShowDetail(false)}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-192: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/dental.tsx` (line 814)
- **Detail:** <TouchableOpacity onPress={() => setShowDateModal(false)}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-193: console statement in production code
- **File:** `app/(doctor-tabs)/finance.tsx` (line 156)
- **Detail:** console.error('Error loading doctors:', err);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-194: console statement in production code
- **File:** `app/(doctor-tabs)/finance.tsx` (line 215)
- **Detail:** console.error('Error loading finance data:', err);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-195: console statement in production code
- **File:** `app/(doctor-tabs)/finance.tsx` (line 248)
- **Detail:** console.error('Error loading invoice detail:', err);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-196: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/finance.tsx` (line 341)
- **Detail:** <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-197: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/finance.tsx` (line 367)
- **Detail:** onPress={() => loadFinanceData()}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-198: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/finance.tsx` (line 429)
- **Detail:** onPress={() => setShowDoctorModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-199: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/finance.tsx` (line 461)
- **Detail:** onPress={() => handleDateFilterChange(filter.key)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-200: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/finance.tsx` (line 498)
- **Detail:** onPress={() => loadInvoiceDetail(tx.id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-201: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/finance.tsx` (line 556)
- **Detail:** onPress={() => setShowDoctorModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-202: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/finance.tsx` (line 565)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-203: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/finance.tsx` (line 577)
- **Detail:** onPress={() => handleDoctorSelect(null)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-204: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/finance.tsx` (line 616)
- **Detail:** onPress={() => handleDoctorSelect(doctor)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-205: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/finance.tsx` (line 674)
- **Detail:** onPress={() => setShowInvoiceModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-206: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/finance.tsx` (line 341)
- **Detail:** <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-207: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/finance.tsx` (line 565)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-208: console statement in production code
- **File:** `app/(doctor-tabs)/index.tsx` (line 136)
- **Detail:** console.error('Error loading clinics:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-209: console statement in production code
- **File:** `app/(doctor-tabs)/index.tsx` (line 211)
- **Detail:** console.error('Error loading dashboard:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-210: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/index.tsx` (line 267)
- **Detail:** onPress={() => router.push('/(doctor-tabs)/notifications')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-211: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/index.tsx` (line 278)
- **Detail:** onPress={() => router.push('/(doctor-tabs)/settings')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-212: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/index.tsx` (line 304)
- **Detail:** <TouchableOpacity style={styles.clinicPill} onPress={() => setShowClinicModal(true)} activeOpacity={
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-213: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/index.tsx` (line 356)
- **Detail:** onPress={() => router.push({ pathname: '/(doctor-tabs)/appointments', params: { filter: 'today', sta
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-214: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/index.tsx` (line 398)
- **Detail:** <TouchableOpacity style={styles.apptDoneBtn} onPress={() => handleUpdateAppointmentStatus(appt.id, '
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-215: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/index.tsx` (line 401)
- **Detail:** <TouchableOpacity style={styles.apptCancelBtn} onPress={() => handleUpdateAppointmentStatus(appt.id,
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-216: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/index.tsx` (line 420)
- **Detail:** onPress={() => router.push(item.route as any)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-217: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/index.tsx` (line 442)
- **Detail:** onPress={() => router.push(item.route as any)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-218: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/index.tsx` (line 459)
- **Detail:** <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowClinicModal(fa
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-219: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/index.tsx` (line 464)
- **Detail:** <TouchableOpacity onPress={() => setShowClinicModal(false)}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-220: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/index.tsx` (line 484)
- **Detail:** onPress={() => handleSwitchClinic(clinic)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-221: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/index.tsx` (line 304)
- **Detail:** <TouchableOpacity style={styles.clinicPill} onPress={() => setShowClinicModal(true)} activeOpacity={
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-222: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/index.tsx` (line 398)
- **Detail:** <TouchableOpacity style={styles.apptDoneBtn} onPress={() => handleUpdateAppointmentStatus(appt.id, '
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-223: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/index.tsx` (line 401)
- **Detail:** <TouchableOpacity style={styles.apptCancelBtn} onPress={() => handleUpdateAppointmentStatus(appt.id,
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-224: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/index.tsx` (line 459)
- **Detail:** <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowClinicModal(fa
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-225: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/index.tsx` (line 464)
- **Detail:** <TouchableOpacity onPress={() => setShowClinicModal(false)}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-226: console statement in production code
- **File:** `app/(doctor-tabs)/medications.tsx` (line 92)
- **Detail:** console.log('Prescriptions state updated:', prescriptions.length);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-227: console statement in production code
- **File:** `app/(doctor-tabs)/medications.tsx` (line 111)
- **Detail:** console.log('=== Doctor/Patient Selection Changed ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-228: console statement in production code
- **File:** `app/(doctor-tabs)/medications.tsx` (line 112)
- **Detail:** console.log('Selected Doctor:', selectedDoctor?.name || 'None');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-229: console statement in production code
- **File:** `app/(doctor-tabs)/medications.tsx` (line 113)
- **Detail:** console.log('Selected Patient:', selectedPatient?.full_name || 'None');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-230: console statement in production code
- **File:** `app/(doctor-tabs)/medications.tsx` (line 120)
- **Detail:** console.log('Clearing prescriptions due to incomplete selection');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-231: console statement in production code
- **File:** `app/(doctor-tabs)/medications.tsx` (line 165)
- **Detail:** console.error('No global_id found in session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-232: console statement in production code
- **File:** `app/(doctor-tabs)/medications.tsx` (line 191)
- **Detail:** console.error('Error loading patients:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-233: console statement in production code
- **File:** `app/(doctor-tabs)/medications.tsx` (line 204)
- **Detail:** console.error('No global_id found in session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-234: console statement in production code
- **File:** `app/(doctor-tabs)/medications.tsx` (line 226)
- **Detail:** console.error('Error loading doctors:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-235: console statement in production code
- **File:** `app/(doctor-tabs)/medications.tsx` (line 240)
- **Detail:** console.error('No global_id found in session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-236: console statement in production code
- **File:** `app/(doctor-tabs)/medications.tsx` (line 262)
- **Detail:** console.error('Error loading prescriptions:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-237: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/medications.tsx` (line 357)
- **Detail:** onPress={() => router.push('/(doctor-tabs)')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-238: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/medications.tsx` (line 368)
- **Detail:** onPress={() => setShowDateModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-239: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/medications.tsx` (line 379)
- **Detail:** onPress={() => setShowDoctorModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-240: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/medications.tsx` (line 402)
- **Detail:** onPress={() => selectedDoctor && setShowPatientModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-241: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/medications.tsx` (line 449)
- **Detail:** onPress={() => togglePrescriptionExpansion(prescription.id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-242: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/medications.tsx` (line 593)
- **Detail:** onPress={() => setShowDoctorModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-243: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/medications.tsx` (line 603)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-244: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/medications.tsx` (line 624)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-245: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/medications.tsx` (line 665)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-246: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/medications.tsx` (line 678)
- **Detail:** <TouchableOpacity onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-247: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/medications.tsx` (line 696)
- **Detail:** <TouchableOpacity onPress={() => setPatientSearchQuery('')} style={styles.clearButton}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-248: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/medications.tsx` (line 722)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-249: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/medications.tsx` (line 757)
- **Detail:** onPress={() => setShowDateModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-250: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/medications.tsx` (line 767)
- **Detail:** <TouchableOpacity onPress={() => setShowDateModal(false)}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-251: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/medications.tsx` (line 783)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-252: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/medications.tsx` (line 603)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-253: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/medications.tsx` (line 678)
- **Detail:** <TouchableOpacity onPress={() => {
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-254: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/medications.tsx` (line 696)
- **Detail:** <TouchableOpacity onPress={() => setPatientSearchQuery('')} style={styles.clearButton}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-255: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/medications.tsx` (line 767)
- **Detail:** <TouchableOpacity onPress={() => setShowDateModal(false)}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-256: console statement in production code
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 78)
- **Detail:** console.log('Session exists:', !!sessionData);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-257: console statement in production code
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 81)
- **Detail:** console.log('No session found');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-258: console statement in production code
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 87)
- **Detail:** console.log('Session token exists:', !!session.access_token);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-259: console statement in production code
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 88)
- **Detail:** console.log('User type:', session.user_type);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-260: console statement in production code
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 89)
- **Detail:** console.log('Fetching doctor notifications...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-261: console statement in production code
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 103)
- **Detail:** console.log('Response status:', response.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-262: console statement in production code
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 105)
- **Detail:** console.log('Result:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-263: console statement in production code
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 108)
- **Detail:** console.log('Notifications loaded:', result.notifications.length);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-264: console statement in production code
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 112)
- **Detail:** console.error('API error:', result.error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-265: console statement in production code
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 116)
- **Detail:** console.error('Error loading notifications:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-266: console statement in production code
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 192)
- **Detail:** console.log('Notification marked as read, refetching notifications');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-267: console statement in production code
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 196)
- **Detail:** console.error('Failed to mark notification as read');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-268: console statement in production code
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 199)
- **Detail:** console.error('Error marking notification as read:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-269: console statement in production code
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 210)
- **Detail:** console.log('Marking all notifications as read...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-270: console statement in production code
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 211)
- **Detail:** console.log('Current notifications before update:', notifications.map(n => ({ id
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-271: console statement in production code
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 226)
- **Detail:** console.log('Mark all as read result:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-272: console statement in production code
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 229)
- **Detail:** console.log('All notifications marked as read in DB, refetching from server');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-273: console statement in production code
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 233)
- **Detail:** console.error('Failed to mark all notifications as read:', result.error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-274: console statement in production code
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 236)
- **Detail:** console.error('Error marking all notifications as read:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-275: console statement in production code
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 270)
- **Detail:** console.log('Authorization processed successfully');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-276: console statement in production code
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 279)
- **Detail:** console.error('Failed to process authorization:', result.error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-277: console statement in production code
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 282)
- **Detail:** console.error('Error processing authorization:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-278: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 337)
- **Detail:** <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-279: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 351)
- **Detail:** <TouchableOpacity style={styles.iconButton} onPress={() => setShowFilterSheet(true)}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-280: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 430)
- **Detail:** onPress={() => handleNotificationPress(notification)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-281: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 459)
- **Detail:** onPress={() => handleAuthorization(notification.id, 'authorize')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-282: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 466)
- **Detail:** onPress={() => handleAuthorization(notification.id, 'deny')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-283: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 337)
- **Detail:** <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-284: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 351)
- **Detail:** <TouchableOpacity style={styles.iconButton} onPress={() => setShowFilterSheet(true)}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-285: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 355)
- **Detail:** <TouchableOpacity style={styles.iconButton} onPress={markAllAsRead}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-286: console statement in production code
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 133)
- **Detail:** console.error('No global_id found in session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-287: console statement in production code
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 159)
- **Detail:** console.error('Error loading patients:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-288: console statement in production code
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 172)
- **Detail:** console.error('No global_id found in session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-289: console statement in production code
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 194)
- **Detail:** console.error('Error loading doctors:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-290: console statement in production code
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 268)
- **Detail:** console.error('No global_id found in session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-291: console statement in production code
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 298)
- **Detail:** console.error('Error loading nutrition data:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-292: console statement in production code
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 325)
- **Detail:** console.error('Error opening document:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-293: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 353)
- **Detail:** onPress={() => router.push('/(doctor-tabs)')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-294: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 364)
- **Detail:** onPress={() => setShowDateModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-295: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 375)
- **Detail:** onPress={() => setShowDoctorModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-296: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 398)
- **Detail:** onPress={() => selectedDoctor && setShowPatientModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-297: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 577)
- **Detail:** onPress={() => openDocument(doc.file_url)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-298: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 614)
- **Detail:** onPress={() => setShowDoctorModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-299: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 624)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-300: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 645)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-301: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 686)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-302: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 699)
- **Detail:** <TouchableOpacity onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-303: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 717)
- **Detail:** <TouchableOpacity onPress={() => setPatientSearchQuery('')} style={styles.clearButton}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-304: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 743)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-305: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 778)
- **Detail:** onPress={() => setShowDateModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-306: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 788)
- **Detail:** <TouchableOpacity onPress={() => setShowDateModal(false)}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-307: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 804)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-308: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 624)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-309: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 699)
- **Detail:** <TouchableOpacity onPress={() => {
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-310: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 717)
- **Detail:** <TouchableOpacity onPress={() => setPatientSearchQuery('')} style={styles.clearButton}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-311: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 788)
- **Detail:** <TouchableOpacity onPress={() => setShowDateModal(false)}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-312: console statement in production code
- **File:** `app/(doctor-tabs)/orders.tsx` (line 139)
- **Detail:** console.error('No global_id found in session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-313: console statement in production code
- **File:** `app/(doctor-tabs)/orders.tsx` (line 165)
- **Detail:** console.error('Error loading patients:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-314: console statement in production code
- **File:** `app/(doctor-tabs)/orders.tsx` (line 178)
- **Detail:** console.error('No global_id found in session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-315: console statement in production code
- **File:** `app/(doctor-tabs)/orders.tsx` (line 200)
- **Detail:** console.error('Error loading doctors:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-316: console statement in production code
- **File:** `app/(doctor-tabs)/orders.tsx` (line 215)
- **Detail:** console.error('No global_id found in session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-317: console statement in production code
- **File:** `app/(doctor-tabs)/orders.tsx` (line 237)
- **Detail:** console.error('Error loading orders:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-318: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/orders.tsx` (line 332)
- **Detail:** onPress={() => router.push('/(doctor-tabs)')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-319: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/orders.tsx` (line 343)
- **Detail:** onPress={() => setShowDateModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-320: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/orders.tsx` (line 354)
- **Detail:** onPress={() => setShowDoctorModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-321: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/orders.tsx` (line 377)
- **Detail:** onPress={() => selectedDoctor && setShowPatientModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-322: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/orders.tsx` (line 424)
- **Detail:** onPress={() => toggleOrderExpansion(order.id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-323: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/orders.tsx` (line 496)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-324: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/orders.tsx` (line 512)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-325: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/orders.tsx` (line 583)
- **Detail:** onPress={() => setShowDoctorModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-326: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/orders.tsx` (line 593)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-327: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/orders.tsx` (line 614)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-328: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/orders.tsx` (line 655)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-329: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/orders.tsx` (line 668)
- **Detail:** <TouchableOpacity onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-330: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/orders.tsx` (line 686)
- **Detail:** <TouchableOpacity onPress={() => setPatientSearchQuery('')} style={styles.clearButton}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-331: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/orders.tsx` (line 712)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-332: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/orders.tsx` (line 747)
- **Detail:** onPress={() => setShowDateModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-333: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/orders.tsx` (line 757)
- **Detail:** <TouchableOpacity onPress={() => setShowDateModal(false)}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-334: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/orders.tsx` (line 773)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-335: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/orders.tsx` (line 593)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-336: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/orders.tsx` (line 668)
- **Detail:** <TouchableOpacity onPress={() => {
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-337: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/orders.tsx` (line 686)
- **Detail:** <TouchableOpacity onPress={() => setPatientSearchQuery('')} style={styles.clearButton}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-338: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/orders.tsx` (line 757)
- **Detail:** <TouchableOpacity onPress={() => setShowDateModal(false)}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-339: console statement in production code
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 165)
- **Detail:** console.error('No global_id found in session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-340: console statement in production code
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 187)
- **Detail:** console.error('Error loading doctors:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-341: console statement in production code
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 216)
- **Detail:** console.error('Error loading questionnaires:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-342: console statement in production code
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 245)
- **Detail:** console.error('Error loading patients:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-343: console statement in production code
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 273)
- **Detail:** console.error('Error loading patient answer:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-344: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 325)
- **Detail:** onPress={() => setShowDoctorModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-345: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 360)
- **Detail:** onPress={() => selectedDoctor && setShowQuestionnaireModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-346: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 396)
- **Detail:** onPress={() => selectedQuestionnaire && setShowPatientModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-347: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 434)
- **Detail:** onPress={() => setShowDoctorModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-348: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 439)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-349: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 466)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-350: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 507)
- **Detail:** onPress={() => setShowQuestionnaireModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-351: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 512)
- **Detail:** <TouchableOpacity onPress={() => setShowQuestionnaireModal(false)}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-352: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 539)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-353: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 601)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-354: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 609)
- **Detail:** <TouchableOpacity onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-355: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 629)
- **Detail:** <TouchableOpacity onPress={() => setPatientSearchText('')}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-356: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 660)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-357: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 693)
- **Detail:** onPress={() => setShowDetailModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-358: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 745)
- **Detail:** onPress={() => setShowDetailModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-359: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 750)
- **Detail:** <TouchableOpacity onPress={() => setShowDetailModal(false)}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-360: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 805)
- **Detail:** onPress={() => setShowDetailModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-361: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 439)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-362: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 512)
- **Detail:** <TouchableOpacity onPress={() => setShowQuestionnaireModal(false)}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-363: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 609)
- **Detail:** <TouchableOpacity onPress={() => {
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-364: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 629)
- **Detail:** <TouchableOpacity onPress={() => setPatientSearchText('')}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-365: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 750)
- **Detail:** <TouchableOpacity onPress={() => setShowDetailModal(false)}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-366: console statement in production code
- **File:** `app/(doctor-tabs)/patient-appointments.tsx` (line 304)
- **Detail:** console.error('Error fetching patient appointments:', e);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-367: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/patient-appointments.tsx` (line 324)
- **Detail:** <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-368: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/patient-appointments.tsx` (line 371)
- **Detail:** onPress={() => toggleGroup(group.doctorId)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-369: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/patient-appointments.tsx` (line 153)
- **Detail:** <TouchableOpacity onPress={toggle} activeOpacity={0.75} style={styles.apptSummaryRow}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-370: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/patient-appointments.tsx` (line 324)
- **Detail:** <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-371: console statement in production code
- **File:** `app/(doctor-tabs)/patients.tsx` (line 107)
- **Detail:** console.error('Error fetching patients:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-372: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/patients.tsx` (line 181)
- **Detail:** <TouchableOpacity onPress={() => setSearchQuery('')}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-373: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/patients.tsx` (line 214)
- **Detail:** onPress={() => openPatientAppointments(patient)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-374: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/patients.tsx` (line 181)
- **Detail:** <TouchableOpacity onPress={() => setSearchQuery('')}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-375: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 116)
- **Detail:** console.error('No global_id found in session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-376: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 138)
- **Detail:** console.error('Error loading doctors:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-377: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 163)
- **Detail:** console.error('Error loading questionnaires:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-378: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 205)
- **Detail:** console.log('handleDeleteQuestionnaire called for:', questionnaire.title);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-379: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 220)
- **Detail:** console.log('Confirmation result:', confirmed);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-380: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 222)
- **Detail:** console.log('Deletion cancelled');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-381: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 225)
- **Detail:** console.log('Proceeding with deletion...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-382: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 229)
- **Detail:** console.log('Deleting questionnaire:', questionnaire.id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-383: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 242)
- **Detail:** console.log('Delete response status:', response.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-384: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 245)
- **Detail:** console.log('Delete response text:', responseText);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-385: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 265)
- **Detail:** console.error('Error deleting questionnaire:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-386: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 279)
- **Detail:** console.log('handleDeleteQuestion called for:', question.question_text);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-387: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 294)
- **Detail:** console.log('Confirmation result:', confirmed);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-388: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 296)
- **Detail:** console.log('Deletion cancelled');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-389: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 299)
- **Detail:** console.log('Proceeding with deletion...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-390: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 303)
- **Detail:** console.log('Deleting question:', question.id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-391: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 316)
- **Detail:** console.log('Delete question response status:', response.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-392: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 319)
- **Detail:** console.log('Delete question response text:', responseText);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-393: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 345)
- **Detail:** console.error('Error deleting question:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-394: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 413)
- **Detail:** console.error('Error loading patients:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-395: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 452)
- **Detail:** console.error('Error assigning questionnaire:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-396: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 494)
- **Detail:** console.error('Error unassigning questionnaire:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-397: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 567)
- **Detail:** console.error('Error updating questionnaire:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-398: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 624)
- **Detail:** console.error('Error adding question:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-399: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 687)
- **Detail:** console.error('Error updating question:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-400: console statement in production code
- **File:** `app/(doctor-tabs)/questions.tsx` (line 737)
- **Detail:** console.error('Error creating questionnaire:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-401: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/questions.tsx` (line 888)
- **Detail:** onPress={() => setFormData({ ...formData, fieldType: type })}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-402: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/questions.tsx` (line 907)
- **Detail:** onPress={() => setFormData({ ...formData, isRequired: !formData.isRequired })}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-403: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/questions.tsx` (line 951)
- **Detail:** onPress={() => setShowDoctorModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-404: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/questions.tsx` (line 988)
- **Detail:** onPress={() => setShowDoctorModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-405: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/questions.tsx` (line 993)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-406: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1013)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-407: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1046)
- **Detail:** onPress={() => setExpandedQuestionnaire(isExpanded ? null : questionnaire.id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-408: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1131)
- **Detail:** onPress={() => openEditQuestion(question)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-409: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1138)
- **Detail:** onPress={() => handleDeleteQuestion(question, questionnaire.id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-410: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1157)
- **Detail:** onPress={() => openAddQuestion(questionnaire.id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-411: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1310)
- **Detail:** onPress={() => setShowAssignModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-412: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1318)
- **Detail:** onPress={() => setShowAssignModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-413: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1347)
- **Detail:** <TouchableOpacity onPress={() => setPatientSearchQuery('')}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-414: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1393)
- **Detail:** onPress={() => handleDirectUnassign(patient.medical_id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-415: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1411)
- **Detail:** onPress={() => handleDirectUnassign(patient.medical_id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-416: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1438)
- **Detail:** onPress={() => handleDirectAssign(patient.medical_id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-417: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1456)
- **Detail:** onPress={() => handleDirectAssign(patient.medical_id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-418: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1472)
- **Detail:** onPress={() => setShowAssignModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-419: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/questions.tsx` (line 770)
- **Detail:** <TouchableOpacity onPress={onClose}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-420: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/questions.tsx` (line 852)
- **Detail:** <TouchableOpacity onPress={onClose}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-421: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/questions.tsx` (line 993)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-422: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1347)
- **Detail:** <TouchableOpacity onPress={() => setPatientSearchQuery('')}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-423: console statement in production code
- **File:** `app/(doctor-tabs)/settings.tsx` (line 58)
- **Detail:** console.log('No session found');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-424: console statement in production code
- **File:** `app/(doctor-tabs)/settings.tsx` (line 76)
- **Detail:** console.log('Settings loaded:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-425: console statement in production code
- **File:** `app/(doctor-tabs)/settings.tsx` (line 84)
- **Detail:** console.error('Error loading settings:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-426: console statement in production code
- **File:** `app/(doctor-tabs)/settings.tsx` (line 111)
- **Detail:** console.error('Error loading help content:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-427: console statement in production code
- **File:** `app/(doctor-tabs)/settings.tsx` (line 151)
- **Detail:** console.log('Notification toggle result:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-428: console statement in production code
- **File:** `app/(doctor-tabs)/settings.tsx` (line 161)
- **Detail:** console.error('Error toggling notifications:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-429: console statement in production code
- **File:** `app/(doctor-tabs)/settings.tsx` (line 228)
- **Detail:** console.log('Biometric toggle result:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-430: console statement in production code
- **File:** `app/(doctor-tabs)/settings.tsx` (line 244)
- **Detail:** console.error('Error toggling biometric:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-431: console statement in production code
- **File:** `app/(doctor-tabs)/settings.tsx` (line 256)
- **Detail:** console.error('Error toggling dark mode:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-432: console statement in production code
- **File:** `app/(doctor-tabs)/settings.tsx` (line 272)
- **Detail:** console.error('Error logging out:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-433: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/settings.tsx` (line 395)
- **Detail:** onPress={() => showHelpContentModal('help_center')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-434: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/settings.tsx` (line 410)
- **Detail:** onPress={() => showHelpContentModal('terms_privacy')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-435: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/settings.tsx` (line 452)
- **Detail:** onPress={() => setShowHelpModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-436: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 195)
- **Detail:** console.log('[Modal Debug] Block Modal State:', showBlockModal);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-437: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 199)
- **Detail:** console.log('[Modal Debug] Exception Modal State:', showExceptionModal);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-438: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 204)
- **Detail:** console.error('No session or global_id found');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-439: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 212)
- **Detail:** console.log('Fetching doctors for global_id:', session.user.global_id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-440: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 216)
- **Detail:** console.log('Supabase URL:', supabaseUrl);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-441: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 234)
- **Detail:** console.log('Time management API response:', JSON.stringify(result, null, 2));
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-442: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 235)
- **Detail:** console.log('Response status:', response.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-443: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 239)
- **Detail:** console.log('Doctors list:', doctorsList);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-444: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 245)
- **Detail:** console.log('No doctors found in response');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-445: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 249)
- **Detail:** console.error('API error:', result.error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-446: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 253)
- **Detail:** console.error('Error fetching doctors:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-447: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 297)
- **Detail:** console.error('Error fetching doctor clinics:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-448: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 352)
- **Detail:** console.error('Error fetching time management data:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-449: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 408)
- **Detail:** console.error('Error creating block:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-450: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 466)
- **Detail:** console.error('Error updating block:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-451: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 502)
- **Detail:** console.error('Error deleting block:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-452: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 667)
- **Detail:** console.error('Error creating exception:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-453: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 724)
- **Detail:** console.error('Error updating exception:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-454: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 760)
- **Detail:** console.error('Error deleting exception:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-455: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 868)
- **Detail:** console.log('Saving schedule with data:', requestData);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-456: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 869)
- **Detail:** console.log('Selected doctor:', selectedDoctor);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-457: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 870)
- **Detail:** console.log('Selected clinic:', selectedClinic);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-458: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 885)
- **Detail:** console.log('Schedule save response:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-459: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 894)
- **Detail:** console.error('Schedule save error:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-460: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 898)
- **Detail:** console.error('Error saving schedule:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-461: console statement in production code
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 935)
- **Detail:** console.error('Error deleting schedule:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-462: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 991)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-463: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1007)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-464: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1113)
- **Detail:** onPress={() => handleToggleSchedule(day, daySchedule || null)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-465: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1125)
- **Detail:** onPress={() => handleEditSchedule(daySchedule)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-466: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1170)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-467: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1229)
- **Detail:** onPress={() => openEditExceptionModal(exception)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-468: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1235)
- **Detail:** onPress={() => handleDeleteException(exception.id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-469: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1259)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-470: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1294)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-471: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1361)
- **Detail:** onPress={() => openEditModal(block)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-472: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1367)
- **Detail:** onPress={() => handleDeleteBlock(block.id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-473: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1395)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-474: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1516)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-475: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1575)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-476: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1613)
- **Detail:** <TouchableWithoutFeedback onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-477: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1646)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-478: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1679)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-479: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1715)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-480: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1748)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-481: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1773)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-482: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1811)
- **Detail:** <TouchableWithoutFeedback onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-483: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1850)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-484: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1894)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-485: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1928)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-486: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1966)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-487: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2000)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-488: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2038)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-489: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2080)
- **Detail:** <TouchableWithoutFeedback onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-490: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2115)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-491: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2136)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-492: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2176)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-493: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2210)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-494: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2248)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-495: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2282)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-496: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2321)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-497: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2368)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-498: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2380)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-499: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2399)
- **Detail:** onPress={() => handleTimeSelect(slot.value)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-500: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2453)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-501: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2491)
- **Detail:** onPress={() => router.back()}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-502: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2505)
- **Detail:** onPress={() => setShowDoctorPicker(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-503: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2519)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-504: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2540)
- **Detail:** onPress={() => setActiveTab('schedule')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-505: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2550)
- **Detail:** onPress={() => setActiveTab('exceptions')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-506: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2560)
- **Detail:** onPress={() => setActiveTab('blocks')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-507: console statement in production code
- **File:** `app/(doctor-tabs)/vision.tsx` (line 173)
- **Detail:** console.error('No global_id found in session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-508: console statement in production code
- **File:** `app/(doctor-tabs)/vision.tsx` (line 199)
- **Detail:** console.error('Error loading patients:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-509: console statement in production code
- **File:** `app/(doctor-tabs)/vision.tsx` (line 212)
- **Detail:** console.error('No global_id found in session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-510: console statement in production code
- **File:** `app/(doctor-tabs)/vision.tsx` (line 234)
- **Detail:** console.error('Error loading doctors:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-511: console statement in production code
- **File:** `app/(doctor-tabs)/vision.tsx` (line 282)
- **Detail:** console.error('No global_id found in session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-512: console statement in production code
- **File:** `app/(doctor-tabs)/vision.tsx` (line 308)
- **Detail:** console.error('Error loading vision tests:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-513: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/vision.tsx` (line 362)
- **Detail:** onPress={() => router.push('/(doctor-tabs)')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-514: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/vision.tsx` (line 373)
- **Detail:** onPress={() => setShowDateModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-515: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/vision.tsx` (line 384)
- **Detail:** onPress={() => setShowDoctorModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-516: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/vision.tsx` (line 407)
- **Detail:** onPress={() => selectedDoctor && setShowPatientModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-517: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/vision.tsx` (line 531)
- **Detail:** onPress={() => toggleTestExpansion(test.id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-518: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/vision.tsx` (line 631)
- **Detail:** onPress={() => openDocument(doc.url)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-519: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/vision.tsx` (line 701)
- **Detail:** onPress={() => setShowDoctorModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-520: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/vision.tsx` (line 711)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-521: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/vision.tsx` (line 732)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-522: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/vision.tsx` (line 773)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-523: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/vision.tsx` (line 786)
- **Detail:** <TouchableOpacity onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-524: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/vision.tsx` (line 804)
- **Detail:** <TouchableOpacity onPress={() => setPatientSearchQuery('')} style={styles.clearButton}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-525: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/vision.tsx` (line 830)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-526: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/vision.tsx` (line 865)
- **Detail:** onPress={() => setShowDateModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-527: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/vision.tsx` (line 875)
- **Detail:** <TouchableOpacity onPress={() => setShowDateModal(false)}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-528: Inline arrow function in onPress — causes re-renders
- **File:** `app/(doctor-tabs)/vision.tsx` (line 891)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-529: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/vision.tsx` (line 711)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-530: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/vision.tsx` (line 786)
- **Detail:** <TouchableOpacity onPress={() => {
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-531: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/vision.tsx` (line 804)
- **Detail:** <TouchableOpacity onPress={() => setPatientSearchQuery('')} style={styles.clearButton}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-532: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/vision.tsx` (line 875)
- **Detail:** <TouchableOpacity onPress={() => setShowDateModal(false)}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-533: console statement in production code
- **File:** `app/(tabs)/appointments.tsx` (line 119)
- **Detail:** console.error('Error loading appointments:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-534: console statement in production code
- **File:** `app/(tabs)/appointments.tsx` (line 153)
- **Detail:** console.error('Error loading doctors:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-535: console statement in production code
- **File:** `app/(tabs)/appointments.tsx` (line 301)
- **Detail:** console.error('Error updating appointment status:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-536: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/appointments.tsx` (line 357)
- **Detail:** onPress={() => setShowFilterModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-537: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/appointments.tsx` (line 465)
- **Detail:** onPress={() => router.push('/book-appointment')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-538: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/appointments.tsx` (line 491)
- **Detail:** onPress={() => { setActiveDropdown(null); setShowFilterModal(false); setDoctorSearch(''); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-539: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/appointments.tsx` (line 498)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-540: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/appointments.tsx` (line 515)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-541: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/appointments.tsx` (line 555)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-542: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/appointments.tsx` (line 572)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-543: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/appointments.tsx` (line 597)
- **Detail:** onPress={() => setActiveDropdown(activeDropdown === 'date' ? null : 'date')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-544: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/appointments.tsx` (line 624)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-545: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/appointments.tsx` (line 646)
- **Detail:** onPress={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-546: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/appointments.tsx` (line 672)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-547: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/appointments.tsx` (line 692)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-548: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/appointments.tsx` (line 493)
- **Detail:** <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-549: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/appointments.tsx` (line 555)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-550: console statement in production code
- **File:** `app/(tabs)/dental.tsx` (line 100)
- **Detail:** console.error('Error loading user data:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-551: console statement in production code
- **File:** `app/(tabs)/dental.tsx` (line 154)
- **Detail:** console.error('Error loading dental records:', err);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-552: console statement in production code
- **File:** `app/(tabs)/dental.tsx` (line 196)
- **Detail:** console.error('Error loading encounter detail:', err);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-553: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/dental.tsx` (line 322)
- **Detail:** onPress={() => setShowFilterModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-554: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/dental.tsx` (line 356)
- **Detail:** onPress={() => loadEncounterDetail(encounter.id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-555: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/dental.tsx` (line 398)
- **Detail:** onPress={() => { setShowFilterModal(false); setOpenDropdown(null); setDoctorSearch(''); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-556: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/dental.tsx` (line 405)
- **Detail:** onPress={() => { setSelectedDoctor(''); setSelectedDateFilter('all'); setOpenDropdown(null); setDoct
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-557: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/dental.tsx` (line 416)
- **Detail:** onPress={() => { if (openDropdown === 'doctor') { setOpenDropdown(null); setDoctorSearch(''); } else
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-558: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/dental.tsx` (line 439)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-559: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/dental.tsx` (line 452)
- **Detail:** onPress={() => { setSelectedDoctor(item.id); setOpenDropdown(null); setDoctorSearch(''); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-560: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/dental.tsx` (line 469)
- **Detail:** onPress={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-561: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/dental.tsx` (line 487)
- **Detail:** onPress={() => { setSelectedDateFilter(option.value as DateFilter); setOpenDropdown(null); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-562: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/dental.tsx` (line 500)
- **Detail:** onPress={() => { setOpenDropdown(null); setShowFilterModal(false); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-563: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/dental.tsx` (line 520)
- **Detail:** <TouchableOpacity onPress={() => setShowDetail(false)}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-564: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/dental.tsx` (line 304)
- **Detail:** <TouchableOpacity style={styles.retryButton} onPress={loadEncounters}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-565: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/dental.tsx` (line 400)
- **Detail:** <TouchableOpacity activeOpacity={1} style={styles.filterModalContent}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-566: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/dental.tsx` (line 439)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-567: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/dental.tsx` (line 520)
- **Detail:** <TouchableOpacity onPress={() => setShowDetail(false)}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-568: console statement in production code
- **File:** `app/(tabs)/doctor-responses.tsx` (line 112)
- **Detail:** console.error('Error loading questionnaires:', err);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-569: console statement in production code
- **File:** `app/(tabs)/doctor-responses.tsx` (line 182)
- **Detail:** console.error('Error submitting questionnaire:', err);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-570: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/doctor-responses.tsx` (line 340)
- **Detail:** <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-571: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/doctor-responses.tsx` (line 344)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorFilter(true)} style={styles.filterButton}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-572: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/doctor-responses.tsx` (line 353)
- **Detail:** <TouchableOpacity onPress={() => setSelectedDoctor('all')} style={styles.clearFilterButton}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-573: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/doctor-responses.tsx` (line 362)
- **Detail:** onPress={() => setActiveTab('unanswered')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-574: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/doctor-responses.tsx` (line 370)
- **Detail:** onPress={() => setActiveTab('answered')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-575: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/doctor-responses.tsx` (line 396)
- **Detail:** <TouchableOpacity style={styles.retryButton} onPress={() => loadQuestionnaires()}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-576: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/doctor-responses.tsx` (line 437)
- **Detail:** onPress={() => toggleDoctorExpansion(group.doctorName)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-577: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/doctor-responses.tsx` (line 490)
- **Detail:** onPress={() => setExpandedQuestionnaire(
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-578: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/doctor-responses.tsx` (line 516)
- **Detail:** onPress={() => submitQuestionnaire(item.id, item.questions)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-579: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/doctor-responses.tsx` (line 568)
- **Detail:** onPress={() => { setShowDoctorFilter(false); setDoctorSearch(''); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-580: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/doctor-responses.tsx` (line 574)
- **Detail:** <TouchableOpacity onPress={() => { setSelectedDoctor('all'); setShowDoctorFilter(false); setDoctorSe
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-581: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/doctor-responses.tsx` (line 597)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-582: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/doctor-responses.tsx` (line 611)
- **Detail:** onPress={() => { setSelectedDoctor(item.name); setShowDoctorFilter(false); setDoctorSearch(''); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-583: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/doctor-responses.tsx` (line 340)
- **Detail:** <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-584: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/doctor-responses.tsx` (line 344)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorFilter(true)} style={styles.filterButton}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-585: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/doctor-responses.tsx` (line 353)
- **Detail:** <TouchableOpacity onPress={() => setSelectedDoctor('all')} style={styles.clearFilterButton}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-586: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/doctor-responses.tsx` (line 396)
- **Detail:** <TouchableOpacity style={styles.retryButton} onPress={() => loadQuestionnaires()}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-587: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/doctor-responses.tsx` (line 570)
- **Detail:** <TouchableOpacity activeOpacity={1} style={styles.filterModalContent}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-588: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/doctor-responses.tsx` (line 574)
- **Detail:** <TouchableOpacity onPress={() => { setSelectedDoctor('all'); setShowDoctorFilter(false); setDoctorSe
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-589: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/doctor-responses.tsx` (line 597)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-590: console statement in production code
- **File:** `app/(tabs)/doctors.tsx` (line 87)
- **Detail:** console.error('Error loading doctors:', err);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-591: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/doctors.tsx` (line 199)
- **Detail:** <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-592: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/doctors.tsx` (line 204)
- **Detail:** <TouchableOpacity onPress={() => setShowDropdown(true)} style={styles.filterButton}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-593: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/doctors.tsx` (line 221)
- **Detail:** onPress={() => setShowDropdown(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-594: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/doctors.tsx` (line 227)
- **Detail:** onPress={() => handleSelectSpecialization('all')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-595: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/doctors.tsx` (line 237)
- **Detail:** onPress={() => handleSelectSpecialization(spec.id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-596: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/doctors.tsx` (line 306)
- **Detail:** onPress={() => toggleDoctor(doctor.id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-597: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/doctors.tsx` (line 341)
- **Detail:** onPress={() => handlePhoneCall(doctor.phone!)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-598: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/doctors.tsx` (line 350)
- **Detail:** onPress={() => handleWhatsApp(doctor.whatsapp_number!)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-599: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/doctors.tsx` (line 374)
- **Detail:** onPress={() => handlePhoneCall(clinic.phone!)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-600: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/doctors.tsx` (line 199)
- **Detail:** <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-601: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/doctors.tsx` (line 204)
- **Detail:** <TouchableOpacity onPress={() => setShowDropdown(true)} style={styles.filterButton}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-602: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/doctors.tsx` (line 267)
- **Detail:** <TouchableOpacity style={styles.retryButton} onPress={loadDoctors}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-603: console statement in production code
- **File:** `app/(tabs)/index.tsx` (line 225)
- **Detail:** console.error('Error loading user data:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-604: console statement in production code
- **File:** `app/(tabs)/index.tsx` (line 261)
- **Detail:** console.error('Error loading dashboard stats:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-605: console statement in production code
- **File:** `app/(tabs)/index.tsx` (line 289)
- **Detail:** console.error('Error loading notifications count:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-606: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/index.tsx` (line 357)
- **Detail:** onPress={() => router.push('/notifications' as any)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-607: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/index.tsx` (line 371)
- **Detail:** onPress={() => router.push('/(tabs)/settings')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-608: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/index.tsx` (line 407)
- **Detail:** onPress={() => router.push('/edit-profile' as any)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-609: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/index.tsx` (line 451)
- **Detail:** <TouchableOpacity onPress={() => router.push('/(tabs)/appointments')}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-610: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/index.tsx` (line 485)
- **Detail:** onPress={() => router.push('/book-appointment' as any)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-611: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/index.tsx` (line 500)
- **Detail:** onPress={() => handleCardPress(service.id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-612: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/index.tsx` (line 516)
- **Detail:** onPress={() => handleCardPress(service.id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-613: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/index.tsx` (line 451)
- **Detail:** <TouchableOpacity onPress={() => router.push('/(tabs)/appointments')}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-614: console statement in production code
- **File:** `app/(tabs)/invoices.tsx` (line 151)
- **Detail:** console.error('Error loading invoices:', err);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-615: console statement in production code
- **File:** `app/(tabs)/invoices.tsx` (line 206)
- **Detail:** console.error('Error loading invoice details:', err);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-616: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/invoices.tsx` (line 313)
- **Detail:** onPress={() => router.back()}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-617: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/invoices.tsx` (line 334)
- **Detail:** onPress={() => router.back()}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-618: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/invoices.tsx` (line 357)
- **Detail:** onPress={() => router.back()}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-619: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/invoices.tsx` (line 384)
- **Detail:** onPress={() => setShowFilterModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-620: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/invoices.tsx` (line 414)
- **Detail:** onPress={() => loadInvoiceDetail(invoice.id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-621: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/invoices.tsx` (line 483)
- **Detail:** onPress={() => { setShowFilterModal(false); setOpenDropdown(null); setDoctorSearch(''); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-622: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/invoices.tsx` (line 490)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-623: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/invoices.tsx` (line 507)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-624: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/invoices.tsx` (line 533)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-625: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/invoices.tsx` (line 546)
- **Detail:** onPress={() => { setSelectedDoctor(item.id); setOpenDropdown(null); setDoctorSearch(''); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-626: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/invoices.tsx` (line 563)
- **Detail:** onPress={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-627: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/invoices.tsx` (line 581)
- **Detail:** onPress={() => { setSelectedDateFilter(option.value as DateFilter); setOpenDropdown(null); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-628: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/invoices.tsx` (line 596)
- **Detail:** onPress={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-629: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/invoices.tsx` (line 613)
- **Detail:** onPress={() => { setSelectedStatus(option.value as StatusFilter); setOpenDropdown(null); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-630: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/invoices.tsx` (line 626)
- **Detail:** onPress={() => { setOpenDropdown(null); setShowFilterModal(false); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-631: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/invoices.tsx` (line 642)
- **Detail:** onPress={() => setShowDetail(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-632: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/invoices.tsx` (line 649)
- **Detail:** onPress={() => setShowDetail(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-633: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/invoices.tsx` (line 344)
- **Detail:** <TouchableOpacity style={styles.retryButton} onPress={loadInvoices}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-634: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/invoices.tsx` (line 485)
- **Detail:** <TouchableOpacity activeOpacity={1} style={styles.filterModalContent}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-635: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/invoices.tsx` (line 533)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-636: console statement in production code
- **File:** `app/(tabs)/nutrition.tsx` (line 116)
- **Detail:** console.error(err);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-637: console statement in production code
- **File:** `app/(tabs)/nutrition.tsx` (line 160)
- **Detail:** console.error('Error opening document:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-638: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/nutrition.tsx` (line 235)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-639: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/nutrition.tsx` (line 258)
- **Detail:** onPress={() => { setShowFilters(false); setOpenDropdown(null); setDoctorSearch(''); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-640: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/nutrition.tsx` (line 273)
- **Detail:** onPress={() => { if (openDropdown === 'doctor') { setOpenDropdown(null); setDoctorSearch(''); } else
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-641: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/nutrition.tsx` (line 297)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-642: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/nutrition.tsx` (line 310)
- **Detail:** onPress={() => { setTempSelectedDoctorId(item.id || null); setOpenDropdown(null); setDoctorSearch(''
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-643: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/nutrition.tsx` (line 327)
- **Detail:** onPress={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-644: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/nutrition.tsx` (line 345)
- **Detail:** onPress={() => { setTempSelectedDateFilter(option.value as DateFilter); setOpenDropdown(null); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-645: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/nutrition.tsx` (line 358)
- **Detail:** onPress={() => { setOpenDropdown(null); setDoctorSearch(''); applyFilters(); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-646: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/nutrition.tsx` (line 517)
- **Detail:** onPress={() => openDocument(doc)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-647: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/nutrition.tsx` (line 260)
- **Detail:** <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-648: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/nutrition.tsx` (line 264)
- **Detail:** <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-649: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/nutrition.tsx` (line 297)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-650: console statement in production code
- **File:** `app/(tabs)/orders.tsx` (line 79)
- **Detail:** console.log('Session data:', sessionData);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-651: console statement in production code
- **File:** `app/(tabs)/orders.tsx` (line 83)
- **Detail:** console.log('Parsed session:', session);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-652: console statement in production code
- **File:** `app/(tabs)/orders.tsx` (line 86)
- **Detail:** console.log('Medical ID found:', session.patient.medical_id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-653: console statement in production code
- **File:** `app/(tabs)/orders.tsx` (line 89)
- **Detail:** console.error('No medical_id in session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-654: console statement in production code
- **File:** `app/(tabs)/orders.tsx` (line 92)
- **Detail:** console.error('No session found');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-655: console statement in production code
- **File:** `app/(tabs)/orders.tsx` (line 95)
- **Detail:** console.error('Error loading user data:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-656: console statement in production code
- **File:** `app/(tabs)/orders.tsx` (line 106)
- **Detail:** console.log('Fetching all data for medical_id:', medicalId);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-657: console statement in production code
- **File:** `app/(tabs)/orders.tsx` (line 121)
- **Detail:** console.log('Orders API response:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-658: console statement in production code
- **File:** `app/(tabs)/orders.tsx` (line 140)
- **Detail:** console.log('Formatted orders:', formattedOrders);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-659: console statement in production code
- **File:** `app/(tabs)/orders.tsx` (line 143)
- **Detail:** console.error('Error fetching data:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-660: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/orders.tsx` (line 257)
- **Detail:** onPress={() => router.back()}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-661: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/orders.tsx` (line 265)
- **Detail:** onPress={() => setShowFilterModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-662: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/orders.tsx` (line 368)
- **Detail:** onPress={() => openAttachment(file.file_path)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-663: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/orders.tsx` (line 381)
- **Detail:** onPress={() => openAttachment(order.file_path!)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-664: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/orders.tsx` (line 407)
- **Detail:** onPress={() => { setShowFilterModal(false); setOpenDropdown(null); setDoctorSearch(''); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-665: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/orders.tsx` (line 414)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-666: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/orders.tsx` (line 430)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-667: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/orders.tsx` (line 465)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-668: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/orders.tsx` (line 482)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-669: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/orders.tsx` (line 512)
- **Detail:** onPress={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-670: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/orders.tsx` (line 538)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-671: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/orders.tsx` (line 558)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-672: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/orders.tsx` (line 409)
- **Detail:** <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-673: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/orders.tsx` (line 465)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-674: console statement in production code
- **File:** `app/(tabs)/packages.tsx` (line 68)
- **Detail:** console.error('Error loading packages:', err);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-675: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/packages.tsx` (line 127)
- **Detail:** <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-676: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/packages.tsx` (line 132)
- **Detail:** onPress={() => setShowFilterMenu(!showFilterMenu)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-677: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/packages.tsx` (line 144)
- **Detail:** <TouchableOpacity onPress={() => setShowFilterMenu(false)}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-678: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/packages.tsx` (line 151)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-679: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/packages.tsx` (line 164)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-680: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/packages.tsx` (line 214)
- **Detail:** onPress={() => router.push(`/package-detail?id=${pkg.patient_package_id}`)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-681: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/packages.tsx` (line 127)
- **Detail:** <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-682: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/packages.tsx` (line 144)
- **Detail:** <TouchableOpacity onPress={() => setShowFilterMenu(false)}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-683: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/packages.tsx` (line 185)
- **Detail:** <TouchableOpacity style={styles.retryButton} onPress={loadPackages}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-684: console statement in production code
- **File:** `app/(tabs)/prescriptions.tsx` (line 103)
- **Detail:** console.log('Session data:', sessionData);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-685: console statement in production code
- **File:** `app/(tabs)/prescriptions.tsx` (line 107)
- **Detail:** console.log('Parsed session:', session);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-686: console statement in production code
- **File:** `app/(tabs)/prescriptions.tsx` (line 110)
- **Detail:** console.log('Medical ID found:', session.patient.medical_id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-687: console statement in production code
- **File:** `app/(tabs)/prescriptions.tsx` (line 113)
- **Detail:** console.error('No medical_id in session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-688: console statement in production code
- **File:** `app/(tabs)/prescriptions.tsx` (line 116)
- **Detail:** console.error('No session found');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-689: console statement in production code
- **File:** `app/(tabs)/prescriptions.tsx` (line 119)
- **Detail:** console.error('Error loading user data:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-690: console statement in production code
- **File:** `app/(tabs)/prescriptions.tsx` (line 130)
- **Detail:** console.log('Fetching prescriptions for medical_id:', medicalId);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-691: console statement in production code
- **File:** `app/(tabs)/prescriptions.tsx` (line 146)
- **Detail:** console.log('Doctors response:', doctorsData);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-692: console statement in production code
- **File:** `app/(tabs)/prescriptions.tsx` (line 170)
- **Detail:** console.log('Prescriptions response:', prescriptionsData);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-693: console statement in production code
- **File:** `app/(tabs)/prescriptions.tsx` (line 177)
- **Detail:** console.error('Error fetching data:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-694: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/prescriptions.tsx` (line 298)
- **Detail:** onPress={() => router.back()}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-695: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/prescriptions.tsx` (line 306)
- **Detail:** onPress={() => setShowFilterModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-696: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/prescriptions.tsx` (line 396)
- **Detail:** onPress={() => togglePrescriptionCollapse(prescription.id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-697: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/prescriptions.tsx` (line 485)
- **Detail:** onPress={() => { setShowFilterModal(false); setOpenDropdown(null); setDoctorSearch(''); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-698: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/prescriptions.tsx` (line 492)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-699: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/prescriptions.tsx` (line 508)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-700: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/prescriptions.tsx` (line 543)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-701: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/prescriptions.tsx` (line 560)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-702: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/prescriptions.tsx` (line 590)
- **Detail:** onPress={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-703: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/prescriptions.tsx` (line 616)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-704: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/prescriptions.tsx` (line 636)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-705: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/prescriptions.tsx` (line 487)
- **Detail:** <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-706: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/prescriptions.tsx` (line 543)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-707: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 140)
- **Detail:** console.error('Error loading profile:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-708: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 150)
- **Detail:** console.log('Session exists:', !!session);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-709: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 151)
- **Detail:** console.log('Access token exists:', !!session?.access_token);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-710: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 158)
- **Detail:** console.log('Fetching fresh profile...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-711: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 171)
- **Detail:** console.log('Response status:', response.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-712: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 174)
- **Detail:** console.log('Response data:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-713: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 226)
- **Detail:** console.error('API Error:', errorMessage, errorDetails);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-714: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 230)
- **Detail:** console.error('Error fetching fresh profile:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-715: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 258)
- **Detail:** console.log('[Camera] Checking camera permissions...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-716: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 260)
- **Detail:** console.log('[Camera] Existing permission status:', existingStatus);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-717: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 265)
- **Detail:** console.log('[Camera] Requesting camera permissions...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-718: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 268)
- **Detail:** console.log('[Camera] New permission status:', finalStatus);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-719: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 276)
- **Detail:** console.log('[Camera] Launching camera...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-720: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 284)
- **Detail:** console.log('[Camera] Result:', {
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-721: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 291)
- **Detail:** console.log('[Camera] Image selected:', result.assets[0].uri);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-722: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 295)
- **Detail:** console.log('[Camera] No image selected or cancelled');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-723: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 298)
- **Detail:** console.error('[Camera] Error:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-724: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 305)
- **Detail:** console.log('[Gallery] Checking media library permissions...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-725: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 307)
- **Detail:** console.log('[Gallery] Existing permission status:', existingStatus);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-726: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 312)
- **Detail:** console.log('[Gallery] Requesting media library permissions...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-727: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 315)
- **Detail:** console.log('[Gallery] New permission status:', finalStatus);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-728: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 323)
- **Detail:** console.log('[Gallery] Launching image library...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-729: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 332)
- **Detail:** console.log('[Gallery] Result:', {
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-730: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 339)
- **Detail:** console.log('[Gallery] Image selected:', result.assets[0].uri);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-731: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 343)
- **Detail:** console.log('[Gallery] No image selected or cancelled');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-732: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 346)
- **Detail:** console.error('[Gallery] Error:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-733: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 379)
- **Detail:** console.error('Upload failed:', errorText);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-734: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 385)
- **Detail:** console.error('Error uploading image:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-735: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 489)
- **Detail:** console.error('Error saving profile:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-736: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 522)
- **Detail:** console.log('Starting logout...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-737: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 524)
- **Detail:** console.log('SignOut completed');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-738: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 527)
- **Detail:** console.log('Forcing complete page reload on web...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-739: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 533)
- **Detail:** console.error('Error during logout:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-740: console statement in production code
- **File:** `app/(tabs)/profile.tsx` (line 535)
- **Detail:** console.warn('Logout error, forcing page reload anyway...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-741: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/profile.tsx` (line 714)
- **Detail:** onPress={() => setShowGenderModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-742: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/profile.tsx` (line 728)
- **Detail:** onPress={() => setShowBloodTypeModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-743: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/profile.tsx` (line 786)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-744: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/profile.tsx` (line 796)
- **Detail:** onPress={() => setShowGenderModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-745: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/profile.tsx` (line 812)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-746: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/profile.tsx` (line 822)
- **Detail:** onPress={() => setShowBloodTypeModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-747: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/profile.tsx` (line 608)
- **Detail:** <TouchableOpacity style={styles.imageButton} onPress={handleTakePhoto}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-748: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/profile.tsx` (line 613)
- **Detail:** <TouchableOpacity style={styles.imageButton} onPress={handleChooseFromGallery}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-749: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/profile.tsx` (line 712)
- **Detail:** <TouchableOpacity
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-750: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/profile.tsx` (line 726)
- **Detail:** <TouchableOpacity
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-751: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/profile.tsx` (line 756)
- **Detail:** <TouchableOpacity
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-752: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/profile.tsx` (line 767)
- **Detail:** <TouchableOpacity
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-753: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/profile.tsx` (line 783)
- **Detail:** <TouchableOpacity
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-754: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/profile.tsx` (line 794)
- **Detail:** <TouchableOpacity
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-755: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/profile.tsx` (line 809)
- **Detail:** <TouchableOpacity
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-756: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/profile.tsx` (line 820)
- **Detail:** <TouchableOpacity
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-757: console statement in production code
- **File:** `app/(tabs)/settings.tsx` (line 87)
- **Detail:** console.error('Error checking biometric availability:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-758: console statement in production code
- **File:** `app/(tabs)/settings.tsx` (line 123)
- **Detail:** console.error('Error loading settings:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-759: console statement in production code
- **File:** `app/(tabs)/settings.tsx` (line 150)
- **Detail:** console.error('Error loading help content:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-760: console statement in production code
- **File:** `app/(tabs)/settings.tsx` (line 183)
- **Detail:** console.error('Error toggling notifications:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-761: console statement in production code
- **File:** `app/(tabs)/settings.tsx` (line 243)
- **Detail:** console.error('Error toggling biometric:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-762: console statement in production code
- **File:** `app/(tabs)/settings.tsx` (line 253)
- **Detail:** console.error('Error toggling dark mode:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-763: console statement in production code
- **File:** `app/(tabs)/settings.tsx` (line 316)
- **Detail:** console.error('Error changing password:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-764: console statement in production code
- **File:** `app/(tabs)/settings.tsx` (line 334)
- **Detail:** console.error('Error logging out:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-765: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/settings.tsx` (line 398)
- **Detail:** onPress={() => router.push('/edit-profile')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-766: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/settings.tsx` (line 457)
- **Detail:** onPress={() => setShowPasswordModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-767: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/settings.tsx` (line 496)
- **Detail:** onPress={() => router.push('/payment-methods')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-768: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/settings.tsx` (line 516)
- **Detail:** onPress={() => showHelpContentModal('help_center')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-769: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/settings.tsx` (line 531)
- **Detail:** onPress={() => showHelpContentModal('terms_privacy')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-770: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/settings.tsx` (line 570)
- **Detail:** <TouchableWithoutFeedback onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-771: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/settings.tsx` (line 584)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-772: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/settings.tsx` (line 652)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-773: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/settings.tsx` (line 694)
- **Detail:** onPress={() => setShowHelpModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-774: console statement in production code
- **File:** `app/(tabs)/statement.tsx` (line 120)
- **Detail:** console.error('Error loading statement:', err);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-775: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/statement.tsx` (line 153)
- **Detail:** onPress={() => router.back()}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-776: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/statement.tsx` (line 174)
- **Detail:** onPress={() => router.back()}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-777: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/statement.tsx` (line 203)
- **Detail:** onPress={() => router.back()}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-778: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/statement.tsx` (line 280)
- **Detail:** onPress={() => router.push('/(tabs)/invoices')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-779: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/statement.tsx` (line 385)
- **Detail:** onPress={() => { setShowFilterModal(false); setOpenDropdown(null); setDoctorSearch(''); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-780: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/statement.tsx` (line 392)
- **Detail:** onPress={() => { clearFilters(); setOpenDropdown(null); setDoctorSearch(''); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-781: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/statement.tsx` (line 403)
- **Detail:** onPress={() => { if (openDropdown === 'doctor') { setOpenDropdown(null); setDoctorSearch(''); } else
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-782: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/statement.tsx` (line 426)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-783: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/statement.tsx` (line 439)
- **Detail:** onPress={() => { setSelectedDoctor(item.doctor_id); setOpenDropdown(null); setDoctorSearch(''); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-784: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/statement.tsx` (line 454)
- **Detail:** onPress={() => { setOpenDropdown(null); setShowFilterModal(false); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-785: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/statement.tsx` (line 184)
- **Detail:** <TouchableOpacity style={styles.retryButton} onPress={loadStatement}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-786: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/statement.tsx` (line 387)
- **Detail:** <TouchableOpacity activeOpacity={1} style={styles.filterModalContent}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-787: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/statement.tsx` (line 426)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-788: console statement in production code
- **File:** `app/(tabs)/vision.tsx` (line 132)
- **Detail:** console.error('Error loading user data:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-789: console statement in production code
- **File:** `app/(tabs)/vision.tsx` (line 162)
- **Detail:** console.error('Error fetching doctors:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-790: console statement in production code
- **File:** `app/(tabs)/vision.tsx` (line 221)
- **Detail:** console.error('Error fetching eye data:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-791: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/vision.tsx` (line 335)
- **Detail:** onPress={() => router.back()}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-792: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/vision.tsx` (line 343)
- **Detail:** onPress={() => setShowFilterModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-793: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/vision.tsx` (line 504)
- **Detail:** onPress={() => openDocument(doc.url)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-794: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/vision.tsx` (line 536)
- **Detail:** onPress={() => { setShowFilterModal(false); setOpenDropdown(null); setDoctorSearch(''); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-795: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/vision.tsx` (line 543)
- **Detail:** onPress={() => { setSelectedDoctorFilter('all'); setSelectedDateFilter('all'); setOpenDropdown(null)
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-796: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/vision.tsx` (line 554)
- **Detail:** onPress={() => { if (openDropdown === 'doctor') { setOpenDropdown(null); setDoctorSearch(''); } else
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-797: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/vision.tsx` (line 577)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-798: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/vision.tsx` (line 590)
- **Detail:** onPress={() => { setSelectedDoctorFilter(item.id); setOpenDropdown(null); setDoctorSearch(''); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-799: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/vision.tsx` (line 610)
- **Detail:** onPress={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-800: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/vision.tsx` (line 628)
- **Detail:** onPress={() => { setSelectedDateFilter(option.value as DateFilter); setOpenDropdown(null); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-801: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/vision.tsx` (line 641)
- **Detail:** onPress={() => { setOpenDropdown(null); setShowFilterModal(false); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-802: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/vision.tsx` (line 538)
- **Detail:** <TouchableOpacity activeOpacity={1} style={styles.filterModalContent}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-803: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/vision.tsx` (line 577)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-804: console statement in production code
- **File:** `app/(tabs)/visit-history.tsx` (line 338)
- **Detail:** console.error('Error fetching visits:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-805: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/visit-history.tsx` (line 408)
- **Detail:** onPress={() => setShowFilterSheet(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-806: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/visit-history.tsx` (line 435)
- **Detail:** onPress={() => selectFilter('all')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-807: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/visit-history.tsx` (line 463)
- **Detail:** onPress={() => toggleGroup(group.doctorId)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-808: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/visit-history.tsx` (line 502)
- **Detail:** onPress={() => setShowFilterSheet(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-809: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/visit-history.tsx` (line 507)
- **Detail:** onPress={() => {}}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-810: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/visit-history.tsx` (line 512)
- **Detail:** <TouchableOpacity onPress={() => setShowFilterSheet(false)} activeOpacity={0.7}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-811: Inline arrow function in onPress — causes re-renders
- **File:** `app/(tabs)/visit-history.tsx` (line 526)
- **Detail:** onPress={() => selectFilter(option.key)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-812: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/visit-history.tsx` (line 198)
- **Detail:** <TouchableOpacity onPress={toggle} activeOpacity={0.75} style={styles.apptSummaryRow}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-813: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/visit-history.tsx` (line 512)
- **Detail:** <TouchableOpacity onPress={() => setShowFilterSheet(false)} activeOpacity={0.7}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-814: console statement in production code
- **File:** `app/book-appointment.tsx` (line 103)
- **Detail:** console.error('Error loading user data:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-815: console statement in production code
- **File:** `app/book-appointment.tsx` (line 134)
- **Detail:** console.error('Error loading doctors:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-816: console statement in production code
- **File:** `app/book-appointment.tsx` (line 170)
- **Detail:** console.error('Failed to load available dates:', result.error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-817: console statement in production code
- **File:** `app/book-appointment.tsx` (line 174)
- **Detail:** console.error('Error loading available dates:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-818: console statement in production code
- **File:** `app/book-appointment.tsx` (line 214)
- **Detail:** console.error('Error loading slots:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-819: console statement in production code
- **File:** `app/book-appointment.tsx` (line 319)
- **Detail:** console.error('Error booking appointment:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-820: Inline arrow function in onPress — causes re-renders
- **File:** `app/book-appointment.tsx` (line 407)
- **Detail:** onPress={() => handleDoctorSelect(doctor)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-821: Inline arrow function in onPress — causes re-renders
- **File:** `app/book-appointment.tsx` (line 465)
- **Detail:** onPress={() => handleClinicSelect(clinic)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-822: Inline arrow function in onPress — causes re-renders
- **File:** `app/book-appointment.tsx` (line 686)
- **Detail:** onPress={() => handleDateSelection(date)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-823: Inline arrow function in onPress — causes re-renders
- **File:** `app/book-appointment.tsx` (line 746)
- **Detail:** onPress={() => setSelectedTime(slot)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-824: Inline arrow function in onPress — causes re-renders
- **File:** `app/book-appointment.tsx` (line 774)
- **Detail:** onPress={() => handleDateTimeSelect(selectedDate, selectedTime)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-825: Touchable element missing accessibilityLabel
- **File:** `app/book-appointment.tsx` (line 896)
- **Detail:** <TouchableOpacity style={styles.backButton} onPress={handleBack}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-826: Inline arrow function in onPress — causes re-renders
- **File:** `app/debug-token.tsx` (line 164)
- **Detail:** <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-827: Touchable element missing accessibilityLabel
- **File:** `app/debug-token.tsx` (line 164)
- **Detail:** <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-828: Touchable element missing accessibilityLabel
- **File:** `app/debug-token.tsx` (line 227)
- **Detail:** <TouchableOpacity onPress={copyToken} style={styles.copyButton}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-829: console statement in production code
- **File:** `app/device-token-debug.tsx` (line 68)
- **Detail:** console.error('Database error:', dbError);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-830: console statement in production code
- **File:** `app/device-token-debug.tsx` (line 75)
- **Detail:** console.error('Error loading token info:', err);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-831: console statement in production code
- **File:** `app/device-token-debug.tsx` (line 125)
- **Detail:** console.error('Error registering token:', err);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-832: Inline arrow function in onPress — causes re-renders
- **File:** `app/device-token-debug.tsx` (line 148)
- **Detail:** <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-833: Touchable element missing accessibilityLabel
- **File:** `app/device-token-debug.tsx` (line 148)
- **Detail:** <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-834: Touchable element missing accessibilityLabel
- **File:** `app/device-token-debug.tsx` (line 152)
- **Detail:** <TouchableOpacity onPress={loadTokenInfo} style={styles.refreshButton}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-835: console statement in production code
- **File:** `app/edit-profile.tsx` (line 65)
- **Detail:** console.log('=== EDIT PROFILE MOUNT ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-836: console statement in production code
- **File:** `app/edit-profile.tsx` (line 66)
- **Detail:** console.log('Session state:', {
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-837: console statement in production code
- **File:** `app/edit-profile.tsx` (line 79)
- **Detail:** console.error('No patient ID or access token in session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-838: console statement in production code
- **File:** `app/edit-profile.tsx` (line 85)
- **Detail:** console.log('Loading profile for patient:', session.patient.id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-839: console statement in production code
- **File:** `app/edit-profile.tsx` (line 97)
- **Detail:** console.log('Profile data:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-840: console statement in production code
- **File:** `app/edit-profile.tsx` (line 106)
- **Detail:** console.log('Setting profile data fields...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-841: console statement in production code
- **File:** `app/edit-profile.tsx` (line 127)
- **Detail:** console.log('Profile fields set:', {
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-842: console statement in production code
- **File:** `app/edit-profile.tsx` (line 136)
- **Detail:** console.log('Found profile_image in database:', data.profile_image);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-843: console statement in production code
- **File:** `app/edit-profile.tsx` (line 140)
- **Detail:** console.log('Generated public URL:', imageData.publicUrl);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-844: console statement in production code
- **File:** `app/edit-profile.tsx` (line 143)
- **Detail:** console.log('No profile_image found in database');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-845: console statement in production code
- **File:** `app/edit-profile.tsx` (line 147)
- **Detail:** console.error('Error loading profile:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-846: console statement in production code
- **File:** `app/edit-profile.tsx` (line 173)
- **Detail:** console.log('[Camera] Requesting camera permissions...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-847: console statement in production code
- **File:** `app/edit-profile.tsx` (line 175)
- **Detail:** console.log('[Camera] Permission status:', status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-848: console statement in production code
- **File:** `app/edit-profile.tsx` (line 182)
- **Detail:** console.log('[Camera] Launching camera...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-849: console statement in production code
- **File:** `app/edit-profile.tsx` (line 190)
- **Detail:** console.log('[Camera] Result:', {
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-850: console statement in production code
- **File:** `app/edit-profile.tsx` (line 197)
- **Detail:** console.log('[Camera] Image selected:', result.assets[0].uri);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-851: console statement in production code
- **File:** `app/edit-profile.tsx` (line 202)
- **Detail:** console.log('[Camera] No image selected or cancelled');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-852: console statement in production code
- **File:** `app/edit-profile.tsx` (line 205)
- **Detail:** console.error('[Camera] Error:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-853: console statement in production code
- **File:** `app/edit-profile.tsx` (line 212)
- **Detail:** console.log('[Gallery] Requesting media library permissions...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-854: console statement in production code
- **File:** `app/edit-profile.tsx` (line 214)
- **Detail:** console.log('[Gallery] Permission status:', status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-855: console statement in production code
- **File:** `app/edit-profile.tsx` (line 221)
- **Detail:** console.log('[Gallery] Launching image library...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-856: console statement in production code
- **File:** `app/edit-profile.tsx` (line 229)
- **Detail:** console.log('[Gallery] Result:', {
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-857: console statement in production code
- **File:** `app/edit-profile.tsx` (line 236)
- **Detail:** console.log('[Gallery] Image selected:', result.assets[0].uri);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-858: console statement in production code
- **File:** `app/edit-profile.tsx` (line 241)
- **Detail:** console.log('[Gallery] No image selected or cancelled');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-859: console statement in production code
- **File:** `app/edit-profile.tsx` (line 244)
- **Detail:** console.error('[Gallery] Error:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-860: console statement in production code
- **File:** `app/edit-profile.tsx` (line 275)
- **Detail:** console.log('Starting image upload...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-861: console statement in production code
- **File:** `app/edit-profile.tsx` (line 276)
- **Detail:** console.log('Image URI:', selectedImageFile.uri);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-862: console statement in production code
- **File:** `app/edit-profile.tsx` (line 277)
- **Detail:** console.log('Session at upload time:', {
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-863: console statement in production code
- **File:** `app/edit-profile.tsx` (line 286)
- **Detail:** console.error('❌ CRITICAL: No medical ID in profile');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-864: console statement in production code
- **File:** `app/edit-profile.tsx` (line 292)
- **Detail:** console.log('File extension:', fileExt);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-865: console statement in production code
- **File:** `app/edit-profile.tsx` (line 303)
- **Detail:** console.log('FormData prepared with file URI:', selectedImageFile.uri);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-866: console statement in production code
- **File:** `app/edit-profile.tsx` (line 305)
- **Detail:** console.log('Sending upload request with medical ID:', profile.medical_id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-867: console statement in production code
- **File:** `app/edit-profile.tsx` (line 311)
- **Detail:** console.log('Upload response status:', uploadResponse.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-868: console statement in production code
- **File:** `app/edit-profile.tsx` (line 313)
- **Detail:** console.log('Upload response text:', responseText);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-869: console statement in production code
- **File:** `app/edit-profile.tsx` (line 323)
- **Detail:** console.error('Upload failed:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-870: console statement in production code
- **File:** `app/edit-profile.tsx` (line 330)
- **Detail:** console.log('Upload successful:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-871: console statement in production code
- **File:** `app/edit-profile.tsx` (line 333)
- **Detail:** console.error('Error uploading image:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-872: console statement in production code
- **File:** `app/edit-profile.tsx` (line 334)
- **Detail:** console.error('Error stack:', error.stack);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-873: console statement in production code
- **File:** `app/edit-profile.tsx` (line 358)
- **Detail:** console.log('Saving profile for patient:', session.patient.id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-874: console statement in production code
- **File:** `app/edit-profile.tsx` (line 389)
- **Detail:** console.log('Sending update request...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-875: console statement in production code
- **File:** `app/edit-profile.tsx` (line 399)
- **Detail:** console.log('Update response status:', updateResponse.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-876: console statement in production code
- **File:** `app/edit-profile.tsx` (line 401)
- **Detail:** console.log('Update response text:', responseText);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-877: console statement in production code
- **File:** `app/edit-profile.tsx` (line 411)
- **Detail:** console.error('Update failed:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-878: console statement in production code
- **File:** `app/edit-profile.tsx` (line 432)
- **Detail:** console.error('Error saving profile:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-879: Inline arrow function in onPress — causes re-renders
- **File:** `app/edit-profile.tsx` (line 458)
- **Detail:** <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-880: Inline arrow function in onPress — causes re-renders
- **File:** `app/edit-profile.tsx` (line 615)
- **Detail:** onPress={() => setShowGenderModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-881: Inline arrow function in onPress — causes re-renders
- **File:** `app/edit-profile.tsx` (line 631)
- **Detail:** onPress={() => setShowBloodTypeModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-882: Inline arrow function in onPress — causes re-renders
- **File:** `app/edit-profile.tsx` (line 689)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-883: Inline arrow function in onPress — causes re-renders
- **File:** `app/edit-profile.tsx` (line 700)
- **Detail:** onPress={() => setShowGenderModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-884: Inline arrow function in onPress — causes re-renders
- **File:** `app/edit-profile.tsx` (line 716)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-885: Inline arrow function in onPress — causes re-renders
- **File:** `app/edit-profile.tsx` (line 727)
- **Detail:** onPress={() => setShowBloodTypeModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-886: Touchable element missing accessibilityLabel
- **File:** `app/edit-profile.tsx` (line 458)
- **Detail:** <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-887: Touchable element missing accessibilityLabel
- **File:** `app/edit-profile.tsx` (line 484)
- **Detail:** <TouchableOpacity style={[styles.changePhotoButton, { backgroundColor: colors.card, borderColor: col
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-888: console statement in production code
- **File:** `app/help-center.tsx` (line 59)
- **Detail:** console.error('Error loading user type:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-889: console statement in production code
- **File:** `app/help-center.tsx` (line 89)
- **Detail:** console.error('Error loading help content:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-890: Inline arrow function in onPress — causes re-renders
- **File:** `app/help-center.tsx` (line 123)
- **Detail:** <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-891: Inline arrow function in onPress — causes re-renders
- **File:** `app/help-center.tsx` (line 154)
- **Detail:** onPress={() => {
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-892: Inline arrow function in onPress — causes re-renders
- **File:** `app/help-center.tsx` (line 190)
- **Detail:** onPress={() => setShowModal(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-893: Touchable element missing accessibilityLabel
- **File:** `app/help-center.tsx` (line 123)
- **Detail:** <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-894: console statement in production code
- **File:** `app/index.tsx` (line 13)
- **Detail:** console.log('=== INDEX SCREEN ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-895: console statement in production code
- **File:** `app/index.tsx` (line 14)
- **Detail:** console.log('isLoading:', isLoading);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-896: console statement in production code
- **File:** `app/index.tsx` (line 15)
- **Detail:** console.log('Has session:', !!session);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-897: console statement in production code
- **File:** `app/index.tsx` (line 16)
- **Detail:** console.log('Has supabaseSession:', !!supabaseSession);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-898: console statement in production code
- **File:** `app/index.tsx` (line 17)
- **Detail:** console.log('Current segments:', segments);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-899: console statement in production code
- **File:** `app/index.tsx` (line 23)
- **Detail:** console.log('Force rendering - auth took too long');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-900: console statement in production code
- **File:** `app/index.tsx` (line 36)
- **Detail:** console.log('Navigation effect triggered - User type:', userType);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-901: console statement in production code
- **File:** `app/index.tsx` (line 40)
- **Detail:** console.log('Navigating to doctor-tabs');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-902: console statement in production code
- **File:** `app/index.tsx` (line 44)
- **Detail:** console.log('Navigating to patient tabs');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-903: console statement in production code
- **File:** `app/index.tsx` (line 49)
- **Detail:** console.log('Navigating to login');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-904: console statement in production code
- **File:** `app/notifications.tsx` (line 73)
- **Detail:** console.log('Notification event received, refreshing list...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-905: console statement in production code
- **File:** `app/notifications.tsx` (line 108)
- **Detail:** console.error('Error loading notifications:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-906: console statement in production code
- **File:** `app/notifications.tsx` (line 185)
- **Detail:** console.error('Error marking notification as read:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-907: console statement in production code
- **File:** `app/notifications.tsx` (line 211)
- **Detail:** console.error('Error marking all notifications as read:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-908: console statement in production code
- **File:** `app/notifications.tsx` (line 255)
- **Detail:** console.error('Error handling authorization:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-909: Inline arrow function in onPress — causes re-renders
- **File:** `app/notifications.tsx` (line 286)
- **Detail:** <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-910: Inline arrow function in onPress — causes re-renders
- **File:** `app/notifications.tsx` (line 300)
- **Detail:** <TouchableOpacity style={styles.iconButton} onPress={() => setShowFilterSheet(true)}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-911: Inline arrow function in onPress — causes re-renders
- **File:** `app/notifications.tsx` (line 360)
- **Detail:** onPress={() => handleNotificationPress(notification)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-912: Touchable element missing accessibilityLabel
- **File:** `app/notifications.tsx` (line 286)
- **Detail:** <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-913: Touchable element missing accessibilityLabel
- **File:** `app/notifications.tsx` (line 300)
- **Detail:** <TouchableOpacity style={styles.iconButton} onPress={() => setShowFilterSheet(true)}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-914: Touchable element missing accessibilityLabel
- **File:** `app/notifications.tsx` (line 304)
- **Detail:** <TouchableOpacity style={styles.iconButton} onPress={markAllAsRead}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-915: console statement in production code
- **File:** `app/package-detail.tsx` (line 74)
- **Detail:** console.error('Error loading package detail:', err);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-916: Inline arrow function in onPress — causes re-renders
- **File:** `app/package-detail.tsx` (line 93)
- **Detail:** <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-917: Touchable element missing accessibilityLabel
- **File:** `app/package-detail.tsx` (line 93)
- **Detail:** <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-918: Touchable element missing accessibilityLabel
- **File:** `app/package-detail.tsx` (line 107)
- **Detail:** <TouchableOpacity style={styles.retryButton} onPress={loadPackageDetail}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-919: console statement in production code
- **File:** `app/payment-methods.tsx` (line 154)
- **Detail:** console.error('Error loading cards:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-920: console statement in production code
- **File:** `app/payment-methods.tsx` (line 248)
- **Detail:** console.log('[PaymentMethods] handleAddCard called');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-921: console statement in production code
- **File:** `app/payment-methods.tsx` (line 249)
- **Detail:** console.log('[PaymentMethods] session:', JSON.stringify(session));
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-922: console statement in production code
- **File:** `app/payment-methods.tsx` (line 250)
- **Detail:** console.log('[PaymentMethods] medicalId:', medicalId);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-923: console statement in production code
- **File:** `app/payment-methods.tsx` (line 253)
- **Detail:** console.log('[PaymentMethods] digits:', digits.length);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-924: console statement in production code
- **File:** `app/payment-methods.tsx` (line 277)
- **Detail:** console.error('[PaymentMethods] medicalId missing from session. session.patient:
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-925: console statement in production code
- **File:** `app/payment-methods.tsx` (line 284)
- **Detail:** console.log('[PaymentMethods] calling edge function with brand:', brand);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-926: console statement in production code
- **File:** `app/payment-methods.tsx` (line 295)
- **Detail:** console.log('[PaymentMethods] result:', JSON.stringify(result));
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-927: console statement in production code
- **File:** `app/payment-methods.tsx` (line 305)
- **Detail:** console.error('[PaymentMethods] catch error:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-928: Inline arrow function in onPress — causes re-renders
- **File:** `app/payment-methods.tsx` (line 334)
- **Detail:** <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-929: Inline arrow function in onPress — causes re-renders
- **File:** `app/payment-methods.tsx` (line 352)
- **Detail:** onPress={() => router.back()}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-930: Inline arrow function in onPress — causes re-renders
- **File:** `app/payment-methods.tsx` (line 360)
- **Detail:** onPress={() => setShowAddModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-931: Inline arrow function in onPress — causes re-renders
- **File:** `app/payment-methods.tsx` (line 383)
- **Detail:** onPress={() => setShowAddModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-932: Inline arrow function in onPress — causes re-renders
- **File:** `app/payment-methods.tsx` (line 434)
- **Detail:** onPress={() => handleSetDefault(card.id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-933: Inline arrow function in onPress — causes re-renders
- **File:** `app/payment-methods.tsx` (line 448)
- **Detail:** onPress={() => handleDelete(card.id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-934: Inline arrow function in onPress — causes re-renders
- **File:** `app/payment-methods.tsx` (line 461)
- **Detail:** onPress={() => setShowAddModal(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-935: Inline arrow function in onPress — causes re-renders
- **File:** `app/payment-methods.tsx` (line 499)
- **Detail:** <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); resetForm(); }}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-936: Inline arrow function in onPress — causes re-renders
- **File:** `app/payment-methods.tsx` (line 509)
- **Detail:** onPress={() => { setShowAddModal(false); setShowScanner(true); }}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-937: Touchable element missing accessibilityLabel
- **File:** `app/payment-methods.tsx` (line 334)
- **Detail:** <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-938: Touchable element missing accessibilityLabel
- **File:** `app/payment-methods.tsx` (line 514)
- **Detail:** <TouchableOpacity onPress={resetForm} activeOpacity={0.7}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-939: console statement in production code
- **File:** `app/test-device-token.tsx` (line 17)
- **Detail:** console.log(message);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-940: Inline arrow function in onPress — causes re-renders
- **File:** `app/test-device-token.tsx` (line 174)
- **Detail:** onPress={() => router.back()}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-941: Touchable element missing accessibilityLabel
- **File:** `app/test-device-token.tsx` (line 152)
- **Detail:** <TouchableOpacity style={styles.button} onPress={testGetToken}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-942: console statement in production code
- **File:** `app/test-fcm.tsx` (line 40)
- **Detail:** console.log('✅ FCM Token:', fcm);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-943: console statement in production code
- **File:** `app/test-fcm.tsx` (line 42)
- **Detail:** console.log('❌ FCM Token not available');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-944: console statement in production code
- **File:** `app/test-fcm.tsx` (line 46)
- **Detail:** console.log('✅ Expo Token:', expo);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-945: console statement in production code
- **File:** `app/test-fcm.tsx` (line 48)
- **Detail:** console.log('❌ Expo Token not available');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-946: console statement in production code
- **File:** `app/test-fcm.tsx` (line 51)
- **Detail:** console.error('Error loading tokens:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-947: console statement in production code
- **File:** `app/test-fcm.tsx` (line 64)
- **Detail:** console.log(`${type} Token:`, text);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-948: console statement in production code
- **File:** `app/test-fcm.tsx` (line 95)
- **Detail:** console.error('Error sending notification:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-949: Inline arrow function in onPress — causes re-renders
- **File:** `app/test-fcm.tsx` (line 133)
- **Detail:** onPress={() => copyToClipboard(fcmToken, 'FCM')}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-950: Inline arrow function in onPress — causes re-renders
- **File:** `app/test-fcm.tsx` (line 153)
- **Detail:** onPress={() => copyToClipboard(expoToken, 'Expo')}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-951: Inline arrow function in onPress — causes re-renders
- **File:** `app/test-fcm.tsx` (line 231)
- **Detail:** <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-952: Touchable element missing accessibilityLabel
- **File:** `app/test-fcm.tsx` (line 231)
- **Detail:** <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-953: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 17)
- **Detail:** console.log('Resetting biometric session flag');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-954: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 70)
- **Detail:** console.log('✓ Already authenticated in this session, skipping biometric check')
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-955: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 78)
- **Detail:** console.log('=== BIOMETRIC AUTH GATE: Session Check ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-956: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 79)
- **Detail:** console.log('Session exists:', !!session);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-957: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 80)
- **Detail:** console.log('Is authenticated in session:', isAuthenticatedInSession);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-958: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 83)
- **Detail:** console.log('No session found, skipping biometric check');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-959: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 92)
- **Detail:** console.log('=== BIOMETRIC AUTH GATE: Doctor Check ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-960: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 93)
- **Detail:** console.log('Session user_type:', session.user_type);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-961: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 94)
- **Detail:** console.log('Session user:', session.user);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-962: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 95)
- **Detail:** console.log('Is doctor?', session.user_type === 'doctor' && session.user);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-963: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 98)
- **Detail:** console.log('Checking doctor biometric settings for user:', session.user.id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-964: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 100)
- **Detail:** console.log('SecureStore doctor_biometric_enabled:', biometricEnabled);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-965: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 103)
- **Detail:** console.log('Getting doctor biometric settings from primary company using global
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-966: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 107)
- **Detail:** console.log('Doctor primary settings:', settings);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-967: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 110)
- **Detail:** console.log('Biometric login enabled in primary company, requiring authenticatio
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-968: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 113)
- **Detail:** console.log('Biometric login disabled in primary company');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-969: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 117)
- **Detail:** console.log('No global_id found, falling back to current user settings');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-970: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 119)
- **Detail:** console.log('Doctor biometric settings:', settings);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-971: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 122)
- **Detail:** console.log('Biometric login enabled, requiring authentication');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-972: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 125)
- **Detail:** console.log('Biometric login disabled in database');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-973: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 130)
- **Detail:** console.log('Biometric not enabled in SecureStore');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-974: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 141)
- **Detail:** console.log('Getting patient biometric settings from primary (using medical_id).
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-975: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 143)
- **Detail:** console.log('Patient primary settings:', settings);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-976: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 151)
- **Detail:** console.log('No medical_id found, falling back to patient_id');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-977: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 167)
- **Detail:** console.error('Error checking biometric requirement:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-978: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 189)
- **Detail:** console.error('Logout error:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-979: console statement in production code
- **File:** `components/BiometricAuthGate.tsx` (line 276)
- **Detail:** console.error('Biometric auth error:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-980: Inline arrow function in onPress — causes re-renders
- **File:** `components/CardScannerModal.tsx` (line 195)
- **Detail:** <TouchableOpacity style={styles.retryHint} onPress={() => setError(null)}>
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-981: Touchable element missing accessibilityLabel
- **File:** `components/CardScannerModal.tsx` (line 104)
- **Detail:** <TouchableOpacity style={[styles.webFallbackBtn, { backgroundColor: colors.primary }]} onPress={onCl
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-982: Touchable element missing accessibilityLabel
- **File:** `components/CardScannerModal.tsx` (line 132)
- **Detail:** <TouchableOpacity style={styles.permissionSkipBtn} onPress={onClose}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-983: Touchable element missing accessibilityLabel
- **File:** `components/CardScannerModal.tsx` (line 149)
- **Detail:** <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-984: Touchable element missing accessibilityLabel
- **File:** `components/CardScannerModal.tsx` (line 195)
- **Detail:** <TouchableOpacity style={styles.retryHint} onPress={() => setError(null)}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-985: console statement in production code
- **File:** `components/ErrorBoundary.tsx` (line 26)
- **Detail:** console.error('=== ERROR BOUNDARY CAUGHT ERROR ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-986: console statement in production code
- **File:** `components/ErrorBoundary.tsx` (line 27)
- **Detail:** console.error('Error:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-987: console statement in production code
- **File:** `components/ErrorBoundary.tsx` (line 28)
- **Detail:** console.error('Error Message:', error.message);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-988: console statement in production code
- **File:** `components/ErrorBoundary.tsx` (line 29)
- **Detail:** console.error('Error Stack:', error.stack);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-989: console statement in production code
- **File:** `components/ErrorBoundary.tsx` (line 30)
- **Detail:** console.error('Error Info:', errorInfo);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-990: console statement in production code
- **File:** `components/ErrorBoundary.tsx` (line 31)
- **Detail:** console.error('Component Stack:', errorInfo.componentStack);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-991: console statement in production code
- **File:** `components/ErrorBoundary.tsx` (line 32)
- **Detail:** console.error('Platform:', Platform.OS);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-992: console statement in production code
- **File:** `components/ErrorBoundary.tsx` (line 33)
- **Detail:** console.error('===================================');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-993: Touchable element missing accessibilityLabel
- **File:** `components/ErrorBoundary.tsx` (line 92)
- **Detail:** <TouchableOpacity style={styles.button} onPress={this.handleReload}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-994: Inline arrow function in onPress — causes re-renders
- **File:** `components/FilterBottomSheet.tsx` (line 82)
- **Detail:** onPress={() => setSort('newest')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-995: Inline arrow function in onPress — causes re-renders
- **File:** `components/FilterBottomSheet.tsx` (line 98)
- **Detail:** onPress={() => setSort('oldest')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-996: Inline arrow function in onPress — causes re-renders
- **File:** `components/FilterBottomSheet.tsx` (line 115)
- **Detail:** onPress={() => setDateRange('all')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-997: Inline arrow function in onPress — causes re-renders
- **File:** `components/FilterBottomSheet.tsx` (line 127)
- **Detail:** onPress={() => setDateRange('today')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-998: Inline arrow function in onPress — causes re-renders
- **File:** `components/FilterBottomSheet.tsx` (line 139)
- **Detail:** onPress={() => setDateRange('7days')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-999: Inline arrow function in onPress — causes re-renders
- **File:** `components/FilterBottomSheet.tsx` (line 151)
- **Detail:** onPress={() => setDateRange('30days')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-1000: Inline arrow function in onPress — causes re-renders
- **File:** `components/FilterBottomSheet.tsx` (line 168)
- **Detail:** onPress={() => setStatus('all')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-1001: Inline arrow function in onPress — causes re-renders
- **File:** `components/FilterBottomSheet.tsx` (line 180)
- **Detail:** onPress={() => setStatus('unread')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-1002: Inline arrow function in onPress — causes re-renders
- **File:** `components/FilterBottomSheet.tsx` (line 192)
- **Detail:** onPress={() => setStatus('read')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-1003: Inline arrow function in onPress — causes re-renders
- **File:** `components/FilterBottomSheet.tsx` (line 209)
- **Detail:** onPress={() => setCategory('all')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-1004: Inline arrow function in onPress — causes re-renders
- **File:** `components/FilterBottomSheet.tsx` (line 221)
- **Detail:** onPress={() => setCategory('Appointment')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-1005: Inline arrow function in onPress — causes re-renders
- **File:** `components/FilterBottomSheet.tsx` (line 233)
- **Detail:** onPress={() => setCategory('Order')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-1006: Inline arrow function in onPress — causes re-renders
- **File:** `components/FilterBottomSheet.tsx` (line 245)
- **Detail:** onPress={() => setCategory('Question')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-1007: Inline arrow function in onPress — causes re-renders
- **File:** `components/FilterBottomSheet.tsx` (line 257)
- **Detail:** onPress={() => setCategory('Authorization')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-1008: Inline arrow function in onPress — causes re-renders
- **File:** `components/FilterBottomSheet.tsx` (line 269)
- **Detail:** onPress={() => setCategory('Reminder')}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-1009: Touchable element missing accessibilityLabel
- **File:** `components/FilterBottomSheet.tsx` (line 63)
- **Detail:** <TouchableOpacity onPress={onClose} style={styles.closeButton}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-1010: Touchable element missing accessibilityLabel
- **File:** `components/FilterBottomSheet.tsx` (line 283)
- **Detail:** <TouchableOpacity style={[styles.resetButton, { backgroundColor: colors.backgroundSecondary, borderC
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-1011: Touchable element missing accessibilityLabel
- **File:** `components/FilterBottomSheet.tsx` (line 286)
- **Detail:** <TouchableOpacity style={[styles.applyButton, { backgroundColor: colors.primary }]} onPress={handleA
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-1012: Inline arrow function in onPress — causes re-renders
- **File:** `components/ImageCaptcha.tsx` (line 240)
- **Detail:** onPress={() => handleTilePress(option.id)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-1013: Touchable element missing accessibilityLabel
- **File:** `components/ImageCaptcha.tsx` (line 215)
- **Detail:** <TouchableOpacity onPress={onClose} style={styles.closeButton}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-1014: Touchable element missing accessibilityLabel
- **File:** `components/ImageCaptcha.tsx` (line 227)
- **Detail:** <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-1015: Touchable element missing accessibilityLabel
- **File:** `components/NotificationCard.tsx` (line 96)
- **Detail:** <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-1016: console statement in production code
- **File:** `components/NotificationDetail.tsx` (line 83)
- **Detail:** console.error('Error handling authorization:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1017: Inline arrow function in onPress — causes re-renders
- **File:** `components/NotificationDetail.tsx` (line 184)
- **Detail:** onPress={() => handleAuthorizationAction(false)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-1018: Inline arrow function in onPress — causes re-renders
- **File:** `components/NotificationDetail.tsx` (line 198)
- **Detail:** onPress={() => handleAuthorizationAction(true)}
- **Fix:** Extract to `const handlePress = useCallback(() => { ... }, [deps])` and use `onPress={handlePress}`.

### L-1019: Touchable element missing accessibilityLabel
- **File:** `components/NotificationDetail.tsx` (line 155)
- **Detail:** <TouchableOpacity onPress={onClose} style={styles.closeButton}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-1020: Touchable element missing accessibilityLabel
- **File:** `components/NotificationDetail.tsx` (line 212)
- **Detail:** <TouchableOpacity style={styles.closeButtonLarge} onPress={onClose}>
- **Fix:** Add `accessibilityLabel="..."` for screen reader compatibility (VoiceOver / TalkBack).

### L-1021: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 51)
- **Detail:** console.error('Error refreshing session:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1022: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 86)
- **Detail:** console.log('Switch clinic response:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1023: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 90)
- **Detail:** console.log('Primary company settings:', result.settings);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1024: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 91)
- **Detail:** console.log('- Biometric enabled:', result.settings.biometric_login_enabled);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1025: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 92)
- **Detail:** console.log('- Notifications enabled:', result.settings.allow_notifications);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1026: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 93)
- **Detail:** console.log('- Dark mode:', result.settings.darkmode);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1027: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 106)
- **Detail:** console.log('Clinic switched to:', clinicId);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1028: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 108)
- **Detail:** console.error('Error switching clinic:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1029: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 115)
- **Detail:** console.log('AuthContext: Starting sign out...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1030: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 128)
- **Detail:** console.log('AuthContext: Deactivating device token...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1031: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 144)
- **Detail:** console.log('AuthContext: Device token deactivated');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1032: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 146)
- **Detail:** console.warn('AuthContext: Failed to deactivate device token:', result.error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1033: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 150)
- **Detail:** console.warn('AuthContext: Could not deactivate device token:', e);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1034: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 155)
- **Detail:** console.log('AuthContext: Supabase sign out completed');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1035: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 158)
- **Detail:** console.log('AuthContext: Custom session cleared');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1036: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 164)
- **Detail:** console.log('AuthContext: Clearing web storage completely...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1037: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 172)
- **Detail:** console.log('AuthContext: All storage cleared');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1038: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 174)
- **Detail:** console.error('Error clearing storage:', e);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1039: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 179)
- **Detail:** console.log('AuthContext: Sign out fully completed');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1040: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 181)
- **Detail:** console.error('Error signing out:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1041: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 191)
- **Detail:** console.log('=== AUTH CONTEXT INITIALIZING ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1042: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 192)
- **Detail:** console.log('Platform:', require('react-native').Platform.OS);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1043: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 193)
- **Detail:** console.log('Timestamp:', new Date().toISOString());
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1044: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 197)
- **Detail:** console.error('⚠️ EMERGENCY AUTH TIMEOUT - App will start without session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1045: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 198)
- **Detail:** console.error('This indicates a critical issue with AsyncStorage or Supabase');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1046: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 204)
- **Detail:** console.log('Step 1: Getting stored session from AsyncStorage...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1047: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 208)
- **Detail:** console.warn('AsyncStorage timeout after 1s');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1048: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 214)
- **Detail:** console.log('Stored session result:', storedSession ? '✓ Found' : '✗ None');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1049: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 217)
- **Detail:** console.log('Session type:', storedSession.user_type);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1050: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 218)
- **Detail:** console.log('User ID:', storedSession.user?.user_id || 'N/A');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1051: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 222)
- **Detail:** console.log('Step 2: Getting Supabase auth session...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1052: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 227)
- **Detail:** console.warn('Supabase timeout after 1s');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1053: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 236)
- **Detail:** console.error('❌ Supabase session error:', sessionError);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1054: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 238)
- **Detail:** console.log('Supabase session result: ✓ Found');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1055: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 239)
- **Detail:** console.log('User email:', currentSession.user?.email || 'N/A');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1056: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 242)
- **Detail:** console.log('Supabase session result: ✗ None');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1057: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 245)
- **Detail:** console.error('❌ Error initializing auth:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1058: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 246)
- **Detail:** console.error('Error type:', error?.name);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1059: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 247)
- **Detail:** console.error('Error message:', error?.message);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1060: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 249)
- **Detail:** console.error('Error stack:', error.stack);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1061: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 254)
- **Detail:** console.log('✓ Auth initialization complete, setting isLoading to false');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1062: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 261)
- **Detail:** console.error('❌ Fatal error in initializeAuth:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1063: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 268)
- **Detail:** console.log('Setting up auth state change listener...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1064: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 270)
- **Detail:** console.log('🔔 Auth state changed:', event);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1065: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 275)
- **Detail:** console.log('User signed out, clearing session');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1066: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 283)
- **Detail:** console.error('❌ Error setting up auth listener:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1067: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 287)
- **Detail:** console.log('Cleaning up auth subscription');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1068: console statement in production code
- **File:** `contexts/AuthContext.tsx` (line 293)
- **Detail:** console.warn('Error unsubscribing:', e);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1069: console statement in production code
- **File:** `contexts/ThemeContext.tsx` (line 77)
- **Detail:** console.log('=== THEME CONTEXT: loadThemePreference ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1070: console statement in production code
- **File:** `contexts/ThemeContext.tsx` (line 78)
- **Detail:** console.log('Session exists:', !!session);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1071: console statement in production code
- **File:** `contexts/ThemeContext.tsx` (line 79)
- **Detail:** console.log('Session user_type:', session?.user_type);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1072: console statement in production code
- **File:** `contexts/ThemeContext.tsx` (line 80)
- **Detail:** console.log('Session user:', session?.user);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1073: console statement in production code
- **File:** `contexts/ThemeContext.tsx` (line 81)
- **Detail:** console.log('Session user.id:', session?.user?.id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1074: console statement in production code
- **File:** `contexts/ThemeContext.tsx` (line 82)
- **Detail:** console.log('Is doctor?', session?.user_type === 'doctor' && session?.user?.id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1075: console statement in production code
- **File:** `contexts/ThemeContext.tsx` (line 85)
- **Detail:** console.log('Loading doctor theme for user:', session.user.id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1076: console statement in production code
- **File:** `contexts/ThemeContext.tsx` (line 101)
- **Detail:** console.log('Doctor settings API response:', data);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1077: console statement in production code
- **File:** `contexts/ThemeContext.tsx` (line 105)
- **Detail:** console.log('Setting doctor theme to:', newTheme);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1078: console statement in production code
- **File:** `contexts/ThemeContext.tsx` (line 108)
- **Detail:** console.log('Failed to fetch doctor settings:', data.error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1079: console statement in production code
- **File:** `contexts/ThemeContext.tsx` (line 112)
- **Detail:** console.error('Error loading doctor theme preference:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1080: console statement in production code
- **File:** `contexts/ThemeContext.tsx` (line 131)
- **Detail:** console.error('Error loading patient theme preference:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1081: console statement in production code
- **File:** `contexts/ThemeContext.tsx` (line 193)
- **Detail:** console.error('Error toggling theme:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1082: console statement in production code
- **File:** `utils/auth.ts` (line 36)
- **Detail:** console.log('💾 SAVING SESSION:', {
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1083: console statement in production code
- **File:** `utils/auth.ts` (line 46)
- **Detail:** console.log('✅ SESSION SAVED SUCCESSFULLY');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1084: console statement in production code
- **File:** `utils/auth.ts` (line 48)
- **Detail:** console.error('❌ Error saving session:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1085: console statement in production code
- **File:** `utils/auth.ts` (line 57)
- **Detail:** console.log('📭 No session data in storage');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1086: console statement in production code
- **File:** `utils/auth.ts` (line 62)
- **Detail:** console.log('📬 LOADING SESSION:', {
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1087: console statement in production code
- **File:** `utils/auth.ts` (line 74)
- **Detail:** console.log('⏰ Session expired, clearing');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1088: console statement in production code
- **File:** `utils/auth.ts` (line 81)
- **Detail:** console.error('❌ Error getting session:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1089: console statement in production code
- **File:** `utils/auth.ts` (line 90)
- **Detail:** console.error('Error clearing session:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1090: console statement in production code
- **File:** `utils/auth.ts` (line 107)
- **Detail:** console.log('🔒 Token expired - logging out user');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1091: console statement in production code
- **File:** `utils/config.ts` (line 22)
- **Detail:** console.error('=== MISSING CONFIGURATION ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1092: console statement in production code
- **File:** `utils/config.ts` (line 23)
- **Detail:** console.error('Supabase URL:', supabaseUrl ? 'Present' : 'MISSING');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1093: console statement in production code
- **File:** `utils/config.ts` (line 24)
- **Detail:** console.error('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'MISSING');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1094: console statement in production code
- **File:** `utils/config.ts` (line 25)
- **Detail:** console.error('This app requires proper configuration to function.');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1095: console statement in production code
- **File:** `utils/firebase.ts` (line 8)
- **Detail:** console.log('Firebase not needed on web');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1096: console statement in production code
- **File:** `utils/firebase.ts` (line 13)
- **Detail:** console.log('Firebase already initialized');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1097: console statement in production code
- **File:** `utils/firebase.ts` (line 22)
- **Detail:** console.log('Firebase already initialized via google-services.json');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1098: console statement in production code
- **File:** `utils/firebase.ts` (line 29)
- **Detail:** console.error('❌ Firebase not auto-initialized. Check google-services.json and r
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1099: console statement in production code
- **File:** `utils/firebase.ts` (line 32)
- **Detail:** console.error('Error initializing Firebase:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1100: console statement in production code
- **File:** `utils/notifications.ts` (line 13)
- **Detail:** console.log('No data in notification for navigation');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1101: console statement in production code
- **File:** `utils/notifications.ts` (line 19)
- **Detail:** console.log('Handling notification navigation:', { type, userType, order_id, app
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1102: console statement in production code
- **File:** `utils/notifications.ts` (line 24)
- **Detail:** console.log('Doctor notification detected, routing to doctor tabs');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1103: console statement in production code
- **File:** `utils/notifications.ts` (line 27)
- **Detail:** console.log('Navigating to doctor appointments screen...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1104: console statement in production code
- **File:** `utils/notifications.ts` (line 32)
- **Detail:** console.log('Navigating to doctor orders screen...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1105: console statement in production code
- **File:** `utils/notifications.ts` (line 37)
- **Detail:** console.log('Navigating to doctor prescriptions (medications) screen...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1106: console statement in production code
- **File:** `utils/notifications.ts` (line 42)
- **Detail:** console.log('Navigating to doctor patients screen...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1107: console statement in production code
- **File:** `utils/notifications.ts` (line 47)
- **Detail:** console.log('Navigating to doctor notifications screen...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1108: console statement in production code
- **File:** `utils/notifications.ts` (line 53)
- **Detail:** console.log('Navigating to doctor notifications screen...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1109: console statement in production code
- **File:** `utils/notifications.ts` (line 60)
- **Detail:** console.log('Patient notification detected, routing to patient tabs');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1110: console statement in production code
- **File:** `utils/notifications.ts` (line 63)
- **Detail:** console.log('Navigating to orders screen...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1111: console statement in production code
- **File:** `utils/notifications.ts` (line 69)
- **Detail:** console.log('Navigating to appointments screen...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1112: console statement in production code
- **File:** `utils/notifications.ts` (line 75)
- **Detail:** console.log('Navigating to invoices screen...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1113: console statement in production code
- **File:** `utils/notifications.ts` (line 80)
- **Detail:** console.log('Navigating to prescriptions screen...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1114: console statement in production code
- **File:** `utils/notifications.ts` (line 85)
- **Detail:** console.log('Navigating to doctor responses screen...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1115: console statement in production code
- **File:** `utils/notifications.ts` (line 91)
- **Detail:** console.log('Navigating to nutrition screen...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1116: console statement in production code
- **File:** `utils/notifications.ts` (line 97)
- **Detail:** console.log('Navigating to vision screen...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1117: console statement in production code
- **File:** `utils/notifications.ts` (line 103)
- **Detail:** console.log('Navigating to dental screen...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1118: console statement in production code
- **File:** `utils/notifications.ts` (line 108)
- **Detail:** console.log('Navigating to notifications screen (reminder)...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1119: console statement in production code
- **File:** `utils/notifications.ts` (line 113)
- **Detail:** console.log('Unknown notification type, opening home screen');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1120: console statement in production code
- **File:** `utils/notifications.ts` (line 117)
- **Detail:** console.error('Error navigating from notification:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1121: console statement in production code
- **File:** `utils/notifications.ts` (line 130)
- **Detail:** console.error('Firebase not initialized. Cannot get messaging.');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1122: console statement in production code
- **File:** `utils/notifications.ts` (line 138)
- **Detail:** console.log('Firebase messaging loaded successfully');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1123: console statement in production code
- **File:** `utils/notifications.ts` (line 140)
- **Detail:** console.error('Failed to load Firebase messaging:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1124: console statement in production code
- **File:** `utils/notifications.ts` (line 149)
- **Detail:** console.log('Getting Expo push token...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1125: console statement in production code
- **File:** `utils/notifications.ts` (line 163)
- **Detail:** console.error('Expo push notification permissions denied');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1126: console statement in production code
- **File:** `utils/notifications.ts` (line 171)
- **Detail:** console.log('✅ Expo push token received:', token.data);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1127: console statement in production code
- **File:** `utils/notifications.ts` (line 174)
- **Detail:** console.error('Error getting Expo push token:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1128: console statement in production code
- **File:** `utils/notifications.ts` (line 180)
- **Detail:** console.log('Getting push token...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1129: console statement in production code
- **File:** `utils/notifications.ts` (line 181)
- **Detail:** console.log('Platform:', Platform.OS);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1130: console statement in production code
- **File:** `utils/notifications.ts` (line 182)
- **Detail:** console.log('Device.isDevice:', Device.isDevice);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1131: console statement in production code
- **File:** `utils/notifications.ts` (line 185)
- **Detail:** console.warn('Push tokens are not available on web platform');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1132: console statement in production code
- **File:** `utils/notifications.ts` (line 191)
- **Detail:** console.log('Running in Expo Go:', isExpoGo);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1133: console statement in production code
- **File:** `utils/notifications.ts` (line 197)
- **Detail:** console.log('Initializing Firebase before getting FCM token...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1134: console statement in production code
- **File:** `utils/notifications.ts` (line 200)
- **Detail:** console.error('Failed to initialize Firebase, falling back to Expo token');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1135: console statement in production code
- **File:** `utils/notifications.ts` (line 203)
- **Detail:** console.log('Firebase initialized successfully');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1136: console statement in production code
- **File:** `utils/notifications.ts` (line 207)
- **Detail:** console.error('Firebase messaging not available, falling back to Expo token');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1137: console statement in production code
- **File:** `utils/notifications.ts` (line 211)
- **Detail:** console.log('Requesting FCM notification permissions...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1138: console statement in production code
- **File:** `utils/notifications.ts` (line 213)
- **Detail:** console.log('FCM Permission status:', authStatus);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1139: console statement in production code
- **File:** `utils/notifications.ts` (line 220)
- **Detail:** console.error('Push notification permissions denied');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1140: console statement in production code
- **File:** `utils/notifications.ts` (line 229)
- **Detail:** console.log('Getting FCM token with retry logic...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1141: console statement in production code
- **File:** `utils/notifications.ts` (line 236)
- **Detail:** console.log(`FCM token retrieval attempt ${attempt}/${maxRetries}...`);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1142: console statement in production code
- **File:** `utils/notifications.ts` (line 240)
- **Detail:** console.log('✅ FCM TOKEN received successfully');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1143: console statement in production code
- **File:** `utils/notifications.ts` (line 241)
- **Detail:** console.log('Token preview:', token.substring(0, 50) + '...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1144: console statement in production code
- **File:** `utils/notifications.ts` (line 245)
- **Detail:** console.warn(`Attempt ${attempt}: No FCM token received, retrying...`);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1145: console statement in production code
- **File:** `utils/notifications.ts` (line 249)
- **Detail:** console.error(`FCM Attempt ${attempt} failed:`, err);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1146: console statement in production code
- **File:** `utils/notifications.ts` (line 251)
- **Detail:** console.log('FCM failed, falling back to Expo token');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1147: console statement in production code
- **File:** `utils/notifications.ts` (line 258)
- **Detail:** console.error('❌ Failed to get FCM token after all retries, falling back to Expo
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1148: console statement in production code
- **File:** `utils/notifications.ts` (line 261)
- **Detail:** console.error('Error getting FCM token, falling back to Expo token:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1149: console statement in production code
- **File:** `utils/notifications.ts` (line 263)
- **Detail:** console.error('Error details:', error.message);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1150: console statement in production code
- **File:** `utils/notifications.ts` (line 264)
- **Detail:** console.error('Error stack:', error.stack);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1151: console statement in production code
- **File:** `utils/notifications.ts` (line 270)
- **Detail:** console.log('Using Expo push token (Expo Go or simulator)');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1152: console statement in production code
- **File:** `utils/notifications.ts` (line 292)
- **Detail:** console.log('=== SAVE DEVICE TOKEN FUNCTION CALLED ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1153: console statement in production code
- **File:** `utils/notifications.ts` (line 293)
- **Detail:** console.log('Patient ID:', patientId);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1154: console statement in production code
- **File:** `utils/notifications.ts` (line 294)
- **Detail:** console.log('Medical ID:', medicalId);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1155: console statement in production code
- **File:** `utils/notifications.ts` (line 295)
- **Detail:** console.log('Token (first 40 chars):', token.substring(0, 40) + '...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1156: console statement in production code
- **File:** `utils/notifications.ts` (line 296)
- **Detail:** console.log('Full Token Length:', token.length);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1157: console statement in production code
- **File:** `utils/notifications.ts` (line 297)
- **Detail:** console.log('Device Info:', deviceInfo);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1158: console statement in production code
- **File:** `utils/notifications.ts` (line 298)
- **Detail:** console.log('Supabase URL:', supabaseUrl);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1159: console statement in production code
- **File:** `utils/notifications.ts` (line 299)
- **Detail:** console.log('Has Supabase Key:', !!supabaseKey);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1160: console statement in production code
- **File:** `utils/notifications.ts` (line 300)
- **Detail:** console.log('Supabase Key Length:', supabaseKey?.length || 0);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1161: console statement in production code
- **File:** `utils/notifications.ts` (line 304)
- **Detail:** console.log('📱 Expo push token detected - will be saved for Expo development');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1162: console statement in production code
- **File:** `utils/notifications.ts` (line 306)
- **Detail:** console.log('📱 FCM token detected - will be saved for production use');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1163: console statement in production code
- **File:** `utils/notifications.ts` (line 313)
- **Detail:** console.log('✅ FCM token stored in SecureStore for logout');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1164: console statement in production code
- **File:** `utils/notifications.ts` (line 315)
- **Detail:** console.warn('⚠️ Could not store FCM token in SecureStore:', storeError);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1165: console statement in production code
- **File:** `utils/notifications.ts` (line 326)
- **Detail:** console.log('Request URL:', url);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1166: console statement in production code
- **File:** `utils/notifications.ts` (line 327)
- **Detail:** console.log('Request Body:', JSON.stringify(requestBody, null, 2));
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1167: console statement in production code
- **File:** `utils/notifications.ts` (line 329)
- **Detail:** console.log('=== MAKING FETCH REQUEST ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1168: console statement in production code
- **File:** `utils/notifications.ts` (line 330)
- **Detail:** console.log('⏳ Calling:', url);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1169: console statement in production code
- **File:** `utils/notifications.ts` (line 341)
- **Detail:** console.log('=== FETCH RESPONSE RECEIVED ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1170: console statement in production code
- **File:** `utils/notifications.ts` (line 342)
- **Detail:** console.log('Status:', response.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1171: console statement in production code
- **File:** `utils/notifications.ts` (line 343)
- **Detail:** console.log('Status Text:', response.statusText);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1172: console statement in production code
- **File:** `utils/notifications.ts` (line 344)
- **Detail:** console.log('OK:', response.ok);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1173: console statement in production code
- **File:** `utils/notifications.ts` (line 345)
- **Detail:** console.log('Headers:', JSON.stringify(Object.fromEntries(response.headers.entri
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1174: console statement in production code
- **File:** `utils/notifications.ts` (line 349)
- **Detail:** console.log('Raw Response:', responseText);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1175: console statement in production code
- **File:** `utils/notifications.ts` (line 353)
- **Detail:** console.log('=== RESPONSE BODY (Parsed) ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1176: console statement in production code
- **File:** `utils/notifications.ts` (line 354)
- **Detail:** console.log('Result:', JSON.stringify(result, null, 2));
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1177: console statement in production code
- **File:** `utils/notifications.ts` (line 356)
- **Detail:** console.error('Failed to parse response as JSON:', parseError);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1178: console statement in production code
- **File:** `utils/notifications.ts` (line 361)
- **Detail:** console.error('❌ FAILED TO SAVE - Response not OK');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1179: console statement in production code
- **File:** `utils/notifications.ts` (line 362)
- **Detail:** console.error('Status:', response.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1180: console statement in production code
- **File:** `utils/notifications.ts` (line 363)
- **Detail:** console.error('Result:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1181: console statement in production code
- **File:** `utils/notifications.ts` (line 368)
- **Detail:** console.log('Success value:', success);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1182: console statement in production code
- **File:** `utils/notifications.ts` (line 371)
- **Detail:** console.log('✅ TOKEN SAVED SUCCESSFULLY');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1183: console statement in production code
- **File:** `utils/notifications.ts` (line 373)
- **Detail:** console.log('⚠️ Response OK but success=false');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1184: console statement in production code
- **File:** `utils/notifications.ts` (line 378)
- **Detail:** console.error('=== ERROR IN SAVE DEVICE TOKEN ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1185: console statement in production code
- **File:** `utils/notifications.ts` (line 379)
- **Detail:** console.error('Error:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1186: console statement in production code
- **File:** `utils/notifications.ts` (line 381)
- **Detail:** console.error('Error message:', error.message);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1187: console statement in production code
- **File:** `utils/notifications.ts` (line 382)
- **Detail:** console.error('Error stack:', error.stack);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1188: console statement in production code
- **File:** `utils/notifications.ts` (line 404)
- **Detail:** console.log('=== SAVE DOCTOR DEVICE TOKEN FUNCTION CALLED ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1189: console statement in production code
- **File:** `utils/notifications.ts` (line 405)
- **Detail:** console.log('User ID:', userId);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1190: console statement in production code
- **File:** `utils/notifications.ts` (line 406)
- **Detail:** console.log('Token (first 40 chars):', token.substring(0, 40) + '...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1191: console statement in production code
- **File:** `utils/notifications.ts` (line 407)
- **Detail:** console.log('Device Info:', deviceInfo);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1192: console statement in production code
- **File:** `utils/notifications.ts` (line 408)
- **Detail:** console.log('Supabase URL:', supabaseUrl);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1193: console statement in production code
- **File:** `utils/notifications.ts` (line 409)
- **Detail:** console.log('Has Supabase Key:', !!supabaseKey);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1194: console statement in production code
- **File:** `utils/notifications.ts` (line 413)
- **Detail:** console.log('📱 Expo push token detected - will be saved for Expo development');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1195: console statement in production code
- **File:** `utils/notifications.ts` (line 415)
- **Detail:** console.log('📱 FCM token detected - will be saved for production use');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1196: console statement in production code
- **File:** `utils/notifications.ts` (line 422)
- **Detail:** console.log('✅ FCM token stored in SecureStore for logout');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1197: console statement in production code
- **File:** `utils/notifications.ts` (line 424)
- **Detail:** console.warn('⚠️ Could not store FCM token in SecureStore:', storeError);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1198: console statement in production code
- **File:** `utils/notifications.ts` (line 434)
- **Detail:** console.log('Request URL:', url);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1199: console statement in production code
- **File:** `utils/notifications.ts` (line 435)
- **Detail:** console.log('Request Body:', JSON.stringify(requestBody, null, 2));
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1200: console statement in production code
- **File:** `utils/notifications.ts` (line 437)
- **Detail:** console.log('=== MAKING FETCH REQUEST ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1201: console statement in production code
- **File:** `utils/notifications.ts` (line 438)
- **Detail:** console.log('⏳ Calling:', url);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1202: console statement in production code
- **File:** `utils/notifications.ts` (line 449)
- **Detail:** console.log('=== FETCH RESPONSE RECEIVED ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1203: console statement in production code
- **File:** `utils/notifications.ts` (line 450)
- **Detail:** console.log('Status:', response.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1204: console statement in production code
- **File:** `utils/notifications.ts` (line 451)
- **Detail:** console.log('Status Text:', response.statusText);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1205: console statement in production code
- **File:** `utils/notifications.ts` (line 452)
- **Detail:** console.log('OK:', response.ok);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1206: console statement in production code
- **File:** `utils/notifications.ts` (line 453)
- **Detail:** console.log('Headers:', JSON.stringify(Object.fromEntries(response.headers.entri
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1207: console statement in production code
- **File:** `utils/notifications.ts` (line 457)
- **Detail:** console.log('Raw Response:', responseText);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1208: console statement in production code
- **File:** `utils/notifications.ts` (line 461)
- **Detail:** console.log('=== RESPONSE BODY (Parsed) ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1209: console statement in production code
- **File:** `utils/notifications.ts` (line 462)
- **Detail:** console.log('Result:', JSON.stringify(result, null, 2));
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1210: console statement in production code
- **File:** `utils/notifications.ts` (line 464)
- **Detail:** console.error('Failed to parse response as JSON:', parseError);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1211: console statement in production code
- **File:** `utils/notifications.ts` (line 469)
- **Detail:** console.error('❌ FAILED TO SAVE - Response not OK');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1212: console statement in production code
- **File:** `utils/notifications.ts` (line 470)
- **Detail:** console.error('Status:', response.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1213: console statement in production code
- **File:** `utils/notifications.ts` (line 471)
- **Detail:** console.error('Result:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1214: console statement in production code
- **File:** `utils/notifications.ts` (line 476)
- **Detail:** console.log('Success value:', success);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1215: console statement in production code
- **File:** `utils/notifications.ts` (line 479)
- **Detail:** console.log('✅ DOCTOR TOKEN SAVED SUCCESSFULLY');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1216: console statement in production code
- **File:** `utils/notifications.ts` (line 481)
- **Detail:** console.log('⚠️ Response OK but success=false');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1217: console statement in production code
- **File:** `utils/notifications.ts` (line 486)
- **Detail:** console.error('=== ERROR IN SAVE DOCTOR DEVICE TOKEN ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1218: console statement in production code
- **File:** `utils/notifications.ts` (line 487)
- **Detail:** console.error('Error:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1219: console statement in production code
- **File:** `utils/notifications.ts` (line 489)
- **Detail:** console.error('Error message:', error.message);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1220: console statement in production code
- **File:** `utils/notifications.ts` (line 490)
- **Detail:** console.error('Error stack:', error.stack);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1221: console statement in production code
- **File:** `utils/notifications.ts` (line 502)
- **Detail:** console.log('No session found, cannot save refreshed token');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1222: console statement in production code
- **File:** `utils/notifications.ts` (line 508)
- **Detail:** console.log('Invalid session data, cannot save refreshed token');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1223: console statement in production code
- **File:** `utils/notifications.ts` (line 512)
- **Detail:** console.log('Saving refreshed FCM token...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1224: console statement in production code
- **File:** `utils/notifications.ts` (line 522)
- **Detail:** console.log('✅ Refreshed token saved successfully');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1225: console statement in production code
- **File:** `utils/notifications.ts` (line 524)
- **Detail:** console.log('❌ Failed to save refreshed token');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1226: console statement in production code
- **File:** `utils/notifications.ts` (line 527)
- **Detail:** console.error('Error saving refreshed token:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1227: console statement in production code
- **File:** `utils/notifications.ts` (line 533)
- **Detail:** console.warn('Notification listeners not available on web');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1228: console statement in production code
- **File:** `utils/notifications.ts` (line 537)
- **Detail:** console.log('Setting up Firebase notification listeners...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1229: console statement in production code
- **File:** `utils/notifications.ts` (line 542)
- **Detail:** console.error('Firebase messaging not available for listeners');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1230: console statement in production code
- **File:** `utils/notifications.ts` (line 547)
- **Detail:** console.log('📱 FOREGROUND notification received:', JSON.stringify(remoteMessage
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1231: console statement in production code
- **File:** `utils/notifications.ts` (line 571)
- **Detail:** console.log('🔔 BACKGROUND notification tapped:', JSON.stringify(remoteMessage, 
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1232: console statement in production code
- **File:** `utils/notifications.ts` (line 577)
- **Detail:** console.log('🔄 FCM Token refreshed:', token);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1233: console statement in production code
- **File:** `utils/notifications.ts` (line 583)
- **Detail:** console.log('💤 App opened from CLOSED state via notification');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1234: console statement in production code
- **File:** `utils/notifications.ts` (line 590)
- **Detail:** console.log('✅ All notification listeners registered');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1235: console statement in production code
- **File:** `utils/notifications.ts` (line 591)
- **Detail:** console.log('  - Foreground messages (app open)');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1236: console statement in production code
- **File:** `utils/notifications.ts` (line 592)
- **Detail:** console.log('  - Background taps (app minimized)');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1237: console statement in production code
- **File:** `utils/notifications.ts` (line 593)
- **Detail:** console.log('  - Initial notification (app closed)');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1238: console statement in production code
- **File:** `utils/notifications.ts` (line 594)
- **Detail:** console.log('  - Token refresh (automatic)');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1239: console statement in production code
- **File:** `utils/notifications.ts` (line 602)
- **Detail:** console.error('Error setting up notification listeners:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1240: console statement in production code
- **File:** `utils/notifications.ts` (line 615)
- **Detail:** console.error('Firebase messaging not available for background handler');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1241: console statement in production code
- **File:** `utils/notifications.ts` (line 620)
- **Detail:** console.log('💤 BACKGROUND notification received (app closed/killed):', JSON.str
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1242: console statement in production code
- **File:** `utils/notifications.ts` (line 621)
- **Detail:** console.log('Notification will be displayed by system');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1243: console statement in production code
- **File:** `utils/notifications.ts` (line 624)
- **Detail:** console.log('✅ Background notification handler initialized');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1244: console statement in production code
- **File:** `utils/notifications.ts` (line 625)
- **Detail:** console.log('   Handles notifications when app is closed or killed');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1245: console statement in production code
- **File:** `utils/notifications.ts` (line 627)
- **Detail:** console.error('Error setting background message handler:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1246: console statement in production code
- **File:** `utils/notifications.ts` (line 633)
- **Detail:** console.warn('Initial notification not available on web');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1247: console statement in production code
- **File:** `utils/notifications.ts` (line 640)
- **Detail:** console.error('Firebase messaging not available for initial notification');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1248: console statement in production code
- **File:** `utils/notifications.ts` (line 646)
- **Detail:** console.log('App opened from quit state by notification:', JSON.stringify(initia
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1249: console statement in production code
- **File:** `utils/notifications.ts` (line 650)
- **Detail:** console.error('Error getting initial notification:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1250: console statement in production code
- **File:** `utils/settingsService.ts` (line 26)
- **Detail:** console.error('Failed to get notification settings:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1251: console statement in production code
- **File:** `utils/settingsService.ts` (line 32)
- **Detail:** console.error('Error getting notification settings:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1252: console statement in production code
- **File:** `utils/settingsService.ts` (line 42)
- **Detail:** console.log('updateNotificationSettings called with:', { patientId, allowNotific
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1253: console statement in production code
- **File:** `utils/settingsService.ts` (line 60)
- **Detail:** console.log('Update notification settings response:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1254: console statement in production code
- **File:** `utils/settingsService.ts` (line 63)
- **Detail:** console.error('Failed to update notification settings:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1255: console statement in production code
- **File:** `utils/settingsService.ts` (line 69)
- **Detail:** console.error('Error updating notification settings:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1256: console statement in production code
- **File:** `utils/settingsService.ts` (line 93)
- **Detail:** console.error('Failed to get biometric settings:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1257: console statement in production code
- **File:** `utils/settingsService.ts` (line 105)
- **Detail:** console.error('Error getting biometric settings:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1258: console statement in production code
- **File:** `utils/settingsService.ts` (line 136)
- **Detail:** console.log('Update biometric settings response:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1259: console statement in production code
- **File:** `utils/settingsService.ts` (line 139)
- **Detail:** console.error('Failed to update biometric settings:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1260: console statement in production code
- **File:** `utils/settingsService.ts` (line 145)
- **Detail:** console.error('Error updating biometric settings:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1261: console statement in production code
- **File:** `utils/settingsService.ts` (line 169)
- **Detail:** console.log('Get doctor biometric settings response:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1262: console statement in production code
- **File:** `utils/settingsService.ts` (line 172)
- **Detail:** console.error('Failed to get doctor biometric settings:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1263: console statement in production code
- **File:** `utils/settingsService.ts` (line 184)
- **Detail:** console.error('Error getting doctor biometric settings:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1264: console statement in production code
- **File:** `utils/settingsService.ts` (line 213)
- **Detail:** console.log('Get primary settings response:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1265: console statement in production code
- **File:** `utils/settingsService.ts` (line 216)
- **Detail:** console.error('Failed to get primary settings:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1266: console statement in production code
- **File:** `utils/settingsService.ts` (line 232)
- **Detail:** console.error('Error getting primary settings:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1267: console statement in production code
- **File:** `utils/supabase.ts` (line 6)
- **Detail:** console.log('=== SUPABASE CLIENT INITIALIZATION ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1268: console statement in production code
- **File:** `utils/supabase.ts` (line 7)
- **Detail:** console.log('Platform:', Platform.OS);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1269: console statement in production code
- **File:** `utils/supabase.ts` (line 8)
- **Detail:** console.log('Platform Version:', Platform.Version);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1270: console statement in production code
- **File:** `utils/supabase.ts` (line 11)
- **Detail:** console.log('Loading URL polyfill...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1271: console statement in production code
- **File:** `utils/supabase.ts` (line 13)
- **Detail:** console.log('✓ URL polyfill loaded');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1272: console statement in production code
- **File:** `utils/supabase.ts` (line 15)
- **Detail:** console.error('❌ Failed to load URL polyfill:', e);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1273: console statement in production code
- **File:** `utils/supabase.ts` (line 21)
- **Detail:** console.log('Environment check:');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1274: console statement in production code
- **File:** `utils/supabase.ts` (line 22)
- **Detail:** console.log('  Supabase URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1275: console statement in production code
- **File:** `utils/supabase.ts` (line 23)
- **Detail:** console.log('  Supabase Anon Key:', supabaseAnonKey ? '✓ Set' : '✗ Missing');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1276: console statement in production code
- **File:** `utils/supabase.ts` (line 26)
- **Detail:** console.error('❌ CRITICAL: Missing Supabase environment variables!');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1277: console statement in production code
- **File:** `utils/supabase.ts` (line 27)
- **Detail:** console.error('The app cannot function without these variables.');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1278: console statement in production code
- **File:** `utils/supabase.ts` (line 28)
- **Detail:** console.error('Please check your .env file and restart the app.');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1279: console statement in production code
- **File:** `utils/supabase.ts` (line 34)
- **Detail:** console.log('Creating Supabase client with AsyncStorage...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1280: console statement in production code
- **File:** `utils/supabase.ts` (line 35)
- **Detail:** console.log('Using URL:', supabaseUrl.substring(0, 20) + '...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1281: console statement in production code
- **File:** `utils/supabase.ts` (line 46)
- **Detail:** console.log('Client config:', JSON.stringify(clientConfig, null, 2));
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1282: console statement in production code
- **File:** `utils/supabase.ts` (line 50)
- **Detail:** console.log('✅ Supabase client created successfully');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1283: console statement in production code
- **File:** `utils/supabase.ts` (line 51)
- **Detail:** console.log('Client object type:', typeof supabaseClient);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1284: console statement in production code
- **File:** `utils/supabase.ts` (line 54)
- **Detail:** console.log('✓ Android-specific initialization complete');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1285: console statement in production code
- **File:** `utils/supabase.ts` (line 57)
- **Detail:** console.log('Supabase client health check...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1286: console statement in production code
- **File:** `utils/supabase.ts` (line 59)
- **Detail:** console.log('✓ Auth module available');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1287: console statement in production code
- **File:** `utils/supabase.ts` (line 61)
- **Detail:** console.error('✗ Auth module not available');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1288: console statement in production code
- **File:** `utils/supabase.ts` (line 66)
- **Detail:** console.error('❌ FATAL: Failed to create Supabase client');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1289: console statement in production code
- **File:** `utils/supabase.ts` (line 67)
- **Detail:** console.error('Error:', error);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1290: console statement in production code
- **File:** `utils/supabase.ts` (line 68)
- **Detail:** console.error('Error name:', error?.name);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1291: console statement in production code
- **File:** `utils/supabase.ts` (line 69)
- **Detail:** console.error('Error message:', error?.message);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1292: console statement in production code
- **File:** `utils/supabase.ts` (line 71)
- **Detail:** console.error('Error stack:', error.stack);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1293: console statement in production code
- **File:** `utils/supabase.ts` (line 74)
- **Detail:** console.error('This is a critical error. The app may not function correctly.');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-1294: console statement in production code
- **File:** `utils/supabase.ts` (line 85)
- **Detail:** console.warn('⚠️ Using dummy Supabase client - app will run but features will no
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

---

## ☁️ Supabase Issues

### SUP-001: Supabase call missing error destructuring
- **File:** `contexts/AuthContext.tsx` (line 46)
- **Fix:** Destructure { data, error } and check error.

### SUP-002: Supabase call missing error destructuring
- **File:** `contexts/AuthContext.tsx` (line 154)
- **Fix:** Destructure { data, error } and check error.

---

## 🔐 Security Issues

### SEC-001: Sensitive key in AsyncStorage
- **File:** `app/(doctor-tabs)/index.tsx` (line 165)
- **Fix:** Migrate to expo-secure-store.

### SEC-002: Sensitive key in AsyncStorage
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 77)
- **Fix:** Migrate to expo-secure-store.

### SEC-003: Sensitive key in AsyncStorage
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 174)
- **Fix:** Migrate to expo-secure-store.

### SEC-004: Sensitive key in AsyncStorage
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 206)
- **Fix:** Migrate to expo-secure-store.

### SEC-005: Sensitive key in AsyncStorage
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 250)
- **Fix:** Migrate to expo-secure-store.

### SEC-006: Sensitive key in AsyncStorage
- **File:** `app/(doctor-tabs)/settings.tsx` (line 56)
- **Fix:** Migrate to expo-secure-store.

### SEC-007: Sensitive key in AsyncStorage
- **File:** `app/(doctor-tabs)/settings.tsx` (line 130)
- **Fix:** Migrate to expo-secure-store.

### SEC-008: Sensitive key in AsyncStorage
- **File:** `app/(doctor-tabs)/settings.tsx` (line 201)
- **Fix:** Migrate to expo-secure-store.

### SEC-009: Sensitive key in AsyncStorage
- **File:** `app/(tabs)/dental.tsx` (line 92)
- **Fix:** Migrate to expo-secure-store.

### SEC-010: Sensitive key in AsyncStorage
- **File:** `app/(tabs)/doctor-responses.tsx` (line 77)
- **Fix:** Migrate to expo-secure-store.

### SEC-011: Sensitive key in AsyncStorage
- **File:** `app/(tabs)/doctor-responses.tsx` (line 146)
- **Fix:** Migrate to expo-secure-store.

### SEC-012: Sensitive key in AsyncStorage
- **File:** `app/(tabs)/index.tsx` (line 181)
- **Fix:** Migrate to expo-secure-store.

### SEC-013: Sensitive key in AsyncStorage
- **File:** `app/(tabs)/index.tsx` (line 232)
- **Fix:** Migrate to expo-secure-store.

### SEC-014: Sensitive key in AsyncStorage
- **File:** `app/(tabs)/index.tsx` (line 269)
- **Fix:** Migrate to expo-secure-store.

### SEC-015: Sensitive key in AsyncStorage
- **File:** `app/(tabs)/invoices.tsx` (line 107)
- **Fix:** Migrate to expo-secure-store.

### SEC-016: Sensitive key in AsyncStorage
- **File:** `app/(tabs)/invoices.tsx` (line 171)
- **Fix:** Migrate to expo-secure-store.

### SEC-017: Sensitive key in AsyncStorage
- **File:** `app/(tabs)/orders.tsx` (line 78)
- **Fix:** Migrate to expo-secure-store.

### SEC-018: Sensitive key in AsyncStorage
- **File:** `app/(tabs)/packages.tsx` (line 56)
- **Fix:** Migrate to expo-secure-store.

### SEC-019: Sensitive key in AsyncStorage
- **File:** `app/(tabs)/prescriptions.tsx` (line 102)
- **Fix:** Migrate to expo-secure-store.

### SEC-020: Sensitive key in AsyncStorage
- **File:** `app/(tabs)/statement.tsx` (line 75)
- **Fix:** Migrate to expo-secure-store.

### SEC-021: Sensitive key in AsyncStorage
- **File:** `app/(tabs)/vision.tsx` (line 124)
- **Fix:** Migrate to expo-secure-store.

### SEC-022: Sensitive key in AsyncStorage
- **File:** `app/notifications.tsx` (line 86)
- **Fix:** Migrate to expo-secure-store.

### SEC-023: Sensitive key in AsyncStorage
- **File:** `app/notifications.tsx` (line 166)
- **Fix:** Migrate to expo-secure-store.

### SEC-024: Sensitive key in AsyncStorage
- **File:** `app/notifications.tsx` (line 193)
- **Fix:** Migrate to expo-secure-store.

### SEC-025: Sensitive key in AsyncStorage
- **File:** `app/notifications.tsx` (line 225)
- **Fix:** Migrate to expo-secure-store.

---

## ⚡ Performance Issues

### PERF-001: Inline onPress function
- **File:** `app/(auth)/doctor-login.tsx` (line 168)
- **Fix:** Use useCallback.

### PERF-002: Inline onPress function
- **File:** `app/(auth)/doctor-login.tsx` (line 200)
- **Fix:** Use useCallback.

### PERF-003: Inline onPress function
- **File:** `app/(auth)/doctor-login.tsx` (line 239)
- **Fix:** Use useCallback.

### PERF-004: Inline onPress function
- **File:** `app/(auth)/doctor-login.tsx` (line 299)
- **Fix:** Use useCallback.

### PERF-005: Inline onPress function
- **File:** `app/(auth)/doctor-login.tsx` (line 313)
- **Fix:** Use useCallback.

### PERF-006: Inline onPress function
- **File:** `app/(auth)/forgot-password.tsx` (line 118)
- **Fix:** Use useCallback.

### PERF-007: Inline onPress function
- **File:** `app/(auth)/forgot-password.tsx` (line 174)
- **Fix:** Use useCallback.

### PERF-008: Inline onPress function
- **File:** `app/(auth)/otp-verify.tsx` (line 139)
- **Fix:** Use useCallback.

### PERF-009: Inline onPress function
- **File:** `app/(auth)/patient-login.tsx` (line 230)
- **Fix:** Use useCallback.

### PERF-010: Inline onPress function
- **File:** `app/(auth)/patient-login.tsx` (line 257)
- **Fix:** Use useCallback.

### PERF-011: Inline onPress function
- **File:** `app/(auth)/patient-login.tsx` (line 280)
- **Fix:** Use useCallback.

### PERF-012: Inline onPress function
- **File:** `app/(auth)/patient-login.tsx` (line 349)
- **Fix:** Use useCallback.

### PERF-013: Inline onPress function
- **File:** `app/(auth)/patient-register.tsx` (line 368)
- **Fix:** Use useCallback.

### PERF-014: Inline onPress function
- **File:** `app/(auth)/patient-register.tsx` (line 382)
- **Fix:** Use useCallback.

### PERF-015: Inline onPress function
- **File:** `app/(auth)/patient-register.tsx` (line 398)
- **Fix:** Use useCallback.

### PERF-016: Inline onPress function
- **File:** `app/(auth)/patient-register.tsx` (line 573)
- **Fix:** Use useCallback.

### PERF-017: Inline onPress function
- **File:** `app/(auth)/patient-register.tsx` (line 590)
- **Fix:** Use useCallback.

### PERF-018: Inline onPress function
- **File:** `app/(auth)/patient-register.tsx` (line 598)
- **Fix:** Use useCallback.

### PERF-019: Inline onPress function
- **File:** `app/(auth)/patient-register.tsx` (line 619)
- **Fix:** Use useCallback.

### PERF-020: Inline onPress function
- **File:** `app/(auth)/patient-register.tsx` (line 627)
- **Fix:** Use useCallback.

### PERF-021: Inline onPress function
- **File:** `app/(auth)/patient-register.tsx` (line 648)
- **Fix:** Use useCallback.

### PERF-022: Inline onPress function
- **File:** `app/(auth)/patient-register.tsx` (line 657)
- **Fix:** Use useCallback.

### PERF-023: Inline onPress function
- **File:** `app/(auth)/reset-password-otp.tsx` (line 127)
- **Fix:** Use useCallback.

### PERF-024: Inline onPress function
- **File:** `app/(auth)/reset-password.tsx` (line 133)
- **Fix:** Use useCallback.

### PERF-025: Inline onPress function
- **File:** `app/(auth)/reset-password.tsx` (line 173)
- **Fix:** Use useCallback.

### PERF-026: Inline onPress function
- **File:** `app/(auth)/reset-password.tsx` (line 301)
- **Fix:** Use useCallback.

### PERF-027: Inline onPress function
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 371)
- **Fix:** Use useCallback.

### PERF-028: Inline onPress function
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 469)
- **Fix:** Use useCallback.

### PERF-029: Inline onPress function
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 480)
- **Fix:** Use useCallback.

### PERF-030: Inline onPress function
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 489)
- **Fix:** Use useCallback.

### PERF-031: Inline onPress function
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 515)
- **Fix:** Use useCallback.

### PERF-032: Inline onPress function
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 526)
- **Fix:** Use useCallback.

### PERF-033: Inline onPress function
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 548)
- **Fix:** Use useCallback.

### PERF-034: Inline onPress function
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 568)
- **Fix:** Use useCallback.

### PERF-035: Inline onPress function
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 587)
- **Fix:** Use useCallback.

### PERF-036: Inline onPress function
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 600)
- **Fix:** Use useCallback.

### PERF-037: Inline onPress function
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 613)
- **Fix:** Use useCallback.

### PERF-038: Inline onPress function
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 633)
- **Fix:** Use useCallback.

### PERF-039: Inline onPress function
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 646)
- **Fix:** Use useCallback.

### PERF-040: Inline onPress function
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 659)
- **Fix:** Use useCallback.

### PERF-041: Inline onPress function
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 678)
- **Fix:** Use useCallback.

### PERF-042: Inline onPress function
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 690)
- **Fix:** Use useCallback.

### PERF-043: Inline onPress function
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 703)
- **Fix:** Use useCallback.

### PERF-044: Inline onPress function
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 721)
- **Fix:** Use useCallback.

### PERF-045: Inline onPress function
- **File:** `app/(doctor-tabs)/dental.tsx` (line 390)
- **Fix:** Use useCallback.

### PERF-046: Inline onPress function
- **File:** `app/(doctor-tabs)/dental.tsx` (line 401)
- **Fix:** Use useCallback.

### PERF-047: Inline onPress function
- **File:** `app/(doctor-tabs)/dental.tsx` (line 412)
- **Fix:** Use useCallback.

### PERF-048: Inline onPress function
- **File:** `app/(doctor-tabs)/dental.tsx` (line 435)
- **Fix:** Use useCallback.

### PERF-049: Inline onPress function
- **File:** `app/(doctor-tabs)/dental.tsx` (line 479)
- **Fix:** Use useCallback.

### PERF-050: Inline onPress function
- **File:** `app/(doctor-tabs)/dental.tsx` (line 540)
- **Fix:** Use useCallback.

### PERF-051: Inline onPress function
- **File:** `app/(doctor-tabs)/dental.tsx` (line 550)
- **Fix:** Use useCallback.

### PERF-052: Inline onPress function
- **File:** `app/(doctor-tabs)/dental.tsx` (line 571)
- **Fix:** Use useCallback.

### PERF-053: Inline onPress function
- **File:** `app/(doctor-tabs)/dental.tsx` (line 612)
- **Fix:** Use useCallback.

### PERF-054: Inline onPress function
- **File:** `app/(doctor-tabs)/dental.tsx` (line 625)
- **Fix:** Use useCallback.

### PERF-055: Inline onPress function
- **File:** `app/(doctor-tabs)/dental.tsx` (line 643)
- **Fix:** Use useCallback.

### PERF-056: Inline onPress function
- **File:** `app/(doctor-tabs)/dental.tsx` (line 669)
- **Fix:** Use useCallback.

### PERF-057: Inline onPress function
- **File:** `app/(doctor-tabs)/dental.tsx` (line 705)
- **Fix:** Use useCallback.

### PERF-058: Inline onPress function
- **File:** `app/(doctor-tabs)/dental.tsx` (line 804)
- **Fix:** Use useCallback.

### PERF-059: Inline onPress function
- **File:** `app/(doctor-tabs)/dental.tsx` (line 814)
- **Fix:** Use useCallback.

### PERF-060: Inline onPress function
- **File:** `app/(doctor-tabs)/dental.tsx` (line 830)
- **Fix:** Use useCallback.

### PERF-061: Inline onPress function
- **File:** `app/(doctor-tabs)/finance.tsx` (line 341)
- **Fix:** Use useCallback.

### PERF-062: Inline onPress function
- **File:** `app/(doctor-tabs)/finance.tsx` (line 367)
- **Fix:** Use useCallback.

### PERF-063: Inline onPress function
- **File:** `app/(doctor-tabs)/finance.tsx` (line 429)
- **Fix:** Use useCallback.

### PERF-064: Inline onPress function
- **File:** `app/(doctor-tabs)/finance.tsx` (line 461)
- **Fix:** Use useCallback.

### PERF-065: Inline onPress function
- **File:** `app/(doctor-tabs)/finance.tsx` (line 498)
- **Fix:** Use useCallback.

### PERF-066: Inline onPress function
- **File:** `app/(doctor-tabs)/finance.tsx` (line 556)
- **Fix:** Use useCallback.

### PERF-067: Inline onPress function
- **File:** `app/(doctor-tabs)/finance.tsx` (line 565)
- **Fix:** Use useCallback.

### PERF-068: Inline onPress function
- **File:** `app/(doctor-tabs)/finance.tsx` (line 577)
- **Fix:** Use useCallback.

### PERF-069: Inline onPress function
- **File:** `app/(doctor-tabs)/finance.tsx` (line 616)
- **Fix:** Use useCallback.

### PERF-070: Inline onPress function
- **File:** `app/(doctor-tabs)/finance.tsx` (line 674)
- **Fix:** Use useCallback.

### PERF-071: Inline onPress function
- **File:** `app/(doctor-tabs)/index.tsx` (line 267)
- **Fix:** Use useCallback.

### PERF-072: Inline onPress function
- **File:** `app/(doctor-tabs)/index.tsx` (line 278)
- **Fix:** Use useCallback.

### PERF-073: Inline onPress function
- **File:** `app/(doctor-tabs)/index.tsx` (line 304)
- **Fix:** Use useCallback.

### PERF-074: Inline onPress function
- **File:** `app/(doctor-tabs)/index.tsx` (line 356)
- **Fix:** Use useCallback.

### PERF-075: Inline onPress function
- **File:** `app/(doctor-tabs)/index.tsx` (line 398)
- **Fix:** Use useCallback.

### PERF-076: Inline onPress function
- **File:** `app/(doctor-tabs)/index.tsx` (line 401)
- **Fix:** Use useCallback.

### PERF-077: Inline onPress function
- **File:** `app/(doctor-tabs)/index.tsx` (line 420)
- **Fix:** Use useCallback.

### PERF-078: Inline onPress function
- **File:** `app/(doctor-tabs)/index.tsx` (line 442)
- **Fix:** Use useCallback.

### PERF-079: Inline onPress function
- **File:** `app/(doctor-tabs)/index.tsx` (line 459)
- **Fix:** Use useCallback.

### PERF-080: Inline onPress function
- **File:** `app/(doctor-tabs)/index.tsx` (line 464)
- **Fix:** Use useCallback.

### PERF-081: Inline onPress function
- **File:** `app/(doctor-tabs)/index.tsx` (line 484)
- **Fix:** Use useCallback.

### PERF-082: Inline onPress function
- **File:** `app/(doctor-tabs)/medications.tsx` (line 357)
- **Fix:** Use useCallback.

### PERF-083: Inline onPress function
- **File:** `app/(doctor-tabs)/medications.tsx` (line 368)
- **Fix:** Use useCallback.

### PERF-084: Inline onPress function
- **File:** `app/(doctor-tabs)/medications.tsx` (line 379)
- **Fix:** Use useCallback.

### PERF-085: Inline onPress function
- **File:** `app/(doctor-tabs)/medications.tsx` (line 402)
- **Fix:** Use useCallback.

### PERF-086: Inline onPress function
- **File:** `app/(doctor-tabs)/medications.tsx` (line 449)
- **Fix:** Use useCallback.

### PERF-087: Inline onPress function
- **File:** `app/(doctor-tabs)/medications.tsx` (line 593)
- **Fix:** Use useCallback.

### PERF-088: Inline onPress function
- **File:** `app/(doctor-tabs)/medications.tsx` (line 603)
- **Fix:** Use useCallback.

### PERF-089: Inline onPress function
- **File:** `app/(doctor-tabs)/medications.tsx` (line 624)
- **Fix:** Use useCallback.

### PERF-090: Inline onPress function
- **File:** `app/(doctor-tabs)/medications.tsx` (line 665)
- **Fix:** Use useCallback.

### PERF-091: Inline onPress function
- **File:** `app/(doctor-tabs)/medications.tsx` (line 678)
- **Fix:** Use useCallback.

### PERF-092: Inline onPress function
- **File:** `app/(doctor-tabs)/medications.tsx` (line 696)
- **Fix:** Use useCallback.

### PERF-093: Inline onPress function
- **File:** `app/(doctor-tabs)/medications.tsx` (line 722)
- **Fix:** Use useCallback.

### PERF-094: Inline onPress function
- **File:** `app/(doctor-tabs)/medications.tsx` (line 757)
- **Fix:** Use useCallback.

### PERF-095: Inline onPress function
- **File:** `app/(doctor-tabs)/medications.tsx` (line 767)
- **Fix:** Use useCallback.

### PERF-096: Inline onPress function
- **File:** `app/(doctor-tabs)/medications.tsx` (line 783)
- **Fix:** Use useCallback.

### PERF-097: Inline onPress function
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 337)
- **Fix:** Use useCallback.

### PERF-098: Inline onPress function
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 351)
- **Fix:** Use useCallback.

### PERF-099: Inline onPress function
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 430)
- **Fix:** Use useCallback.

### PERF-100: Inline onPress function
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 459)
- **Fix:** Use useCallback.

### PERF-101: Inline onPress function
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 466)
- **Fix:** Use useCallback.

### PERF-102: Inline onPress function
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 353)
- **Fix:** Use useCallback.

### PERF-103: Inline onPress function
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 364)
- **Fix:** Use useCallback.

### PERF-104: Inline onPress function
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 375)
- **Fix:** Use useCallback.

### PERF-105: Inline onPress function
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 398)
- **Fix:** Use useCallback.

### PERF-106: Inline onPress function
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 577)
- **Fix:** Use useCallback.

### PERF-107: Inline onPress function
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 614)
- **Fix:** Use useCallback.

### PERF-108: Inline onPress function
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 624)
- **Fix:** Use useCallback.

### PERF-109: Inline onPress function
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 645)
- **Fix:** Use useCallback.

### PERF-110: Inline onPress function
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 686)
- **Fix:** Use useCallback.

### PERF-111: Inline onPress function
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 699)
- **Fix:** Use useCallback.

### PERF-112: Inline onPress function
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 717)
- **Fix:** Use useCallback.

### PERF-113: Inline onPress function
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 743)
- **Fix:** Use useCallback.

### PERF-114: Inline onPress function
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 778)
- **Fix:** Use useCallback.

### PERF-115: Inline onPress function
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 788)
- **Fix:** Use useCallback.

### PERF-116: Inline onPress function
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 804)
- **Fix:** Use useCallback.

### PERF-117: Inline onPress function
- **File:** `app/(doctor-tabs)/orders.tsx` (line 332)
- **Fix:** Use useCallback.

### PERF-118: Inline onPress function
- **File:** `app/(doctor-tabs)/orders.tsx` (line 343)
- **Fix:** Use useCallback.

### PERF-119: Inline onPress function
- **File:** `app/(doctor-tabs)/orders.tsx` (line 354)
- **Fix:** Use useCallback.

### PERF-120: Inline onPress function
- **File:** `app/(doctor-tabs)/orders.tsx` (line 377)
- **Fix:** Use useCallback.

### PERF-121: Inline onPress function
- **File:** `app/(doctor-tabs)/orders.tsx` (line 424)
- **Fix:** Use useCallback.

### PERF-122: Inline onPress function
- **File:** `app/(doctor-tabs)/orders.tsx` (line 496)
- **Fix:** Use useCallback.

### PERF-123: Inline onPress function
- **File:** `app/(doctor-tabs)/orders.tsx` (line 512)
- **Fix:** Use useCallback.

### PERF-124: Inline onPress function
- **File:** `app/(doctor-tabs)/orders.tsx` (line 583)
- **Fix:** Use useCallback.

### PERF-125: Inline onPress function
- **File:** `app/(doctor-tabs)/orders.tsx` (line 593)
- **Fix:** Use useCallback.

### PERF-126: Inline onPress function
- **File:** `app/(doctor-tabs)/orders.tsx` (line 614)
- **Fix:** Use useCallback.

### PERF-127: Inline onPress function
- **File:** `app/(doctor-tabs)/orders.tsx` (line 655)
- **Fix:** Use useCallback.

### PERF-128: Inline onPress function
- **File:** `app/(doctor-tabs)/orders.tsx` (line 668)
- **Fix:** Use useCallback.

### PERF-129: Inline onPress function
- **File:** `app/(doctor-tabs)/orders.tsx` (line 686)
- **Fix:** Use useCallback.

### PERF-130: Inline onPress function
- **File:** `app/(doctor-tabs)/orders.tsx` (line 712)
- **Fix:** Use useCallback.

### PERF-131: Inline onPress function
- **File:** `app/(doctor-tabs)/orders.tsx` (line 747)
- **Fix:** Use useCallback.

### PERF-132: Inline onPress function
- **File:** `app/(doctor-tabs)/orders.tsx` (line 757)
- **Fix:** Use useCallback.

### PERF-133: Inline onPress function
- **File:** `app/(doctor-tabs)/orders.tsx` (line 773)
- **Fix:** Use useCallback.

### PERF-134: Inline onPress function
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 325)
- **Fix:** Use useCallback.

### PERF-135: Inline onPress function
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 360)
- **Fix:** Use useCallback.

### PERF-136: Inline onPress function
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 396)
- **Fix:** Use useCallback.

### PERF-137: Inline onPress function
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 434)
- **Fix:** Use useCallback.

### PERF-138: Inline onPress function
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 439)
- **Fix:** Use useCallback.

### PERF-139: Inline onPress function
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 466)
- **Fix:** Use useCallback.

### PERF-140: Inline onPress function
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 507)
- **Fix:** Use useCallback.

### PERF-141: Inline onPress function
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 512)
- **Fix:** Use useCallback.

### PERF-142: Inline onPress function
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 539)
- **Fix:** Use useCallback.

### PERF-143: Inline onPress function
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 601)
- **Fix:** Use useCallback.

### PERF-144: Inline onPress function
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 609)
- **Fix:** Use useCallback.

### PERF-145: Inline onPress function
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 629)
- **Fix:** Use useCallback.

### PERF-146: Inline onPress function
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 660)
- **Fix:** Use useCallback.

### PERF-147: Inline onPress function
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 693)
- **Fix:** Use useCallback.

### PERF-148: Inline onPress function
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 745)
- **Fix:** Use useCallback.

### PERF-149: Inline onPress function
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 750)
- **Fix:** Use useCallback.

### PERF-150: Inline onPress function
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 805)
- **Fix:** Use useCallback.

### PERF-151: Inline onPress function
- **File:** `app/(doctor-tabs)/patient-appointments.tsx` (line 324)
- **Fix:** Use useCallback.

### PERF-152: Inline onPress function
- **File:** `app/(doctor-tabs)/patient-appointments.tsx` (line 371)
- **Fix:** Use useCallback.

### PERF-153: Inline onPress function
- **File:** `app/(doctor-tabs)/patients.tsx` (line 181)
- **Fix:** Use useCallback.

### PERF-154: Inline onPress function
- **File:** `app/(doctor-tabs)/patients.tsx` (line 214)
- **Fix:** Use useCallback.

### PERF-155: Inline onPress function
- **File:** `app/(doctor-tabs)/questions.tsx` (line 888)
- **Fix:** Use useCallback.

### PERF-156: Inline onPress function
- **File:** `app/(doctor-tabs)/questions.tsx` (line 907)
- **Fix:** Use useCallback.

### PERF-157: Inline onPress function
- **File:** `app/(doctor-tabs)/questions.tsx` (line 951)
- **Fix:** Use useCallback.

### PERF-158: Inline onPress function
- **File:** `app/(doctor-tabs)/questions.tsx` (line 988)
- **Fix:** Use useCallback.

### PERF-159: Inline onPress function
- **File:** `app/(doctor-tabs)/questions.tsx` (line 993)
- **Fix:** Use useCallback.

### PERF-160: Inline onPress function
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1013)
- **Fix:** Use useCallback.

### PERF-161: Inline onPress function
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1046)
- **Fix:** Use useCallback.

### PERF-162: Inline onPress function
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1131)
- **Fix:** Use useCallback.

### PERF-163: Inline onPress function
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1138)
- **Fix:** Use useCallback.

### PERF-164: Inline onPress function
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1157)
- **Fix:** Use useCallback.

### PERF-165: Inline onPress function
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1310)
- **Fix:** Use useCallback.

### PERF-166: Inline onPress function
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1318)
- **Fix:** Use useCallback.

### PERF-167: Inline onPress function
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1347)
- **Fix:** Use useCallback.

### PERF-168: Inline onPress function
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1393)
- **Fix:** Use useCallback.

### PERF-169: Inline onPress function
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1411)
- **Fix:** Use useCallback.

### PERF-170: Inline onPress function
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1438)
- **Fix:** Use useCallback.

### PERF-171: Inline onPress function
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1456)
- **Fix:** Use useCallback.

### PERF-172: Inline onPress function
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1472)
- **Fix:** Use useCallback.

### PERF-173: Inline onPress function
- **File:** `app/(doctor-tabs)/settings.tsx` (line 395)
- **Fix:** Use useCallback.

### PERF-174: Inline onPress function
- **File:** `app/(doctor-tabs)/settings.tsx` (line 410)
- **Fix:** Use useCallback.

### PERF-175: Inline onPress function
- **File:** `app/(doctor-tabs)/settings.tsx` (line 452)
- **Fix:** Use useCallback.

### PERF-176: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 991)
- **Fix:** Use useCallback.

### PERF-177: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1007)
- **Fix:** Use useCallback.

### PERF-178: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1113)
- **Fix:** Use useCallback.

### PERF-179: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1125)
- **Fix:** Use useCallback.

### PERF-180: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1170)
- **Fix:** Use useCallback.

### PERF-181: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1229)
- **Fix:** Use useCallback.

### PERF-182: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1235)
- **Fix:** Use useCallback.

### PERF-183: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1259)
- **Fix:** Use useCallback.

### PERF-184: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1294)
- **Fix:** Use useCallback.

### PERF-185: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1361)
- **Fix:** Use useCallback.

### PERF-186: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1367)
- **Fix:** Use useCallback.

### PERF-187: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1395)
- **Fix:** Use useCallback.

### PERF-188: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1516)
- **Fix:** Use useCallback.

### PERF-189: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1575)
- **Fix:** Use useCallback.

### PERF-190: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1613)
- **Fix:** Use useCallback.

### PERF-191: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1646)
- **Fix:** Use useCallback.

### PERF-192: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1679)
- **Fix:** Use useCallback.

### PERF-193: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1715)
- **Fix:** Use useCallback.

### PERF-194: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1748)
- **Fix:** Use useCallback.

### PERF-195: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1773)
- **Fix:** Use useCallback.

### PERF-196: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1811)
- **Fix:** Use useCallback.

### PERF-197: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1850)
- **Fix:** Use useCallback.

### PERF-198: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1894)
- **Fix:** Use useCallback.

### PERF-199: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1928)
- **Fix:** Use useCallback.

### PERF-200: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1966)
- **Fix:** Use useCallback.

### PERF-201: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2000)
- **Fix:** Use useCallback.

### PERF-202: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2038)
- **Fix:** Use useCallback.

### PERF-203: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2080)
- **Fix:** Use useCallback.

### PERF-204: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2115)
- **Fix:** Use useCallback.

### PERF-205: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2136)
- **Fix:** Use useCallback.

### PERF-206: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2176)
- **Fix:** Use useCallback.

### PERF-207: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2210)
- **Fix:** Use useCallback.

### PERF-208: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2248)
- **Fix:** Use useCallback.

### PERF-209: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2282)
- **Fix:** Use useCallback.

### PERF-210: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2321)
- **Fix:** Use useCallback.

### PERF-211: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2368)
- **Fix:** Use useCallback.

### PERF-212: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2380)
- **Fix:** Use useCallback.

### PERF-213: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2399)
- **Fix:** Use useCallback.

### PERF-214: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2453)
- **Fix:** Use useCallback.

### PERF-215: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2491)
- **Fix:** Use useCallback.

### PERF-216: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2505)
- **Fix:** Use useCallback.

### PERF-217: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2519)
- **Fix:** Use useCallback.

### PERF-218: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2540)
- **Fix:** Use useCallback.

### PERF-219: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2550)
- **Fix:** Use useCallback.

### PERF-220: Inline onPress function
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 2560)
- **Fix:** Use useCallback.

### PERF-221: Inline onPress function
- **File:** `app/(doctor-tabs)/vision.tsx` (line 362)
- **Fix:** Use useCallback.

### PERF-222: Inline onPress function
- **File:** `app/(doctor-tabs)/vision.tsx` (line 373)
- **Fix:** Use useCallback.

### PERF-223: Inline onPress function
- **File:** `app/(doctor-tabs)/vision.tsx` (line 384)
- **Fix:** Use useCallback.

### PERF-224: Inline onPress function
- **File:** `app/(doctor-tabs)/vision.tsx` (line 407)
- **Fix:** Use useCallback.

### PERF-225: Inline onPress function
- **File:** `app/(doctor-tabs)/vision.tsx` (line 531)
- **Fix:** Use useCallback.

### PERF-226: Inline onPress function
- **File:** `app/(doctor-tabs)/vision.tsx` (line 631)
- **Fix:** Use useCallback.

### PERF-227: Inline onPress function
- **File:** `app/(doctor-tabs)/vision.tsx` (line 701)
- **Fix:** Use useCallback.

### PERF-228: Inline onPress function
- **File:** `app/(doctor-tabs)/vision.tsx` (line 711)
- **Fix:** Use useCallback.

### PERF-229: Inline onPress function
- **File:** `app/(doctor-tabs)/vision.tsx` (line 732)
- **Fix:** Use useCallback.

### PERF-230: Inline onPress function
- **File:** `app/(doctor-tabs)/vision.tsx` (line 773)
- **Fix:** Use useCallback.

### PERF-231: Inline onPress function
- **File:** `app/(doctor-tabs)/vision.tsx` (line 786)
- **Fix:** Use useCallback.

### PERF-232: Inline onPress function
- **File:** `app/(doctor-tabs)/vision.tsx` (line 804)
- **Fix:** Use useCallback.

### PERF-233: Inline onPress function
- **File:** `app/(doctor-tabs)/vision.tsx` (line 830)
- **Fix:** Use useCallback.

### PERF-234: Inline onPress function
- **File:** `app/(doctor-tabs)/vision.tsx` (line 865)
- **Fix:** Use useCallback.

### PERF-235: Inline onPress function
- **File:** `app/(doctor-tabs)/vision.tsx` (line 875)
- **Fix:** Use useCallback.

### PERF-236: Inline onPress function
- **File:** `app/(doctor-tabs)/vision.tsx` (line 891)
- **Fix:** Use useCallback.

### PERF-237: Inline onPress function
- **File:** `app/(tabs)/appointments.tsx` (line 357)
- **Fix:** Use useCallback.

### PERF-238: Inline onPress function
- **File:** `app/(tabs)/appointments.tsx` (line 465)
- **Fix:** Use useCallback.

### PERF-239: Inline onPress function
- **File:** `app/(tabs)/appointments.tsx` (line 491)
- **Fix:** Use useCallback.

### PERF-240: Inline onPress function
- **File:** `app/(tabs)/appointments.tsx` (line 498)
- **Fix:** Use useCallback.

### PERF-241: Inline onPress function
- **File:** `app/(tabs)/appointments.tsx` (line 515)
- **Fix:** Use useCallback.

### PERF-242: Inline onPress function
- **File:** `app/(tabs)/appointments.tsx` (line 555)
- **Fix:** Use useCallback.

### PERF-243: Inline onPress function
- **File:** `app/(tabs)/appointments.tsx` (line 572)
- **Fix:** Use useCallback.

### PERF-244: Inline onPress function
- **File:** `app/(tabs)/appointments.tsx` (line 597)
- **Fix:** Use useCallback.

### PERF-245: Inline onPress function
- **File:** `app/(tabs)/appointments.tsx` (line 624)
- **Fix:** Use useCallback.

### PERF-246: Inline onPress function
- **File:** `app/(tabs)/appointments.tsx` (line 646)
- **Fix:** Use useCallback.

### PERF-247: Inline onPress function
- **File:** `app/(tabs)/appointments.tsx` (line 672)
- **Fix:** Use useCallback.

### PERF-248: Inline onPress function
- **File:** `app/(tabs)/appointments.tsx` (line 692)
- **Fix:** Use useCallback.

### PERF-249: Inline onPress function
- **File:** `app/(tabs)/dental.tsx` (line 322)
- **Fix:** Use useCallback.

### PERF-250: Inline onPress function
- **File:** `app/(tabs)/dental.tsx` (line 356)
- **Fix:** Use useCallback.

### PERF-251: Inline onPress function
- **File:** `app/(tabs)/dental.tsx` (line 398)
- **Fix:** Use useCallback.

### PERF-252: Inline onPress function
- **File:** `app/(tabs)/dental.tsx` (line 405)
- **Fix:** Use useCallback.

### PERF-253: Inline onPress function
- **File:** `app/(tabs)/dental.tsx` (line 416)
- **Fix:** Use useCallback.

### PERF-254: Inline onPress function
- **File:** `app/(tabs)/dental.tsx` (line 439)
- **Fix:** Use useCallback.

### PERF-255: Inline onPress function
- **File:** `app/(tabs)/dental.tsx` (line 452)
- **Fix:** Use useCallback.

### PERF-256: Inline onPress function
- **File:** `app/(tabs)/dental.tsx` (line 469)
- **Fix:** Use useCallback.

### PERF-257: Inline onPress function
- **File:** `app/(tabs)/dental.tsx` (line 487)
- **Fix:** Use useCallback.

### PERF-258: Inline onPress function
- **File:** `app/(tabs)/dental.tsx` (line 500)
- **Fix:** Use useCallback.

### PERF-259: Inline onPress function
- **File:** `app/(tabs)/dental.tsx` (line 520)
- **Fix:** Use useCallback.

### PERF-260: Inline onPress function
- **File:** `app/(tabs)/doctor-responses.tsx` (line 340)
- **Fix:** Use useCallback.

### PERF-261: Inline onPress function
- **File:** `app/(tabs)/doctor-responses.tsx` (line 344)
- **Fix:** Use useCallback.

### PERF-262: Inline onPress function
- **File:** `app/(tabs)/doctor-responses.tsx` (line 353)
- **Fix:** Use useCallback.

### PERF-263: Inline onPress function
- **File:** `app/(tabs)/doctor-responses.tsx` (line 362)
- **Fix:** Use useCallback.

### PERF-264: Inline onPress function
- **File:** `app/(tabs)/doctor-responses.tsx` (line 370)
- **Fix:** Use useCallback.

### PERF-265: Inline onPress function
- **File:** `app/(tabs)/doctor-responses.tsx` (line 396)
- **Fix:** Use useCallback.

### PERF-266: Inline onPress function
- **File:** `app/(tabs)/doctor-responses.tsx` (line 437)
- **Fix:** Use useCallback.

### PERF-267: Inline onPress function
- **File:** `app/(tabs)/doctor-responses.tsx` (line 490)
- **Fix:** Use useCallback.

### PERF-268: Inline onPress function
- **File:** `app/(tabs)/doctor-responses.tsx` (line 516)
- **Fix:** Use useCallback.

### PERF-269: Inline onPress function
- **File:** `app/(tabs)/doctor-responses.tsx` (line 568)
- **Fix:** Use useCallback.

### PERF-270: Inline onPress function
- **File:** `app/(tabs)/doctor-responses.tsx` (line 574)
- **Fix:** Use useCallback.

### PERF-271: Inline onPress function
- **File:** `app/(tabs)/doctor-responses.tsx` (line 597)
- **Fix:** Use useCallback.

### PERF-272: Inline onPress function
- **File:** `app/(tabs)/doctor-responses.tsx` (line 611)
- **Fix:** Use useCallback.

### PERF-273: Inline onPress function
- **File:** `app/(tabs)/doctors.tsx` (line 199)
- **Fix:** Use useCallback.

### PERF-274: Inline onPress function
- **File:** `app/(tabs)/doctors.tsx` (line 204)
- **Fix:** Use useCallback.

### PERF-275: Inline onPress function
- **File:** `app/(tabs)/doctors.tsx` (line 221)
- **Fix:** Use useCallback.

### PERF-276: Inline onPress function
- **File:** `app/(tabs)/doctors.tsx` (line 227)
- **Fix:** Use useCallback.

### PERF-277: Inline onPress function
- **File:** `app/(tabs)/doctors.tsx` (line 237)
- **Fix:** Use useCallback.

### PERF-278: Inline onPress function
- **File:** `app/(tabs)/doctors.tsx` (line 306)
- **Fix:** Use useCallback.

### PERF-279: Inline onPress function
- **File:** `app/(tabs)/doctors.tsx` (line 341)
- **Fix:** Use useCallback.

### PERF-280: Inline onPress function
- **File:** `app/(tabs)/doctors.tsx` (line 350)
- **Fix:** Use useCallback.

### PERF-281: Inline onPress function
- **File:** `app/(tabs)/doctors.tsx` (line 374)
- **Fix:** Use useCallback.

### PERF-282: Inline onPress function
- **File:** `app/(tabs)/index.tsx` (line 357)
- **Fix:** Use useCallback.

### PERF-283: Inline onPress function
- **File:** `app/(tabs)/index.tsx` (line 371)
- **Fix:** Use useCallback.

### PERF-284: Inline onPress function
- **File:** `app/(tabs)/index.tsx` (line 407)
- **Fix:** Use useCallback.

### PERF-285: Inline onPress function
- **File:** `app/(tabs)/index.tsx` (line 451)
- **Fix:** Use useCallback.

### PERF-286: Inline onPress function
- **File:** `app/(tabs)/index.tsx` (line 485)
- **Fix:** Use useCallback.

### PERF-287: Inline onPress function
- **File:** `app/(tabs)/index.tsx` (line 500)
- **Fix:** Use useCallback.

### PERF-288: Inline onPress function
- **File:** `app/(tabs)/index.tsx` (line 516)
- **Fix:** Use useCallback.

### PERF-289: Inline onPress function
- **File:** `app/(tabs)/invoices.tsx` (line 313)
- **Fix:** Use useCallback.

### PERF-290: Inline onPress function
- **File:** `app/(tabs)/invoices.tsx` (line 334)
- **Fix:** Use useCallback.

### PERF-291: Inline onPress function
- **File:** `app/(tabs)/invoices.tsx` (line 357)
- **Fix:** Use useCallback.

### PERF-292: Inline onPress function
- **File:** `app/(tabs)/invoices.tsx` (line 384)
- **Fix:** Use useCallback.

### PERF-293: Inline onPress function
- **File:** `app/(tabs)/invoices.tsx` (line 414)
- **Fix:** Use useCallback.

### PERF-294: Inline onPress function
- **File:** `app/(tabs)/invoices.tsx` (line 483)
- **Fix:** Use useCallback.

### PERF-295: Inline onPress function
- **File:** `app/(tabs)/invoices.tsx` (line 490)
- **Fix:** Use useCallback.

### PERF-296: Inline onPress function
- **File:** `app/(tabs)/invoices.tsx` (line 507)
- **Fix:** Use useCallback.

### PERF-297: Inline onPress function
- **File:** `app/(tabs)/invoices.tsx` (line 533)
- **Fix:** Use useCallback.

### PERF-298: Inline onPress function
- **File:** `app/(tabs)/invoices.tsx` (line 546)
- **Fix:** Use useCallback.

### PERF-299: Inline onPress function
- **File:** `app/(tabs)/invoices.tsx` (line 563)
- **Fix:** Use useCallback.

### PERF-300: Inline onPress function
- **File:** `app/(tabs)/invoices.tsx` (line 581)
- **Fix:** Use useCallback.

### PERF-301: Inline onPress function
- **File:** `app/(tabs)/invoices.tsx` (line 596)
- **Fix:** Use useCallback.

### PERF-302: Inline onPress function
- **File:** `app/(tabs)/invoices.tsx` (line 613)
- **Fix:** Use useCallback.

### PERF-303: Inline onPress function
- **File:** `app/(tabs)/invoices.tsx` (line 626)
- **Fix:** Use useCallback.

### PERF-304: Inline onPress function
- **File:** `app/(tabs)/invoices.tsx` (line 642)
- **Fix:** Use useCallback.

### PERF-305: Inline onPress function
- **File:** `app/(tabs)/invoices.tsx` (line 649)
- **Fix:** Use useCallback.

### PERF-306: Inline onPress function
- **File:** `app/(tabs)/nutrition.tsx` (line 235)
- **Fix:** Use useCallback.

### PERF-307: Inline onPress function
- **File:** `app/(tabs)/nutrition.tsx` (line 258)
- **Fix:** Use useCallback.

### PERF-308: Inline onPress function
- **File:** `app/(tabs)/nutrition.tsx` (line 273)
- **Fix:** Use useCallback.

### PERF-309: Inline onPress function
- **File:** `app/(tabs)/nutrition.tsx` (line 297)
- **Fix:** Use useCallback.

### PERF-310: Inline onPress function
- **File:** `app/(tabs)/nutrition.tsx` (line 310)
- **Fix:** Use useCallback.

### PERF-311: Inline onPress function
- **File:** `app/(tabs)/nutrition.tsx` (line 327)
- **Fix:** Use useCallback.

### PERF-312: Inline onPress function
- **File:** `app/(tabs)/nutrition.tsx` (line 345)
- **Fix:** Use useCallback.

### PERF-313: Inline onPress function
- **File:** `app/(tabs)/nutrition.tsx` (line 358)
- **Fix:** Use useCallback.

### PERF-314: Inline onPress function
- **File:** `app/(tabs)/nutrition.tsx` (line 517)
- **Fix:** Use useCallback.

### PERF-315: Inline onPress function
- **File:** `app/(tabs)/orders.tsx` (line 257)
- **Fix:** Use useCallback.

### PERF-316: Inline onPress function
- **File:** `app/(tabs)/orders.tsx` (line 265)
- **Fix:** Use useCallback.

### PERF-317: Inline onPress function
- **File:** `app/(tabs)/orders.tsx` (line 368)
- **Fix:** Use useCallback.

### PERF-318: Inline onPress function
- **File:** `app/(tabs)/orders.tsx` (line 381)
- **Fix:** Use useCallback.

### PERF-319: Inline onPress function
- **File:** `app/(tabs)/orders.tsx` (line 407)
- **Fix:** Use useCallback.

### PERF-320: Inline onPress function
- **File:** `app/(tabs)/orders.tsx` (line 414)
- **Fix:** Use useCallback.

### PERF-321: Inline onPress function
- **File:** `app/(tabs)/orders.tsx` (line 430)
- **Fix:** Use useCallback.

### PERF-322: Inline onPress function
- **File:** `app/(tabs)/orders.tsx` (line 465)
- **Fix:** Use useCallback.

### PERF-323: Inline onPress function
- **File:** `app/(tabs)/orders.tsx` (line 482)
- **Fix:** Use useCallback.

### PERF-324: Inline onPress function
- **File:** `app/(tabs)/orders.tsx` (line 512)
- **Fix:** Use useCallback.

### PERF-325: Inline onPress function
- **File:** `app/(tabs)/orders.tsx` (line 538)
- **Fix:** Use useCallback.

### PERF-326: Inline onPress function
- **File:** `app/(tabs)/orders.tsx` (line 558)
- **Fix:** Use useCallback.

### PERF-327: Inline onPress function
- **File:** `app/(tabs)/packages.tsx` (line 127)
- **Fix:** Use useCallback.

### PERF-328: Inline onPress function
- **File:** `app/(tabs)/packages.tsx` (line 132)
- **Fix:** Use useCallback.

### PERF-329: Inline onPress function
- **File:** `app/(tabs)/packages.tsx` (line 144)
- **Fix:** Use useCallback.

### PERF-330: Inline onPress function
- **File:** `app/(tabs)/packages.tsx` (line 151)
- **Fix:** Use useCallback.

### PERF-331: Inline onPress function
- **File:** `app/(tabs)/packages.tsx` (line 164)
- **Fix:** Use useCallback.

### PERF-332: Inline onPress function
- **File:** `app/(tabs)/packages.tsx` (line 214)
- **Fix:** Use useCallback.

### PERF-333: Inline onPress function
- **File:** `app/(tabs)/prescriptions.tsx` (line 298)
- **Fix:** Use useCallback.

### PERF-334: Inline onPress function
- **File:** `app/(tabs)/prescriptions.tsx` (line 306)
- **Fix:** Use useCallback.

### PERF-335: Inline onPress function
- **File:** `app/(tabs)/prescriptions.tsx` (line 396)
- **Fix:** Use useCallback.

### PERF-336: Inline onPress function
- **File:** `app/(tabs)/prescriptions.tsx` (line 485)
- **Fix:** Use useCallback.

### PERF-337: Inline onPress function
- **File:** `app/(tabs)/prescriptions.tsx` (line 492)
- **Fix:** Use useCallback.

### PERF-338: Inline onPress function
- **File:** `app/(tabs)/prescriptions.tsx` (line 508)
- **Fix:** Use useCallback.

### PERF-339: Inline onPress function
- **File:** `app/(tabs)/prescriptions.tsx` (line 543)
- **Fix:** Use useCallback.

### PERF-340: Inline onPress function
- **File:** `app/(tabs)/prescriptions.tsx` (line 560)
- **Fix:** Use useCallback.

### PERF-341: Inline onPress function
- **File:** `app/(tabs)/prescriptions.tsx` (line 590)
- **Fix:** Use useCallback.

### PERF-342: Inline onPress function
- **File:** `app/(tabs)/prescriptions.tsx` (line 616)
- **Fix:** Use useCallback.

### PERF-343: Inline onPress function
- **File:** `app/(tabs)/prescriptions.tsx` (line 636)
- **Fix:** Use useCallback.

### PERF-344: Inline onPress function
- **File:** `app/(tabs)/profile.tsx` (line 714)
- **Fix:** Use useCallback.

### PERF-345: Inline onPress function
- **File:** `app/(tabs)/profile.tsx` (line 728)
- **Fix:** Use useCallback.

### PERF-346: Inline onPress function
- **File:** `app/(tabs)/profile.tsx` (line 786)
- **Fix:** Use useCallback.

### PERF-347: Inline onPress function
- **File:** `app/(tabs)/profile.tsx` (line 796)
- **Fix:** Use useCallback.

### PERF-348: Inline onPress function
- **File:** `app/(tabs)/profile.tsx` (line 812)
- **Fix:** Use useCallback.

### PERF-349: Inline onPress function
- **File:** `app/(tabs)/profile.tsx` (line 822)
- **Fix:** Use useCallback.

### PERF-350: Inline onPress function
- **File:** `app/(tabs)/settings.tsx` (line 398)
- **Fix:** Use useCallback.

### PERF-351: Inline onPress function
- **File:** `app/(tabs)/settings.tsx` (line 457)
- **Fix:** Use useCallback.

### PERF-352: Inline onPress function
- **File:** `app/(tabs)/settings.tsx` (line 496)
- **Fix:** Use useCallback.

### PERF-353: Inline onPress function
- **File:** `app/(tabs)/settings.tsx` (line 516)
- **Fix:** Use useCallback.

### PERF-354: Inline onPress function
- **File:** `app/(tabs)/settings.tsx` (line 531)
- **Fix:** Use useCallback.

### PERF-355: Inline onPress function
- **File:** `app/(tabs)/settings.tsx` (line 570)
- **Fix:** Use useCallback.

### PERF-356: Inline onPress function
- **File:** `app/(tabs)/settings.tsx` (line 584)
- **Fix:** Use useCallback.

### PERF-357: Inline onPress function
- **File:** `app/(tabs)/settings.tsx` (line 652)
- **Fix:** Use useCallback.

### PERF-358: Inline onPress function
- **File:** `app/(tabs)/settings.tsx` (line 694)
- **Fix:** Use useCallback.

### PERF-359: Inline onPress function
- **File:** `app/(tabs)/statement.tsx` (line 153)
- **Fix:** Use useCallback.

### PERF-360: Inline onPress function
- **File:** `app/(tabs)/statement.tsx` (line 174)
- **Fix:** Use useCallback.

### PERF-361: Inline onPress function
- **File:** `app/(tabs)/statement.tsx` (line 203)
- **Fix:** Use useCallback.

### PERF-362: Inline onPress function
- **File:** `app/(tabs)/statement.tsx` (line 280)
- **Fix:** Use useCallback.

### PERF-363: Inline onPress function
- **File:** `app/(tabs)/statement.tsx` (line 385)
- **Fix:** Use useCallback.

### PERF-364: Inline onPress function
- **File:** `app/(tabs)/statement.tsx` (line 392)
- **Fix:** Use useCallback.

### PERF-365: Inline onPress function
- **File:** `app/(tabs)/statement.tsx` (line 403)
- **Fix:** Use useCallback.

### PERF-366: Inline onPress function
- **File:** `app/(tabs)/statement.tsx` (line 426)
- **Fix:** Use useCallback.

### PERF-367: Inline onPress function
- **File:** `app/(tabs)/statement.tsx` (line 439)
- **Fix:** Use useCallback.

### PERF-368: Inline onPress function
- **File:** `app/(tabs)/statement.tsx` (line 454)
- **Fix:** Use useCallback.

### PERF-369: Inline onPress function
- **File:** `app/(tabs)/vision.tsx` (line 335)
- **Fix:** Use useCallback.

### PERF-370: Inline onPress function
- **File:** `app/(tabs)/vision.tsx` (line 343)
- **Fix:** Use useCallback.

### PERF-371: Inline onPress function
- **File:** `app/(tabs)/vision.tsx` (line 504)
- **Fix:** Use useCallback.

### PERF-372: Inline onPress function
- **File:** `app/(tabs)/vision.tsx` (line 536)
- **Fix:** Use useCallback.

### PERF-373: Inline onPress function
- **File:** `app/(tabs)/vision.tsx` (line 543)
- **Fix:** Use useCallback.

### PERF-374: Inline onPress function
- **File:** `app/(tabs)/vision.tsx` (line 554)
- **Fix:** Use useCallback.

### PERF-375: Inline onPress function
- **File:** `app/(tabs)/vision.tsx` (line 577)
- **Fix:** Use useCallback.

### PERF-376: Inline onPress function
- **File:** `app/(tabs)/vision.tsx` (line 590)
- **Fix:** Use useCallback.

### PERF-377: Inline onPress function
- **File:** `app/(tabs)/vision.tsx` (line 610)
- **Fix:** Use useCallback.

### PERF-378: Inline onPress function
- **File:** `app/(tabs)/vision.tsx` (line 628)
- **Fix:** Use useCallback.

### PERF-379: Inline onPress function
- **File:** `app/(tabs)/vision.tsx` (line 641)
- **Fix:** Use useCallback.

### PERF-380: Inline onPress function
- **File:** `app/(tabs)/visit-history.tsx` (line 408)
- **Fix:** Use useCallback.

### PERF-381: Inline onPress function
- **File:** `app/(tabs)/visit-history.tsx` (line 435)
- **Fix:** Use useCallback.

### PERF-382: Inline onPress function
- **File:** `app/(tabs)/visit-history.tsx` (line 463)
- **Fix:** Use useCallback.

### PERF-383: Inline onPress function
- **File:** `app/(tabs)/visit-history.tsx` (line 502)
- **Fix:** Use useCallback.

### PERF-384: Inline onPress function
- **File:** `app/(tabs)/visit-history.tsx` (line 507)
- **Fix:** Use useCallback.

### PERF-385: Inline onPress function
- **File:** `app/(tabs)/visit-history.tsx` (line 512)
- **Fix:** Use useCallback.

### PERF-386: Inline onPress function
- **File:** `app/(tabs)/visit-history.tsx` (line 526)
- **Fix:** Use useCallback.

### PERF-387: Inline onPress function
- **File:** `app/book-appointment.tsx` (line 407)
- **Fix:** Use useCallback.

### PERF-388: Inline onPress function
- **File:** `app/book-appointment.tsx` (line 465)
- **Fix:** Use useCallback.

### PERF-389: Inline onPress function
- **File:** `app/book-appointment.tsx` (line 686)
- **Fix:** Use useCallback.

### PERF-390: Inline onPress function
- **File:** `app/book-appointment.tsx` (line 746)
- **Fix:** Use useCallback.

### PERF-391: Inline onPress function
- **File:** `app/book-appointment.tsx` (line 774)
- **Fix:** Use useCallback.

### PERF-392: Inline onPress function
- **File:** `app/debug-token.tsx` (line 164)
- **Fix:** Use useCallback.

### PERF-393: Inline onPress function
- **File:** `app/device-token-debug.tsx` (line 148)
- **Fix:** Use useCallback.

### PERF-394: Inline onPress function
- **File:** `app/edit-profile.tsx` (line 458)
- **Fix:** Use useCallback.

### PERF-395: Inline onPress function
- **File:** `app/edit-profile.tsx` (line 615)
- **Fix:** Use useCallback.

### PERF-396: Inline onPress function
- **File:** `app/edit-profile.tsx` (line 631)
- **Fix:** Use useCallback.

### PERF-397: Inline onPress function
- **File:** `app/edit-profile.tsx` (line 689)
- **Fix:** Use useCallback.

### PERF-398: Inline onPress function
- **File:** `app/edit-profile.tsx` (line 700)
- **Fix:** Use useCallback.

### PERF-399: Inline onPress function
- **File:** `app/edit-profile.tsx` (line 716)
- **Fix:** Use useCallback.

### PERF-400: Inline onPress function
- **File:** `app/edit-profile.tsx` (line 727)
- **Fix:** Use useCallback.

### PERF-401: Inline onPress function
- **File:** `app/help-center.tsx` (line 123)
- **Fix:** Use useCallback.

### PERF-402: Inline onPress function
- **File:** `app/help-center.tsx` (line 154)
- **Fix:** Use useCallback.

### PERF-403: Inline onPress function
- **File:** `app/help-center.tsx` (line 190)
- **Fix:** Use useCallback.

### PERF-404: Inline onPress function
- **File:** `app/notifications.tsx` (line 286)
- **Fix:** Use useCallback.

### PERF-405: Inline onPress function
- **File:** `app/notifications.tsx` (line 300)
- **Fix:** Use useCallback.

### PERF-406: Inline onPress function
- **File:** `app/notifications.tsx` (line 360)
- **Fix:** Use useCallback.

### PERF-407: Inline onPress function
- **File:** `app/package-detail.tsx` (line 93)
- **Fix:** Use useCallback.

### PERF-408: Inline onPress function
- **File:** `app/payment-methods.tsx` (line 334)
- **Fix:** Use useCallback.

### PERF-409: Inline onPress function
- **File:** `app/payment-methods.tsx` (line 352)
- **Fix:** Use useCallback.

### PERF-410: Inline onPress function
- **File:** `app/payment-methods.tsx` (line 360)
- **Fix:** Use useCallback.

### PERF-411: Inline onPress function
- **File:** `app/payment-methods.tsx` (line 383)
- **Fix:** Use useCallback.

### PERF-412: Inline onPress function
- **File:** `app/payment-methods.tsx` (line 434)
- **Fix:** Use useCallback.

### PERF-413: Inline onPress function
- **File:** `app/payment-methods.tsx` (line 448)
- **Fix:** Use useCallback.

### PERF-414: Inline onPress function
- **File:** `app/payment-methods.tsx` (line 461)
- **Fix:** Use useCallback.

### PERF-415: Inline onPress function
- **File:** `app/payment-methods.tsx` (line 499)
- **Fix:** Use useCallback.

### PERF-416: Inline onPress function
- **File:** `app/payment-methods.tsx` (line 509)
- **Fix:** Use useCallback.

### PERF-417: Inline onPress function
- **File:** `app/test-device-token.tsx` (line 174)
- **Fix:** Use useCallback.

### PERF-418: Inline onPress function
- **File:** `app/test-fcm.tsx` (line 133)
- **Fix:** Use useCallback.

### PERF-419: Inline onPress function
- **File:** `app/test-fcm.tsx` (line 153)
- **Fix:** Use useCallback.

### PERF-420: Inline onPress function
- **File:** `app/test-fcm.tsx` (line 231)
- **Fix:** Use useCallback.

### PERF-421: Inline onPress function
- **File:** `components/CardScannerModal.tsx` (line 195)
- **Fix:** Use useCallback.

### PERF-422: Inline onPress function
- **File:** `components/FilterBottomSheet.tsx` (line 82)
- **Fix:** Use useCallback.

### PERF-423: Inline onPress function
- **File:** `components/FilterBottomSheet.tsx` (line 98)
- **Fix:** Use useCallback.

### PERF-424: Inline onPress function
- **File:** `components/FilterBottomSheet.tsx` (line 115)
- **Fix:** Use useCallback.

### PERF-425: Inline onPress function
- **File:** `components/FilterBottomSheet.tsx` (line 127)
- **Fix:** Use useCallback.

### PERF-426: Inline onPress function
- **File:** `components/FilterBottomSheet.tsx` (line 139)
- **Fix:** Use useCallback.

### PERF-427: Inline onPress function
- **File:** `components/FilterBottomSheet.tsx` (line 151)
- **Fix:** Use useCallback.

### PERF-428: Inline onPress function
- **File:** `components/FilterBottomSheet.tsx` (line 168)
- **Fix:** Use useCallback.

### PERF-429: Inline onPress function
- **File:** `components/FilterBottomSheet.tsx` (line 180)
- **Fix:** Use useCallback.

### PERF-430: Inline onPress function
- **File:** `components/FilterBottomSheet.tsx` (line 192)
- **Fix:** Use useCallback.

### PERF-431: Inline onPress function
- **File:** `components/FilterBottomSheet.tsx` (line 209)
- **Fix:** Use useCallback.

### PERF-432: Inline onPress function
- **File:** `components/FilterBottomSheet.tsx` (line 221)
- **Fix:** Use useCallback.

### PERF-433: Inline onPress function
- **File:** `components/FilterBottomSheet.tsx` (line 233)
- **Fix:** Use useCallback.

### PERF-434: Inline onPress function
- **File:** `components/FilterBottomSheet.tsx` (line 245)
- **Fix:** Use useCallback.

### PERF-435: Inline onPress function
- **File:** `components/FilterBottomSheet.tsx` (line 257)
- **Fix:** Use useCallback.

### PERF-436: Inline onPress function
- **File:** `components/FilterBottomSheet.tsx` (line 269)
- **Fix:** Use useCallback.

### PERF-437: Inline onPress function
- **File:** `components/ImageCaptcha.tsx` (line 240)
- **Fix:** Use useCallback.

### PERF-438: Inline onPress function
- **File:** `components/NotificationDetail.tsx` (line 184)
- **Fix:** Use useCallback.

### PERF-439: Inline onPress function
- **File:** `components/NotificationDetail.tsx` (line 198)
- **Fix:** Use useCallback.

---

## 📄 Affected Files (67)

- `app/(auth)/_layout.tsx`
- `app/(auth)/doctor-login.tsx`
- `app/(auth)/forgot-password.tsx`
- `app/(auth)/otp-verify.tsx`
- `app/(auth)/patient-login.tsx`
- `app/(auth)/patient-register.tsx`
- `app/(auth)/reset-password-otp.tsx`
- `app/(auth)/reset-password.tsx`
- `app/(doctor-tabs)/_layout.tsx`
- `app/(doctor-tabs)/appointments.tsx`
- `app/(doctor-tabs)/dental.tsx`
- `app/(doctor-tabs)/finance.tsx`
- `app/(doctor-tabs)/index.tsx`
- `app/(doctor-tabs)/medications.tsx`
- `app/(doctor-tabs)/notifications.tsx`
- `app/(doctor-tabs)/nutrition.tsx`
- `app/(doctor-tabs)/orders.tsx`
- `app/(doctor-tabs)/patient-answers.tsx`
- `app/(doctor-tabs)/patient-appointments.tsx`
- `app/(doctor-tabs)/patients.tsx`
- `app/(doctor-tabs)/questions.tsx`
- `app/(doctor-tabs)/settings.tsx`
- `app/(doctor-tabs)/time-management.tsx`
- `app/(doctor-tabs)/vision.tsx`
- `app/(tabs)/_layout.tsx`
- `app/(tabs)/appointments.tsx`
- `app/(tabs)/dental.tsx`
- `app/(tabs)/doctor-responses.tsx`
- `app/(tabs)/doctors.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/invoices.tsx`
- `app/(tabs)/nutrition.tsx`
- `app/(tabs)/orders.tsx`
- `app/(tabs)/packages.tsx`
- `app/(tabs)/prescriptions.tsx`
- `app/(tabs)/profile.tsx`
- `app/(tabs)/settings.tsx`
- `app/(tabs)/statement.tsx`
- `app/(tabs)/vision.tsx`
- `app/(tabs)/visit-history.tsx`
- `app/_layout.tsx`
- `app/book-appointment.tsx`
- `app/debug-token.tsx`
- `app/device-token-debug.tsx`
- `app/edit-profile.tsx`
- `app/help-center.tsx`
- `app/index.tsx`
- `app/notifications.tsx`
- `app/package-detail.tsx`
- `app/payment-methods.tsx`
- `app/test-device-token.tsx`
- `app/test-fcm.tsx`
- `components/BiometricAuthGate.tsx`
- `components/CardScannerModal.tsx`
- `components/ErrorBoundary.tsx`
- `components/FilterBottomSheet.tsx`
- `components/ImageCaptcha.tsx`
- `components/NotificationCard.tsx`
- `components/NotificationDetail.tsx`
- `contexts/AuthContext.tsx`
- `contexts/ThemeContext.tsx`
- `utils/auth.ts`
- `utils/config.ts`
- `utils/firebase.ts`
- `utils/notifications.ts`
- `utils/settingsService.ts`
- `utils/supabase.ts`

---

## ✅ Mobile Test Cases

- [ ] TC-001: Patient login with valid credentials succeeds and routes to patient tabs
- [ ] TC-002: Patient login with wrong password shows a clear error message
- [ ] TC-003: Doctor login routes to doctor-tabs dashboard correctly
- [ ] TC-004: Forgot password OTP delivered to registered email
- [ ] TC-005: OTP verification rejects incorrect and expired codes
- [ ] TC-006: Reset password accepts strong password, rejects weak ones
- [ ] TC-007: Session persists after cold app restart (token refresh via SecureStore)
- [ ] TC-008: Expired session redirects user to login screen
- [ ] TC-009: Logout clears SecureStore, AsyncStorage, and resets router to index
- [ ] TC-010: Biometric gate blocks access to protected tabs without auth
- [ ] TC-011: Patient can browse available doctors list with filters applied
- [ ] TC-012: Patient books appointment with open slot — slot becomes unavailable
- [ ] TC-013: Patient cannot book an already-taken slot
- [ ] TC-014: Doctor views appointment list for the day correctly
- [ ] TC-015: Doctor can mark an appointment as completed
- [ ] TC-016: Doctor time-management blocks create unavailability correctly
- [ ] TC-017: Registration form validates all required fields before submission
- [ ] TC-018: Duplicate email/phone registration shows a specific conflict error
- [ ] TC-019: Profile edit saves changes and reflects them in the UI immediately
- [ ] TC-020: Push notification arrives and navigates to correct screen on tap
- [ ] TC-021: FCM token stored and refreshed correctly after device restart
- [ ] TC-022: Notification badge count updates after reading notifications
- [ ] TC-023: App shows error UI when network is offline
- [ ] TC-024: App recovers gracefully after network reconnects
- [ ] TC-025: Large appointment list (50+ items) scrolls smoothly via FlatList
- [ ] TC-026: Android back button closes modals and navigates back correctly
- [ ] TC-027: Safe area insets render correctly on iPhone 14 Pro (notch)
- [ ] TC-028: Keyboard avoidance works in all form screens on Android and iOS
- [ ] TC-029: RLS policy blocks patient from reading another patient's appointments
- [ ] TC-030: Supabase realtime subscription updates appointment status live
- [ ] TC-031: Storage uploads complete and preview renders without layout shift
- [ ] TC-032: Vision / dental / nutrition / medication records load and filter correctly
- [ ] TC-033: QR / card scanner modal opens, scans, and closes cleanly
- [ ] TC-034: Dark mode and light mode render consistently across all screens

---

## Final Status

**🟠 AT RISK — High issues should be fixed before release**

> Report generated by Mobile QA Agent. Review all flagged items before release.  
> Last run: 06/13/2026, 07:28:31 PM
