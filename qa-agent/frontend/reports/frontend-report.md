# 🎨 Frontend QA Report — Maw3edak Mobile

**Generated:** 06/13/2026, 07:30:01 PM  
**UI Layer:** React Native / Expo Router  
**Scanned:** app, components (screens and components)  

---

## Summary

| Severity | Count |
|---|---|
| 🔴 Critical | **0** |
| 🟠 High | **32** |
| 🟡 Medium | **70** |
| 🔵 Low | **425** |
| 📄 Files Affected | **58** |

---

## 🔴 Critical Issues

_No issues found._

---

## 🟠 High Issues

### H-001: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(auth)/doctor-login.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-002: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(auth)/otp-verify.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-003: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(auth)/patient-register.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-004: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(auth)/reset-password-otp.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-005: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-006: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(doctor-tabs)/dental.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-007: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(doctor-tabs)/finance.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-008: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(doctor-tabs)/index.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-009: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(doctor-tabs)/medications.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-010: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-011: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-012: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(doctor-tabs)/orders.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-013: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-014: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(doctor-tabs)/patient-appointments.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-015: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(doctor-tabs)/patients.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-016: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-017: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-018: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(doctor-tabs)/vision.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-019: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(tabs)/doctors.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-020: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(tabs)/index.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-021: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(tabs)/packages.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-022: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(tabs)/profile.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-023: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/(tabs)/visit-history.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-024: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/book-appointment.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-025: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/debug-token.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-026: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/device-token-debug.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-027: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/edit-profile.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-028: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/help-center.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-029: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/notifications.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-030: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/package-detail.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-031: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/payment-methods.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

### H-032: ScrollView used for dynamic data list — use FlatList instead
- **File:** `app/test-device-token.tsx` (line 1)
- **Detail:** ScrollView renders all items into the DOM at once; no virtualization
- **Fix:** Replace `<ScrollView>` + `.map()` with `<FlatList data={items} renderItem={({item}) => ...} keyExtractor={...} />` for server-driven lists.

---

## 🟡 Medium Issues

### M-001: Screen with async data has no loading state
- **File:** `app/_layout.tsx` (line 1)
- **Detail:** Data-fetching code found but no loading/isLoading state variable detected
- **Fix:** Add `const [loading, setLoading] = useState(true)` and show an `<ActivityIndicator />` while loading.

### M-002: Large screen/component (493 lines)
- **File:** `app/(auth)/doctor-login.tsx` (line 1)
- **Detail:** 493 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-003: Screen with async data has no loading state
- **File:** `app/(auth)/otp-verify.tsx` (line 1)
- **Detail:** Data-fetching code found but no loading/isLoading state variable detected
- **Fix:** Add `const [loading, setLoading] = useState(true)` and show an `<ActivityIndicator />` while loading.

### M-004: Large screen/component (557 lines)
- **File:** `app/(auth)/patient-login.tsx` (line 1)
- **Detail:** 557 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-005: Large screen/component (944 lines)
- **File:** `app/(auth)/patient-register.tsx` (line 1)
- **Detail:** 944 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-006: Screen with async data has no loading state
- **File:** `app/(auth)/patient-register.tsx` (line 1)
- **Detail:** Data-fetching code found but no loading/isLoading state variable detected
- **Fix:** Add `const [loading, setLoading] = useState(true)` and show an `<ActivityIndicator />` while loading.

### M-007: Screen with async data has no loading state
- **File:** `app/(auth)/reset-password-otp.tsx` (line 1)
- **Detail:** Data-fetching code found but no loading/isLoading state variable detected
- **Fix:** Add `const [loading, setLoading] = useState(true)` and show an `<ActivityIndicator />` while loading.

### M-008: Large screen/component (486 lines)
- **File:** `app/(auth)/reset-password.tsx` (line 1)
- **Detail:** 486 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-009: Large screen/component (1033 lines)
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 1)
- **Detail:** 1033 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-010: Large screen/component (1189 lines)
- **File:** `app/(doctor-tabs)/dental.tsx` (line 1)
- **Detail:** 1189 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-011: Large screen/component (1441 lines)
- **File:** `app/(doctor-tabs)/finance.tsx` (line 1)
- **Detail:** 1441 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-012: .map() list missing key prop on root element
- **File:** `app/(doctor-tabs)/finance.tsx` (line 202)
- **Detail:** (data.transactions || []).map((tx: any) => ({
- **Fix:** Add `key={String(item.id)}` to the outermost JSX element returned inside `.map()` to fix React reconciliation.

### M-013: Large screen/component (836 lines)
- **File:** `app/(doctor-tabs)/index.tsx` (line 1)
- **Detail:** 836 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-014: Large screen/component (1104 lines)
- **File:** `app/(doctor-tabs)/medications.tsx` (line 1)
- **Detail:** 1104 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-015: Large screen/component (716 lines)
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 1)
- **Detail:** 716 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-016: .map() list missing key prop on root element
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 211)
- **Detail:** console.log('Current notifications before update:', notifications.map(n => ({ id: n.id, read: n.read
- **Fix:** Add `key={String(item.id)}` to the outermost JSX element returned inside `.map()` to fix React reconciliation.

### M-017: Large screen/component (1175 lines)
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 1)
- **Detail:** 1175 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-018: Large screen/component (1090 lines)
- **File:** `app/(doctor-tabs)/orders.tsx` (line 1)
- **Detail:** 1090 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-019: Large screen/component (1231 lines)
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 1)
- **Detail:** 1231 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-020: Large screen/component (502 lines)
- **File:** `app/(doctor-tabs)/patient-appointments.tsx` (line 1)
- **Detail:** 502 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-021: Large screen/component (2073 lines)
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1)
- **Detail:** 2073 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-022: .map() list missing key prop on root element
- **File:** `app/(doctor-tabs)/questions.tsx` (line 674)
- **Detail:** prev.map(q => ({
- **Fix:** Add `key={String(item.id)}` to the outermost JSX element returned inside `.map()` to fix React reconciliation.

### M-023: Large screen/component (608 lines)
- **File:** `app/(doctor-tabs)/settings.tsx` (line 1)
- **Detail:** 608 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-024: Large screen/component (3251 lines)
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1)
- **Detail:** 3251 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-025: 20 inline style={{ }} objects — causes re-renders on every render
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1)
- **Detail:** 20 occurrences of style={{ ... }} found
- **Fix:** Move all styles to a `StyleSheet.create({})` object at the bottom of the file. Inline objects are re-created each render.

### M-026: Large screen/component (1247 lines)
- **File:** `app/(doctor-tabs)/vision.tsx` (line 1)
- **Detail:** 1247 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-027: Large screen/component (1025 lines)
- **File:** `app/(tabs)/appointments.tsx` (line 1)
- **Detail:** 1025 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-028: .map() list missing key prop on root element
- **File:** `app/(tabs)/appointments.tsx` (line 536)
- **Detail:** ...doctors.map(d => ({ id: d.id, first_name: d.first_name, last_name: d.last_name, specialization: '
- **Fix:** Add `key={String(item.id)}` to the outermost JSX element returned inside `.map()` to fix React reconciliation.

### M-029: Large screen/component (1016 lines)
- **File:** `app/(tabs)/dental.tsx` (line 1)
- **Detail:** 1016 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-030: .map() list missing key prop on root element
- **File:** `app/(tabs)/dental.tsx` (line 423)
- **Detail:** const doctorItems = [{ id: '', name: 'All Doctors' }, ...doctors.map(d => ({ id: d.id, name: d.name 
- **Fix:** Add `key={String(item.id)}` to the outermost JSX element returned inside `.map()` to fix React reconciliation.

### M-031: Large screen/component (1077 lines)
- **File:** `app/(tabs)/doctor-responses.tsx` (line 1)
- **Detail:** 1077 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-032: .map() list missing key prop on root element
- **File:** `app/(tabs)/doctor-responses.tsx` (line 128)
- **Detail:** const responses = questions.map(q => ({
- **Fix:** Add `key={String(item.id)}` to the outermost JSX element returned inside `.map()` to fix React reconciliation.

### M-033: .map() list missing key prop on root element
- **File:** `app/(tabs)/doctor-responses.tsx` (line 307)
- **Detail:** .map(([doctorName, questionnaires]) => ({
- **Fix:** Add `key={String(item.id)}` to the outermost JSX element returned inside `.map()` to fix React reconciliation.

### M-034: .map() list missing key prop on root element
- **File:** `app/(tabs)/doctor-responses.tsx` (line 604)
- **Detail:** data={[{ name: 'all', label: 'All Doctors' }, ...uniqueDoctors.filter(d => d.toLowerCase().includes(
- **Fix:** Add `key={String(item.id)}` to the outermost JSX element returned inside `.map()` to fix React reconciliation.

### M-035: Large screen/component (626 lines)
- **File:** `app/(tabs)/doctors.tsx` (line 1)
- **Detail:** 626 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-036: Large screen/component (972 lines)
- **File:** `app/(tabs)/index.tsx` (line 1)
- **Detail:** 972 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-037: Large screen/component (1280 lines)
- **File:** `app/(tabs)/invoices.tsx` (line 1)
- **Detail:** 1280 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-038: .map() list missing key prop on root element
- **File:** `app/(tabs)/invoices.tsx` (line 517)
- **Detail:** const doctorItems = [{ id: '', name: 'All Doctors' }, ...doctors.map(d => ({ id: d.id, name: d.name 
- **Fix:** Add `key={String(item.id)}` to the outermost JSX element returned inside `.map()` to fix React reconciliation.

### M-039: Large screen/component (922 lines)
- **File:** `app/(tabs)/nutrition.tsx` (line 1)
- **Detail:** 922 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-040: Large screen/component (891 lines)
- **File:** `app/(tabs)/orders.tsx` (line 1)
- **Detail:** 891 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-041: .map() list missing key prop on root element
- **File:** `app/(tabs)/orders.tsx` (line 128)
- **Detail:** const formattedOrders = result.orders.map((order: any) => ({
- **Fix:** Add `key={String(item.id)}` to the outermost JSX element returned inside `.map()` to fix React reconciliation.

### M-042: .map() list missing key prop on root element
- **File:** `app/(tabs)/orders.tsx` (line 449)
- **Detail:** const doctorItems = [{ id: 'all', name: 'All Doctors', specialization: '' }, ...doctors.map(d => ({ 
- **Fix:** Add `key={String(item.id)}` to the outermost JSX element returned inside `.map()` to fix React reconciliation.

### M-043: Large screen/component (509 lines)
- **File:** `app/(tabs)/packages.tsx` (line 1)
- **Detail:** 509 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-044: Large screen/component (1024 lines)
- **File:** `app/(tabs)/prescriptions.tsx` (line 1)
- **Detail:** 1024 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-045: .map() list missing key prop on root element
- **File:** `app/(tabs)/prescriptions.tsx` (line 149)
- **Detail:** const formattedDoctors = doctorsData.doctors.map((doc: any) => ({
- **Fix:** Add `key={String(item.id)}` to the outermost JSX element returned inside `.map()` to fix React reconciliation.

### M-046: .map() list missing key prop on root element
- **File:** `app/(tabs)/prescriptions.tsx` (line 527)
- **Detail:** const doctorItems = [{ id: 'all', name: 'All Doctors', specialization: '' }, ...doctors.map(d => ({ 
- **Fix:** Add `key={String(item.id)}` to the outermost JSX element returned inside `.map()` to fix React reconciliation.

### M-047: Large screen/component (1058 lines)
- **File:** `app/(tabs)/profile.tsx` (line 1)
- **Detail:** 1058 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-048: Large screen/component (960 lines)
- **File:** `app/(tabs)/settings.tsx` (line 1)
- **Detail:** 960 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-049: Large screen/component (865 lines)
- **File:** `app/(tabs)/statement.tsx` (line 1)
- **Detail:** 865 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-050: Large screen/component (1082 lines)
- **File:** `app/(tabs)/vision.tsx` (line 1)
- **Detail:** 1082 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-051: .map() list missing key prop on root element
- **File:** `app/(tabs)/vision.tsx` (line 154)
- **Detail:** const formattedDoctors = doctorsData.doctors.map((doc: any) => ({
- **Fix:** Add `key={String(item.id)}` to the outermost JSX element returned inside `.map()` to fix React reconciliation.

### M-052: .map() list missing key prop on root element
- **File:** `app/(tabs)/vision.tsx` (line 561)
- **Detail:** const doctorItems = [{ id: 'all', name: 'All Doctors', specialization: '' }, ...doctors.map(d => ({ 
- **Fix:** Add `key={String(item.id)}` to the outermost JSX element returned inside `.map()` to fix React reconciliation.

### M-053: Large screen/component (682 lines)
- **File:** `app/(tabs)/visit-history.tsx` (line 1)
- **Detail:** 682 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-054: Large screen/component (1410 lines)
- **File:** `app/book-appointment.tsx` (line 1)
- **Detail:** 1410 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-055: Large screen/component (407 lines)
- **File:** `app/debug-token.tsx` (line 1)
- **Detail:** 407 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-056: Large screen/component (521 lines)
- **File:** `app/device-token-debug.tsx` (line 1)
- **Detail:** 521 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-057: Large screen/component (993 lines)
- **File:** `app/edit-profile.tsx` (line 1)
- **Detail:** 993 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-058: Large screen/component (372 lines)
- **File:** `app/help-center.tsx` (line 1)
- **Detail:** 372 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-059: Large screen/component (481 lines)
- **File:** `app/notifications.tsx` (line 1)
- **Detail:** 481 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-060: Large screen/component (382 lines)
- **File:** `app/package-detail.tsx` (line 1)
- **Detail:** 382 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-061: Large screen/component (914 lines)
- **File:** `app/payment-methods.tsx` (line 1)
- **Detail:** 914 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-062: .map() list missing key prop on root element
- **File:** `app/payment-methods.tsx` (line 209)
- **Detail:** setCards(prev => prev.map(c => ({ ...c, is_default: c.id === id })));
- **Fix:** Add `key={String(item.id)}` to the outermost JSX element returned inside `.map()` to fix React reconciliation.

### M-063: Screen with async data has no loading state
- **File:** `app/test-device-token.tsx` (line 1)
- **Detail:** Data-fetching code found but no loading/isLoading state variable detected
- **Fix:** Add `const [loading, setLoading] = useState(true)` and show an `<ActivityIndicator />` while loading.

### M-064: Large screen/component (400 lines)
- **File:** `app/test-fcm.tsx` (line 1)
- **Detail:** 400 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-065: Large screen/component (437 lines)
- **File:** `components/BiometricAuthGate.tsx` (line 1)
- **Detail:** 437 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-066: Large screen/component (482 lines)
- **File:** `components/CardScannerModal.tsx` (line 1)
- **Detail:** 482 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-067: Screen with async data has no loading state
- **File:** `components/CardScannerModal.tsx` (line 1)
- **Detail:** Data-fetching code found but no loading/isLoading state variable detected
- **Fix:** Add `const [loading, setLoading] = useState(true)` and show an `<ActivityIndicator />` while loading.

### M-068: Large screen/component (374 lines)
- **File:** `components/FilterBottomSheet.tsx` (line 1)
- **Detail:** 374 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-069: Large screen/component (406 lines)
- **File:** `components/ImageCaptcha.tsx` (line 1)
- **Detail:** 406 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

### M-070: Large screen/component (380 lines)
- **File:** `components/NotificationDetail.tsx` (line 1)
- **Detail:** 380 lines in a single file is difficult to review, test, and maintain
- **Fix:** Extract distinct UI sections into smaller sub-components and move data-fetching logic into a custom hook.

---

## 🔵 Low Issues

### L-001: console statement in UI file
- **File:** `app/_layout.tsx` (line 27)
- **Detail:** console.log('Initializing Firebase...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-002: console statement in UI file
- **File:** `app/_layout.tsx` (line 30)
- **Detail:** console.log('✅ Firebase initialized successfully');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-003: console statement in UI file
- **File:** `app/_layout.tsx` (line 43)
- **Detail:** console.log('App starting on platform:', Platform.OS);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-004: console statement in UI file
- **File:** `app/_layout.tsx` (line 44)
- **Detail:** console.log('Environment variables loaded:', {
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-005: console statement in UI file
- **File:** `app/_layout.tsx` (line 91)
- **Detail:** console.log('=== APP INITIALIZATION START ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-006: console statement in UI file
- **File:** `app/_layout.tsx` (line 92)
- **Detail:** console.log('Timestamp:', new Date().toISOString());
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-007: console statement in UI file
- **File:** `app/_layout.tsx` (line 103)
- **Detail:** console.log('Fonts loaded:', fontsLoaded);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-008: console statement in UI file
- **File:** `app/_layout.tsx` (line 104)
- **Detail:** console.log('Font error:', fontError);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-009: console statement in UI file
- **File:** `app/_layout.tsx` (line 109)
- **Detail:** console.log('Fonts ready immediately');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-010: console statement in UI file
- **File:** `app/_layout.tsx` (line 115)
- **Detail:** console.log('Fonts ready after check');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-011: console statement in UI file
- **File:** `app/_layout.tsx` (line 122)
- **Detail:** console.log('Font timeout - continuing anyway');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-012: console statement in UI file
- **File:** `app/_layout.tsx` (line 130)
- **Detail:** console.log(`App preparation completed in ${elapsed}ms`);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-013: console statement in UI file
- **File:** `app/_layout.tsx` (line 137)
- **Detail:** console.log('✓ Setting app ready');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-014: console statement in UI file
- **File:** `app/_layout.tsx` (line 140)
- **Detail:** .then(() => console.log('✓ Splash screen hidden'))
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-015: console statement in UI file
- **File:** `app/_layout.tsx` (line 147)
- **Detail:** console.log('Starting app initialization...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-016: console statement in UI file
- **File:** `app/_layout.tsx` (line 167)
- **Detail:** console.log('Setting up notification listeners...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-017: console statement in UI file
- **File:** `app/_layout.tsx` (line 170)
- **Detail:** console.log('Cleaning up notification listeners');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-018: console statement in UI file
- **File:** `app/_layout.tsx` (line 181)
- **Detail:** console.log('Root back handler triggered');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-019: console statement in UI file
- **File:** `app/_layout.tsx` (line 197)
- **Detail:** <BiometricAuthGate onAuthComplete={() => console.log('Biometric auth completed')
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-020: 35 hardcoded hex colors — breaks theme consistency
- **File:** `app/(auth)/doctor-login.tsx` (line 1)
- **Detail:** 35 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-021: console statement in UI file
- **File:** `app/(auth)/doctor-login.tsx` (line 52)
- **Detail:** console.log('Attempting doctor login with email:', email.trim());
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-022: console statement in UI file
- **File:** `app/(auth)/doctor-login.tsx` (line 59)
- **Detail:** console.log('Initializing Firebase for notifications...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-023: console statement in UI file
- **File:** `app/(auth)/doctor-login.tsx` (line 62)
- **Detail:** console.log('Getting FCM token...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-024: console statement in UI file
- **File:** `app/(auth)/doctor-login.tsx` (line 64)
- **Detail:** console.log('FCM token obtained:', tokenToUse ? 'Yes' : 'No');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-025: console statement in UI file
- **File:** `app/(auth)/doctor-login.tsx` (line 100)
- **Detail:** console.log('Response status:', response.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-026: console statement in UI file
- **File:** `app/(auth)/doctor-login.tsx` (line 102)
- **Detail:** console.log('Response data:', data);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-027: console statement in UI file
- **File:** `app/(auth)/doctor-login.tsx` (line 105)
- **Detail:** console.log('=== MULTIPLE CLINICS FOUND ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-028: console statement in UI file
- **File:** `app/(auth)/doctor-login.tsx` (line 106)
- **Detail:** console.log('Number of clinics:', data.companies.length);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-029: console statement in UI file
- **File:** `app/(auth)/doctor-login.tsx` (line 114)
- **Detail:** console.log('=== DOCTOR LOGIN SUCCESS ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-030: console statement in UI file
- **File:** `app/(auth)/doctor-login.tsx` (line 115)
- **Detail:** console.log('User ID:', data.user?.id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-031: console statement in UI file
- **File:** `app/(auth)/doctor-login.tsx` (line 116)
- **Detail:** console.log('Company ID:', data.user?.company_id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-032: console statement in UI file
- **File:** `app/(auth)/doctor-login.tsx` (line 125)
- **Detail:** console.log('Session saved successfully');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-033: console statement in UI file
- **File:** `app/(auth)/doctor-login.tsx` (line 128)
- **Detail:** console.log('Auth context refreshed');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-034: console statement in UI file
- **File:** `app/(auth)/doctor-login.tsx` (line 131)
- **Detail:** console.log('✅ Device token registered during login');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-035: console statement in UI file
- **File:** `app/(auth)/doctor-login.tsx` (line 133)
- **Detail:** console.log('⚠️ No device token registered - notifications may not work');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-036: console statement in UI file
- **File:** `app/(auth)/doctor-login.tsx` (line 151)
- **Detail:** console.log('=== CLINIC SELECTED ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-037: console statement in UI file
- **File:** `app/(auth)/doctor-login.tsx` (line 152)
- **Detail:** console.log('Clinic Name:', company.company_name);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-038: console statement in UI file
- **File:** `app/(auth)/doctor-login.tsx` (line 153)
- **Detail:** console.log('Clinic ID:', company.company_id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-039: console statement in UI file
- **File:** `app/(auth)/doctor-login.tsx` (line 154)
- **Detail:** console.log('User Role:', company.role);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-040: 20 hardcoded hex colors — breaks theme consistency
- **File:** `app/(auth)/forgot-password.tsx` (line 1)
- **Detail:** 20 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-041: 22 hardcoded hex colors — breaks theme consistency
- **File:** `app/(auth)/otp-verify.tsx` (line 1)
- **Detail:** 22 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-042: Touchable element missing accessibilityLabel
- **File:** `app/(auth)/otp-verify.tsx` (line 200)
- **Detail:** <TouchableOpacity onPress={handleResendOTP} disabled={isVerifying}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-043: 33 hardcoded hex colors — breaks theme consistency
- **File:** `app/(auth)/patient-login.tsx` (line 1)
- **Detail:** 33 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-044: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 69)
- **Detail:** console.log('=== PATIENT LOGIN ATTEMPT ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-045: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 70)
- **Detail:** console.log('Login Method:', loginMethod);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-046: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 71)
- **Detail:** console.log('Medical ID:', medicalId);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-047: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 72)
- **Detail:** console.log('Mobile Number:', mobileNumber);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-048: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 73)
- **Detail:** console.log('Supabase URL:', config.supabaseUrl);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-049: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 95)
- **Detail:** console.log('Response status:', response.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-050: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 96)
- **Detail:** console.log('Response ok:', response.ok);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-051: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 99)
- **Detail:** console.log('Response data:', JSON.stringify(data, null, 2));
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-052: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 102)
- **Detail:** console.log('=== LOGIN SUCCESS ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-053: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 103)
- **Detail:** console.log('Patient ID:', data.patient?.id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-054: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 104)
- **Detail:** console.log('User ID:', data.user?.id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-055: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 114)
- **Detail:** console.log('Session saved successfully');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-056: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 117)
- **Detail:** console.log('Auth context refreshed');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-057: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 121)
- **Detail:** console.log('Web platform - skipping device token registration');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-058: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 126)
- **Detail:** console.log('=== STARTING PUSH NOTIFICATION REGISTRATION ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-059: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 129)
- **Detail:** console.log('Initializing Firebase for notifications...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-060: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 136)
- **Detail:** console.log('✅ Firebase initialized');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-061: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 140)
- **Detail:** console.log('=== PUSH TOKEN RESULT ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-062: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 141)
- **Detail:** console.log('Token:', pushToken);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-063: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 142)
- **Detail:** console.log('Token type:', typeof pushToken);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-064: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 143)
- **Detail:** console.log('Token length:', pushToken?.length);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-065: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 157)
- **Detail:** console.log('=== SAVING DEVICE TOKEN ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-066: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 158)
- **Detail:** console.log('Patient ID:', data.patient.id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-067: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 159)
- **Detail:** console.log('Medical ID:', data.patient.medical_id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-068: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 160)
- **Detail:** console.log('Token (first 30 chars):', pushToken.substring(0, 30) + '...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-069: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 170)
- **Detail:** console.log('=== DEVICE TOKEN SAVE RESULT ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-070: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 171)
- **Detail:** console.log('Saved:', saved);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-071: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 174)
- **Detail:** console.log('✅ DEVICE TOKEN SAVED SUCCESSFULLY');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-072: console statement in UI file
- **File:** `app/(auth)/patient-login.tsx` (line 183)
- **Detail:** console.log('=== NAVIGATING TO TABS ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-073: Touchable element missing accessibilityLabel
- **File:** `app/(auth)/patient-login.tsx` (line 361)
- **Detail:** <TouchableOpacity onPress={handleForgotPassword}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-074: Touchable element missing accessibilityLabel
- **File:** `app/(auth)/patient-login.tsx` (line 381)
- **Detail:** <TouchableOpacity onPress={handleRegister}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-075: 60 hardcoded hex colors — breaks theme consistency
- **File:** `app/(auth)/patient-register.tsx` (line 1)
- **Detail:** 60 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-076: console statement in UI file
- **File:** `app/(auth)/patient-register.tsx` (line 233)
- **Detail:** console.log('Sending registration request...', {
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-077: console statement in UI file
- **File:** `app/(auth)/patient-register.tsx` (line 262)
- **Detail:** console.log('Response status:', response.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-078: console statement in UI file
- **File:** `app/(auth)/patient-register.tsx` (line 264)
- **Detail:** console.log('Response body:', responseText);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-079: console statement in UI file
- **File:** `app/(auth)/patient-register.tsx` (line 276)
- **Detail:** console.log('OTP Code received:', data.otp);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-080: Touchable element missing accessibilityLabel
- **File:** `app/(auth)/patient-register.tsx` (line 573)
- **Detail:** <TouchableOpacity onPress={() => router.back()}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-081: 23 hardcoded hex colors — breaks theme consistency
- **File:** `app/(auth)/registration-success.tsx` (line 1)
- **Detail:** 23 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-082: 21 hardcoded hex colors — breaks theme consistency
- **File:** `app/(auth)/reset-password-otp.tsx` (line 1)
- **Detail:** 21 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-083: Touchable element missing accessibilityLabel
- **File:** `app/(auth)/reset-password-otp.tsx` (line 183)
- **Detail:** <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-084: 47 hardcoded hex colors — breaks theme consistency
- **File:** `app/(auth)/reset-password.tsx` (line 1)
- **Detail:** 47 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-085: 24 hardcoded hex colors — breaks theme consistency
- **File:** `app/(doctor-tabs)/appointments.tsx` (line 1)
- **Detail:** 24 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-086: useMemo/useCallback with empty dependency array []
- **File:** `app/(doctor-tabs)/dental.tsx` (line 122)
- **Detail:** }, []);
- **Fix:** Verify that no variables from the outer scope are used inside this callback. If they are, add them to the deps array.

### L-087: 14 hardcoded hex colors — breaks theme consistency
- **File:** `app/(doctor-tabs)/dental.tsx` (line 1)
- **Detail:** 14 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-088: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/dental.tsx` (line 550)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-089: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/dental.tsx` (line 625)
- **Detail:** <TouchableOpacity onPress={() => {
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-090: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/dental.tsx` (line 643)
- **Detail:** <TouchableOpacity onPress={() => setPatientSearchQuery('')} style={styles.clearButton}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-091: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/dental.tsx` (line 705)
- **Detail:** <TouchableOpacity onPress={() => setShowDetail(false)}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-092: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/dental.tsx` (line 814)
- **Detail:** <TouchableOpacity onPress={() => setShowDateModal(false)}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-093: 59 hardcoded hex colors — breaks theme consistency
- **File:** `app/(doctor-tabs)/finance.tsx` (line 1)
- **Detail:** 59 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-094: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/finance.tsx` (line 341)
- **Detail:** <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-095: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/finance.tsx` (line 565)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-096: 38 hardcoded hex colors — breaks theme consistency
- **File:** `app/(doctor-tabs)/index.tsx` (line 1)
- **Detail:** 38 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-097: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/index.tsx` (line 304)
- **Detail:** <TouchableOpacity style={styles.clinicPill} onPress={() => setShowClinicModal(true)} activeOpacity={
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-098: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/index.tsx` (line 398)
- **Detail:** <TouchableOpacity style={styles.apptDoneBtn} onPress={() => handleUpdateAppointmentStatus(appt.id, '
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-099: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/index.tsx` (line 401)
- **Detail:** <TouchableOpacity style={styles.apptCancelBtn} onPress={() => handleUpdateAppointmentStatus(appt.id,
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-100: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/index.tsx` (line 459)
- **Detail:** <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowClinicModal(fa
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-101: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/index.tsx` (line 464)
- **Detail:** <TouchableOpacity onPress={() => setShowClinicModal(false)}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-102: useMemo/useCallback with empty dependency array []
- **File:** `app/(doctor-tabs)/medications.tsx` (line 97)
- **Detail:** }, []);
- **Fix:** Verify that no variables from the outer scope are used inside this callback. If they are, add them to the deps array.

### L-103: 6 hardcoded hex colors — breaks theme consistency
- **File:** `app/(doctor-tabs)/medications.tsx` (line 1)
- **Detail:** 6 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-104: console statement in UI file
- **File:** `app/(doctor-tabs)/medications.tsx` (line 92)
- **Detail:** console.log('Prescriptions state updated:', prescriptions.length);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-105: console statement in UI file
- **File:** `app/(doctor-tabs)/medications.tsx` (line 111)
- **Detail:** console.log('=== Doctor/Patient Selection Changed ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-106: console statement in UI file
- **File:** `app/(doctor-tabs)/medications.tsx` (line 112)
- **Detail:** console.log('Selected Doctor:', selectedDoctor?.name || 'None');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-107: console statement in UI file
- **File:** `app/(doctor-tabs)/medications.tsx` (line 113)
- **Detail:** console.log('Selected Patient:', selectedPatient?.full_name || 'None');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-108: console statement in UI file
- **File:** `app/(doctor-tabs)/medications.tsx` (line 120)
- **Detail:** console.log('Clearing prescriptions due to incomplete selection');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-109: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/medications.tsx` (line 603)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-110: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/medications.tsx` (line 678)
- **Detail:** <TouchableOpacity onPress={() => {
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-111: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/medications.tsx` (line 696)
- **Detail:** <TouchableOpacity onPress={() => setPatientSearchQuery('')} style={styles.clearButton}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-112: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/medications.tsx` (line 767)
- **Detail:** <TouchableOpacity onPress={() => setShowDateModal(false)}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-113: useMemo/useCallback with empty dependency array []
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 66)
- **Detail:** }, [])
- **Fix:** Verify that no variables from the outer scope are used inside this callback. If they are, add them to the deps array.

### L-114: 11 hardcoded hex colors — breaks theme consistency
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 1)
- **Detail:** 11 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-115: console statement in UI file
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 78)
- **Detail:** console.log('Session exists:', !!sessionData);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-116: console statement in UI file
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 81)
- **Detail:** console.log('No session found');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-117: console statement in UI file
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 87)
- **Detail:** console.log('Session token exists:', !!session.access_token);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-118: console statement in UI file
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 88)
- **Detail:** console.log('User type:', session.user_type);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-119: console statement in UI file
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 89)
- **Detail:** console.log('Fetching doctor notifications...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-120: console statement in UI file
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 103)
- **Detail:** console.log('Response status:', response.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-121: console statement in UI file
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 105)
- **Detail:** console.log('Result:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-122: console statement in UI file
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 108)
- **Detail:** console.log('Notifications loaded:', result.notifications.length);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-123: console statement in UI file
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 192)
- **Detail:** console.log('Notification marked as read, refetching notifications');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-124: console statement in UI file
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 210)
- **Detail:** console.log('Marking all notifications as read...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-125: console statement in UI file
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 211)
- **Detail:** console.log('Current notifications before update:', notifications.map(n => ({ id
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-126: console statement in UI file
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 226)
- **Detail:** console.log('Mark all as read result:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-127: console statement in UI file
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 229)
- **Detail:** console.log('All notifications marked as read in DB, refetching from server');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-128: console statement in UI file
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 270)
- **Detail:** console.log('Authorization processed successfully');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-129: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 337)
- **Detail:** <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-130: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 351)
- **Detail:** <TouchableOpacity style={styles.iconButton} onPress={() => setShowFilterSheet(true)}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-131: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/notifications.tsx` (line 355)
- **Detail:** <TouchableOpacity style={styles.iconButton} onPress={markAllAsRead}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-132: useMemo/useCallback with empty dependency array []
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 89)
- **Detail:** }, []);
- **Fix:** Verify that no variables from the outer scope are used inside this callback. If they are, add them to the deps array.

### L-133: 16 hardcoded hex colors — breaks theme consistency
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 1)
- **Detail:** 16 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-134: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 624)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-135: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 699)
- **Detail:** <TouchableOpacity onPress={() => {
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-136: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 717)
- **Detail:** <TouchableOpacity onPress={() => setPatientSearchQuery('')} style={styles.clearButton}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-137: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/nutrition.tsx` (line 788)
- **Detail:** <TouchableOpacity onPress={() => setShowDateModal(false)}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-138: useMemo/useCallback with empty dependency array []
- **File:** `app/(doctor-tabs)/orders.tsx` (line 92)
- **Detail:** }, []);
- **Fix:** Verify that no variables from the outer scope are used inside this callback. If they are, add them to the deps array.

### L-139: 5 hardcoded hex colors — breaks theme consistency
- **File:** `app/(doctor-tabs)/orders.tsx` (line 1)
- **Detail:** 5 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-140: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/orders.tsx` (line 593)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-141: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/orders.tsx` (line 668)
- **Detail:** <TouchableOpacity onPress={() => {
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-142: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/orders.tsx` (line 686)
- **Detail:** <TouchableOpacity onPress={() => setPatientSearchQuery('')} style={styles.clearButton}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-143: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/orders.tsx` (line 757)
- **Detail:** <TouchableOpacity onPress={() => setShowDateModal(false)}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-144: 40 hardcoded hex colors — breaks theme consistency
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 1)
- **Detail:** 40 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-145: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 439)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-146: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 512)
- **Detail:** <TouchableOpacity onPress={() => setShowQuestionnaireModal(false)}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-147: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 609)
- **Detail:** <TouchableOpacity onPress={() => {
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-148: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 629)
- **Detail:** <TouchableOpacity onPress={() => setPatientSearchText('')}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-149: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/patient-answers.tsx` (line 750)
- **Detail:** <TouchableOpacity onPress={() => setShowDetailModal(false)}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-150: 21 hardcoded hex colors — breaks theme consistency
- **File:** `app/(doctor-tabs)/patient-appointments.tsx` (line 1)
- **Detail:** 21 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-151: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/patient-appointments.tsx` (line 153)
- **Detail:** <TouchableOpacity onPress={toggle} activeOpacity={0.75} style={styles.apptSummaryRow}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-152: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/patient-appointments.tsx` (line 324)
- **Detail:** <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-153: 8 hardcoded hex colors — breaks theme consistency
- **File:** `app/(doctor-tabs)/patients.tsx` (line 1)
- **Detail:** 8 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-154: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/patients.tsx` (line 181)
- **Detail:** <TouchableOpacity onPress={() => setSearchQuery('')}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-155: 82 hardcoded hex colors — breaks theme consistency
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1)
- **Detail:** 82 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-156: console statement in UI file
- **File:** `app/(doctor-tabs)/questions.tsx` (line 205)
- **Detail:** console.log('handleDeleteQuestionnaire called for:', questionnaire.title);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-157: console statement in UI file
- **File:** `app/(doctor-tabs)/questions.tsx` (line 220)
- **Detail:** console.log('Confirmation result:', confirmed);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-158: console statement in UI file
- **File:** `app/(doctor-tabs)/questions.tsx` (line 222)
- **Detail:** console.log('Deletion cancelled');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-159: console statement in UI file
- **File:** `app/(doctor-tabs)/questions.tsx` (line 225)
- **Detail:** console.log('Proceeding with deletion...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-160: console statement in UI file
- **File:** `app/(doctor-tabs)/questions.tsx` (line 229)
- **Detail:** console.log('Deleting questionnaire:', questionnaire.id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-161: console statement in UI file
- **File:** `app/(doctor-tabs)/questions.tsx` (line 242)
- **Detail:** console.log('Delete response status:', response.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-162: console statement in UI file
- **File:** `app/(doctor-tabs)/questions.tsx` (line 245)
- **Detail:** console.log('Delete response text:', responseText);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-163: console statement in UI file
- **File:** `app/(doctor-tabs)/questions.tsx` (line 279)
- **Detail:** console.log('handleDeleteQuestion called for:', question.question_text);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-164: console statement in UI file
- **File:** `app/(doctor-tabs)/questions.tsx` (line 294)
- **Detail:** console.log('Confirmation result:', confirmed);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-165: console statement in UI file
- **File:** `app/(doctor-tabs)/questions.tsx` (line 296)
- **Detail:** console.log('Deletion cancelled');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-166: console statement in UI file
- **File:** `app/(doctor-tabs)/questions.tsx` (line 299)
- **Detail:** console.log('Proceeding with deletion...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-167: console statement in UI file
- **File:** `app/(doctor-tabs)/questions.tsx` (line 303)
- **Detail:** console.log('Deleting question:', question.id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-168: console statement in UI file
- **File:** `app/(doctor-tabs)/questions.tsx` (line 316)
- **Detail:** console.log('Delete question response status:', response.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-169: console statement in UI file
- **File:** `app/(doctor-tabs)/questions.tsx` (line 319)
- **Detail:** console.log('Delete question response text:', responseText);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-170: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/questions.tsx` (line 770)
- **Detail:** <TouchableOpacity onPress={onClose}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-171: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/questions.tsx` (line 852)
- **Detail:** <TouchableOpacity onPress={onClose}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-172: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/questions.tsx` (line 993)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-173: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/questions.tsx` (line 1347)
- **Detail:** <TouchableOpacity onPress={() => setPatientSearchQuery('')}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-174: 25 hardcoded hex colors — breaks theme consistency
- **File:** `app/(doctor-tabs)/settings.tsx` (line 1)
- **Detail:** 25 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-175: console statement in UI file
- **File:** `app/(doctor-tabs)/settings.tsx` (line 58)
- **Detail:** console.log('No session found');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-176: console statement in UI file
- **File:** `app/(doctor-tabs)/settings.tsx` (line 76)
- **Detail:** console.log('Settings loaded:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-177: console statement in UI file
- **File:** `app/(doctor-tabs)/settings.tsx` (line 151)
- **Detail:** console.log('Notification toggle result:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-178: console statement in UI file
- **File:** `app/(doctor-tabs)/settings.tsx` (line 228)
- **Detail:** console.log('Biometric toggle result:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-179: 55 hardcoded hex colors — breaks theme consistency
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 1)
- **Detail:** 55 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-180: console statement in UI file
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 195)
- **Detail:** console.log('[Modal Debug] Block Modal State:', showBlockModal);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-181: console statement in UI file
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 199)
- **Detail:** console.log('[Modal Debug] Exception Modal State:', showExceptionModal);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-182: console statement in UI file
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 212)
- **Detail:** console.log('Fetching doctors for global_id:', session.user.global_id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-183: console statement in UI file
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 216)
- **Detail:** console.log('Supabase URL:', supabaseUrl);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-184: console statement in UI file
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 234)
- **Detail:** console.log('Time management API response:', JSON.stringify(result, null, 2));
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-185: console statement in UI file
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 235)
- **Detail:** console.log('Response status:', response.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-186: console statement in UI file
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 239)
- **Detail:** console.log('Doctors list:', doctorsList);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-187: console statement in UI file
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 245)
- **Detail:** console.log('No doctors found in response');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-188: console statement in UI file
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 868)
- **Detail:** console.log('Saving schedule with data:', requestData);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-189: console statement in UI file
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 869)
- **Detail:** console.log('Selected doctor:', selectedDoctor);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-190: console statement in UI file
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 870)
- **Detail:** console.log('Selected clinic:', selectedClinic);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-191: console statement in UI file
- **File:** `app/(doctor-tabs)/time-management.tsx` (line 885)
- **Detail:** console.log('Schedule save response:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-192: useMemo/useCallback with empty dependency array []
- **File:** `app/(doctor-tabs)/vision.tsx` (line 129)
- **Detail:** }, []);
- **Fix:** Verify that no variables from the outer scope are used inside this callback. If they are, add them to the deps array.

### L-193: 8 hardcoded hex colors — breaks theme consistency
- **File:** `app/(doctor-tabs)/vision.tsx` (line 1)
- **Detail:** 8 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-194: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/vision.tsx` (line 711)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-195: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/vision.tsx` (line 786)
- **Detail:** <TouchableOpacity onPress={() => {
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-196: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/vision.tsx` (line 804)
- **Detail:** <TouchableOpacity onPress={() => setPatientSearchQuery('')} style={styles.clearButton}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-197: Touchable element missing accessibilityLabel
- **File:** `app/(doctor-tabs)/vision.tsx` (line 875)
- **Detail:** <TouchableOpacity onPress={() => setShowDateModal(false)}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-198: useMemo/useCallback with empty dependency array []
- **File:** `app/(tabs)/appointments.tsx` (line 82)
- **Detail:** }, [])
- **Fix:** Verify that no variables from the outer scope are used inside this callback. If they are, add them to the deps array.

### L-199: 20 hardcoded hex colors — breaks theme consistency
- **File:** `app/(tabs)/appointments.tsx` (line 1)
- **Detail:** 20 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-200: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/appointments.tsx` (line 493)
- **Detail:** <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-201: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/appointments.tsx` (line 555)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-202: 9 hardcoded hex colors — breaks theme consistency
- **File:** `app/(tabs)/dental.tsx` (line 1)
- **Detail:** 9 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-203: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/dental.tsx` (line 304)
- **Detail:** <TouchableOpacity style={styles.retryButton} onPress={loadEncounters}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-204: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/dental.tsx` (line 400)
- **Detail:** <TouchableOpacity activeOpacity={1} style={styles.filterModalContent}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-205: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/dental.tsx` (line 439)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-206: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/dental.tsx` (line 520)
- **Detail:** <TouchableOpacity onPress={() => setShowDetail(false)}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-207: 9 hardcoded hex colors — breaks theme consistency
- **File:** `app/(tabs)/doctor-responses.tsx` (line 1)
- **Detail:** 9 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-208: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/doctor-responses.tsx` (line 340)
- **Detail:** <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-209: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/doctor-responses.tsx` (line 344)
- **Detail:** <TouchableOpacity onPress={() => setShowDoctorFilter(true)} style={styles.filterButton}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-210: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/doctor-responses.tsx` (line 353)
- **Detail:** <TouchableOpacity onPress={() => setSelectedDoctor('all')} style={styles.clearFilterButton}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-211: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/doctor-responses.tsx` (line 396)
- **Detail:** <TouchableOpacity style={styles.retryButton} onPress={() => loadQuestionnaires()}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-212: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/doctor-responses.tsx` (line 570)
- **Detail:** <TouchableOpacity activeOpacity={1} style={styles.filterModalContent}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-213: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/doctor-responses.tsx` (line 574)
- **Detail:** <TouchableOpacity onPress={() => { setSelectedDoctor('all'); setShowDoctorFilter(false); setDoctorSe
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-214: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/doctor-responses.tsx` (line 597)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-215: 4 hardcoded hex colors — breaks theme consistency
- **File:** `app/(tabs)/doctors.tsx` (line 1)
- **Detail:** 4 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-216: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/doctors.tsx` (line 199)
- **Detail:** <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-217: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/doctors.tsx` (line 204)
- **Detail:** <TouchableOpacity onPress={() => setShowDropdown(true)} style={styles.filterButton}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-218: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/doctors.tsx` (line 267)
- **Detail:** <TouchableOpacity style={styles.retryButton} onPress={loadDoctors}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-219: useMemo/useCallback with empty dependency array []
- **File:** `app/(tabs)/index.tsx` (line 165)
- **Detail:** }, [])
- **Fix:** Verify that no variables from the outer scope are used inside this callback. If they are, add them to the deps array.

### L-220: 30 hardcoded hex colors — breaks theme consistency
- **File:** `app/(tabs)/index.tsx` (line 1)
- **Detail:** 30 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-221: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/index.tsx` (line 451)
- **Detail:** <TouchableOpacity onPress={() => router.push('/(tabs)/appointments')}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-222: 12 hardcoded hex colors — breaks theme consistency
- **File:** `app/(tabs)/invoices.tsx` (line 1)
- **Detail:** 12 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-223: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/invoices.tsx` (line 344)
- **Detail:** <TouchableOpacity style={styles.retryButton} onPress={loadInvoices}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-224: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/invoices.tsx` (line 485)
- **Detail:** <TouchableOpacity activeOpacity={1} style={styles.filterModalContent}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-225: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/invoices.tsx` (line 533)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-226: 12 hardcoded hex colors — breaks theme consistency
- **File:** `app/(tabs)/nutrition.tsx` (line 1)
- **Detail:** 12 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-227: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/nutrition.tsx` (line 260)
- **Detail:** <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-228: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/nutrition.tsx` (line 264)
- **Detail:** <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-229: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/nutrition.tsx` (line 297)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-230: 5 hardcoded hex colors — breaks theme consistency
- **File:** `app/(tabs)/orders.tsx` (line 1)
- **Detail:** 5 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-231: console statement in UI file
- **File:** `app/(tabs)/orders.tsx` (line 79)
- **Detail:** console.log('Session data:', sessionData);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-232: console statement in UI file
- **File:** `app/(tabs)/orders.tsx` (line 83)
- **Detail:** console.log('Parsed session:', session);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-233: console statement in UI file
- **File:** `app/(tabs)/orders.tsx` (line 86)
- **Detail:** console.log('Medical ID found:', session.patient.medical_id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-234: console statement in UI file
- **File:** `app/(tabs)/orders.tsx` (line 106)
- **Detail:** console.log('Fetching all data for medical_id:', medicalId);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-235: console statement in UI file
- **File:** `app/(tabs)/orders.tsx` (line 121)
- **Detail:** console.log('Orders API response:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-236: console statement in UI file
- **File:** `app/(tabs)/orders.tsx` (line 140)
- **Detail:** console.log('Formatted orders:', formattedOrders);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-237: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/orders.tsx` (line 409)
- **Detail:** <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-238: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/orders.tsx` (line 465)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-239: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/packages.tsx` (line 127)
- **Detail:** <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-240: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/packages.tsx` (line 144)
- **Detail:** <TouchableOpacity onPress={() => setShowFilterMenu(false)}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-241: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/packages.tsx` (line 185)
- **Detail:** <TouchableOpacity style={styles.retryButton} onPress={loadPackages}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-242: console statement in UI file
- **File:** `app/(tabs)/prescriptions.tsx` (line 103)
- **Detail:** console.log('Session data:', sessionData);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-243: console statement in UI file
- **File:** `app/(tabs)/prescriptions.tsx` (line 107)
- **Detail:** console.log('Parsed session:', session);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-244: console statement in UI file
- **File:** `app/(tabs)/prescriptions.tsx` (line 110)
- **Detail:** console.log('Medical ID found:', session.patient.medical_id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-245: console statement in UI file
- **File:** `app/(tabs)/prescriptions.tsx` (line 130)
- **Detail:** console.log('Fetching prescriptions for medical_id:', medicalId);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-246: console statement in UI file
- **File:** `app/(tabs)/prescriptions.tsx` (line 146)
- **Detail:** console.log('Doctors response:', doctorsData);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-247: console statement in UI file
- **File:** `app/(tabs)/prescriptions.tsx` (line 170)
- **Detail:** console.log('Prescriptions response:', prescriptionsData);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-248: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/prescriptions.tsx` (line 487)
- **Detail:** <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-249: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/prescriptions.tsx` (line 543)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-250: 52 hardcoded hex colors — breaks theme consistency
- **File:** `app/(tabs)/profile.tsx` (line 1)
- **Detail:** 52 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-251: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 150)
- **Detail:** console.log('Session exists:', !!session);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-252: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 151)
- **Detail:** console.log('Access token exists:', !!session?.access_token);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-253: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 158)
- **Detail:** console.log('Fetching fresh profile...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-254: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 171)
- **Detail:** console.log('Response status:', response.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-255: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 174)
- **Detail:** console.log('Response data:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-256: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 258)
- **Detail:** console.log('[Camera] Checking camera permissions...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-257: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 260)
- **Detail:** console.log('[Camera] Existing permission status:', existingStatus);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-258: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 265)
- **Detail:** console.log('[Camera] Requesting camera permissions...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-259: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 268)
- **Detail:** console.log('[Camera] New permission status:', finalStatus);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-260: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 276)
- **Detail:** console.log('[Camera] Launching camera...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-261: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 284)
- **Detail:** console.log('[Camera] Result:', {
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-262: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 291)
- **Detail:** console.log('[Camera] Image selected:', result.assets[0].uri);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-263: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 295)
- **Detail:** console.log('[Camera] No image selected or cancelled');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-264: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 305)
- **Detail:** console.log('[Gallery] Checking media library permissions...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-265: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 307)
- **Detail:** console.log('[Gallery] Existing permission status:', existingStatus);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-266: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 312)
- **Detail:** console.log('[Gallery] Requesting media library permissions...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-267: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 315)
- **Detail:** console.log('[Gallery] New permission status:', finalStatus);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-268: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 323)
- **Detail:** console.log('[Gallery] Launching image library...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-269: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 332)
- **Detail:** console.log('[Gallery] Result:', {
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-270: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 339)
- **Detail:** console.log('[Gallery] Image selected:', result.assets[0].uri);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-271: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 343)
- **Detail:** console.log('[Gallery] No image selected or cancelled');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-272: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 522)
- **Detail:** console.log('Starting logout...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-273: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 524)
- **Detail:** console.log('SignOut completed');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-274: console statement in UI file
- **File:** `app/(tabs)/profile.tsx` (line 527)
- **Detail:** console.log('Forcing complete page reload on web...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-275: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/profile.tsx` (line 608)
- **Detail:** <TouchableOpacity style={styles.imageButton} onPress={handleTakePhoto}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-276: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/profile.tsx` (line 613)
- **Detail:** <TouchableOpacity style={styles.imageButton} onPress={handleChooseFromGallery}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-277: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/profile.tsx` (line 712)
- **Detail:** <TouchableOpacity
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-278: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/profile.tsx` (line 726)
- **Detail:** <TouchableOpacity
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-279: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/profile.tsx` (line 756)
- **Detail:** <TouchableOpacity
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-280: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/profile.tsx` (line 767)
- **Detail:** <TouchableOpacity
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-281: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/profile.tsx` (line 783)
- **Detail:** <TouchableOpacity
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-282: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/profile.tsx` (line 794)
- **Detail:** <TouchableOpacity
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-283: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/profile.tsx` (line 809)
- **Detail:** <TouchableOpacity
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-284: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/profile.tsx` (line 820)
- **Detail:** <TouchableOpacity
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-285: 40 hardcoded hex colors — breaks theme consistency
- **File:** `app/(tabs)/settings.tsx` (line 1)
- **Detail:** 40 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-286: 13 hardcoded hex colors — breaks theme consistency
- **File:** `app/(tabs)/statement.tsx` (line 1)
- **Detail:** 13 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-287: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/statement.tsx` (line 184)
- **Detail:** <TouchableOpacity style={styles.retryButton} onPress={loadStatement}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-288: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/statement.tsx` (line 387)
- **Detail:** <TouchableOpacity activeOpacity={1} style={styles.filterModalContent}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-289: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/statement.tsx` (line 426)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-290: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/vision.tsx` (line 538)
- **Detail:** <TouchableOpacity activeOpacity={1} style={styles.filterModalContent}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-291: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/vision.tsx` (line 577)
- **Detail:** <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-292: useMemo/useCallback with empty dependency array []
- **File:** `app/(tabs)/visit-history.tsx` (line 310)
- **Detail:** }, [])
- **Fix:** Verify that no variables from the outer scope are used inside this callback. If they are, add them to the deps array.

### L-293: 31 hardcoded hex colors — breaks theme consistency
- **File:** `app/(tabs)/visit-history.tsx` (line 1)
- **Detail:** 31 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-294: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/visit-history.tsx` (line 198)
- **Detail:** <TouchableOpacity onPress={toggle} activeOpacity={0.75} style={styles.apptSummaryRow}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-295: Touchable element missing accessibilityLabel
- **File:** `app/(tabs)/visit-history.tsx` (line 512)
- **Detail:** <TouchableOpacity onPress={() => setShowFilterSheet(false)} activeOpacity={0.7}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-296: 78 hardcoded hex colors — breaks theme consistency
- **File:** `app/book-appointment.tsx` (line 1)
- **Detail:** 78 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-297: Touchable element missing accessibilityLabel
- **File:** `app/book-appointment.tsx` (line 896)
- **Detail:** <TouchableOpacity style={styles.backButton} onPress={handleBack}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-298: 32 hardcoded hex colors — breaks theme consistency
- **File:** `app/debug-token.tsx` (line 1)
- **Detail:** 32 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-299: Touchable element missing accessibilityLabel
- **File:** `app/debug-token.tsx` (line 164)
- **Detail:** <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-300: Touchable element missing accessibilityLabel
- **File:** `app/debug-token.tsx` (line 227)
- **Detail:** <TouchableOpacity onPress={copyToken} style={styles.copyButton}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-301: 38 hardcoded hex colors — breaks theme consistency
- **File:** `app/device-token-debug.tsx` (line 1)
- **Detail:** 38 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-302: Touchable element missing accessibilityLabel
- **File:** `app/device-token-debug.tsx` (line 148)
- **Detail:** <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-303: Touchable element missing accessibilityLabel
- **File:** `app/device-token-debug.tsx` (line 152)
- **Detail:** <TouchableOpacity onPress={loadTokenInfo} style={styles.refreshButton}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-304: 36 hardcoded hex colors — breaks theme consistency
- **File:** `app/edit-profile.tsx` (line 1)
- **Detail:** 36 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-305: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 65)
- **Detail:** console.log('=== EDIT PROFILE MOUNT ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-306: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 66)
- **Detail:** console.log('Session state:', {
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-307: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 85)
- **Detail:** console.log('Loading profile for patient:', session.patient.id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-308: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 97)
- **Detail:** console.log('Profile data:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-309: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 106)
- **Detail:** console.log('Setting profile data fields...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-310: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 127)
- **Detail:** console.log('Profile fields set:', {
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-311: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 136)
- **Detail:** console.log('Found profile_image in database:', data.profile_image);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-312: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 140)
- **Detail:** console.log('Generated public URL:', imageData.publicUrl);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-313: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 143)
- **Detail:** console.log('No profile_image found in database');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-314: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 173)
- **Detail:** console.log('[Camera] Requesting camera permissions...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-315: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 175)
- **Detail:** console.log('[Camera] Permission status:', status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-316: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 182)
- **Detail:** console.log('[Camera] Launching camera...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-317: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 190)
- **Detail:** console.log('[Camera] Result:', {
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-318: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 197)
- **Detail:** console.log('[Camera] Image selected:', result.assets[0].uri);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-319: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 202)
- **Detail:** console.log('[Camera] No image selected or cancelled');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-320: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 212)
- **Detail:** console.log('[Gallery] Requesting media library permissions...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-321: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 214)
- **Detail:** console.log('[Gallery] Permission status:', status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-322: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 221)
- **Detail:** console.log('[Gallery] Launching image library...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-323: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 229)
- **Detail:** console.log('[Gallery] Result:', {
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-324: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 236)
- **Detail:** console.log('[Gallery] Image selected:', result.assets[0].uri);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-325: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 241)
- **Detail:** console.log('[Gallery] No image selected or cancelled');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-326: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 275)
- **Detail:** console.log('Starting image upload...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-327: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 276)
- **Detail:** console.log('Image URI:', selectedImageFile.uri);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-328: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 277)
- **Detail:** console.log('Session at upload time:', {
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-329: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 292)
- **Detail:** console.log('File extension:', fileExt);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-330: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 303)
- **Detail:** console.log('FormData prepared with file URI:', selectedImageFile.uri);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-331: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 305)
- **Detail:** console.log('Sending upload request with medical ID:', profile.medical_id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-332: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 311)
- **Detail:** console.log('Upload response status:', uploadResponse.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-333: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 313)
- **Detail:** console.log('Upload response text:', responseText);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-334: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 330)
- **Detail:** console.log('Upload successful:', result);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-335: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 358)
- **Detail:** console.log('Saving profile for patient:', session.patient.id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-336: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 389)
- **Detail:** console.log('Sending update request...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-337: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 399)
- **Detail:** console.log('Update response status:', updateResponse.status);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-338: console statement in UI file
- **File:** `app/edit-profile.tsx` (line 401)
- **Detail:** console.log('Update response text:', responseText);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-339: Touchable element missing accessibilityLabel
- **File:** `app/edit-profile.tsx` (line 458)
- **Detail:** <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-340: Touchable element missing accessibilityLabel
- **File:** `app/edit-profile.tsx` (line 484)
- **Detail:** <TouchableOpacity style={[styles.changePhotoButton, { backgroundColor: colors.card, borderColor: col
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-341: 4 hardcoded hex colors — breaks theme consistency
- **File:** `app/help-center.tsx` (line 1)
- **Detail:** 4 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-342: Touchable element missing accessibilityLabel
- **File:** `app/help-center.tsx` (line 123)
- **Detail:** <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-343: console statement in UI file
- **File:** `app/index.tsx` (line 13)
- **Detail:** console.log('=== INDEX SCREEN ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-344: console statement in UI file
- **File:** `app/index.tsx` (line 14)
- **Detail:** console.log('isLoading:', isLoading);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-345: console statement in UI file
- **File:** `app/index.tsx` (line 15)
- **Detail:** console.log('Has session:', !!session);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-346: console statement in UI file
- **File:** `app/index.tsx` (line 16)
- **Detail:** console.log('Has supabaseSession:', !!supabaseSession);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-347: console statement in UI file
- **File:** `app/index.tsx` (line 17)
- **Detail:** console.log('Current segments:', segments);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-348: console statement in UI file
- **File:** `app/index.tsx` (line 23)
- **Detail:** console.log('Force rendering - auth took too long');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-349: console statement in UI file
- **File:** `app/index.tsx` (line 36)
- **Detail:** console.log('Navigation effect triggered - User type:', userType);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-350: console statement in UI file
- **File:** `app/index.tsx` (line 40)
- **Detail:** console.log('Navigating to doctor-tabs');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-351: console statement in UI file
- **File:** `app/index.tsx` (line 44)
- **Detail:** console.log('Navigating to patient tabs');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-352: console statement in UI file
- **File:** `app/index.tsx` (line 49)
- **Detail:** console.log('Navigating to login');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-353: 14 hardcoded hex colors — breaks theme consistency
- **File:** `app/login.tsx` (line 1)
- **Detail:** 14 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-354: useMemo/useCallback with empty dependency array []
- **File:** `app/notifications.tsx` (line 62)
- **Detail:** }, [])
- **Fix:** Verify that no variables from the outer scope are used inside this callback. If they are, add them to the deps array.

### L-355: console statement in UI file
- **File:** `app/notifications.tsx` (line 73)
- **Detail:** console.log('Notification event received, refreshing list...');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-356: Touchable element missing accessibilityLabel
- **File:** `app/notifications.tsx` (line 286)
- **Detail:** <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-357: Touchable element missing accessibilityLabel
- **File:** `app/notifications.tsx` (line 300)
- **Detail:** <TouchableOpacity style={styles.iconButton} onPress={() => setShowFilterSheet(true)}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-358: Touchable element missing accessibilityLabel
- **File:** `app/notifications.tsx` (line 304)
- **Detail:** <TouchableOpacity style={styles.iconButton} onPress={markAllAsRead}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-359: 32 hardcoded hex colors — breaks theme consistency
- **File:** `app/package-detail.tsx` (line 1)
- **Detail:** 32 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-360: Touchable element missing accessibilityLabel
- **File:** `app/package-detail.tsx` (line 93)
- **Detail:** <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-361: Touchable element missing accessibilityLabel
- **File:** `app/package-detail.tsx` (line 107)
- **Detail:** <TouchableOpacity style={styles.retryButton} onPress={loadPackageDetail}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-362: useMemo/useCallback with empty dependency array []
- **File:** `app/payment-methods.tsx` (line 145)
- **Detail:** }, []);
- **Fix:** Verify that no variables from the outer scope are used inside this callback. If they are, add them to the deps array.

### L-363: useMemo/useCallback with empty dependency array []
- **File:** `app/payment-methods.tsx` (line 319)
- **Detail:** }, []);
- **Fix:** Verify that no variables from the outer scope are used inside this callback. If they are, add them to the deps array.

### L-364: 16 hardcoded hex colors — breaks theme consistency
- **File:** `app/payment-methods.tsx` (line 1)
- **Detail:** 16 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-365: console statement in UI file
- **File:** `app/payment-methods.tsx` (line 248)
- **Detail:** console.log('[PaymentMethods] handleAddCard called');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-366: console statement in UI file
- **File:** `app/payment-methods.tsx` (line 249)
- **Detail:** console.log('[PaymentMethods] session:', JSON.stringify(session));
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-367: console statement in UI file
- **File:** `app/payment-methods.tsx` (line 250)
- **Detail:** console.log('[PaymentMethods] medicalId:', medicalId);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-368: console statement in UI file
- **File:** `app/payment-methods.tsx` (line 253)
- **Detail:** console.log('[PaymentMethods] digits:', digits.length);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-369: console statement in UI file
- **File:** `app/payment-methods.tsx` (line 284)
- **Detail:** console.log('[PaymentMethods] calling edge function with brand:', brand);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-370: console statement in UI file
- **File:** `app/payment-methods.tsx` (line 295)
- **Detail:** console.log('[PaymentMethods] result:', JSON.stringify(result));
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-371: Touchable element missing accessibilityLabel
- **File:** `app/payment-methods.tsx` (line 334)
- **Detail:** <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-372: Touchable element missing accessibilityLabel
- **File:** `app/payment-methods.tsx` (line 514)
- **Detail:** <TouchableOpacity onPress={resetForm} activeOpacity={0.7}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-373: 12 hardcoded hex colors — breaks theme consistency
- **File:** `app/test-device-token.tsx` (line 1)
- **Detail:** 12 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-374: console statement in UI file
- **File:** `app/test-device-token.tsx` (line 17)
- **Detail:** console.log(message);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-375: Touchable element missing accessibilityLabel
- **File:** `app/test-device-token.tsx` (line 152)
- **Detail:** <TouchableOpacity style={styles.button} onPress={testGetToken}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-376: 35 hardcoded hex colors — breaks theme consistency
- **File:** `app/test-fcm.tsx` (line 1)
- **Detail:** 35 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-377: console statement in UI file
- **File:** `app/test-fcm.tsx` (line 40)
- **Detail:** console.log('✅ FCM Token:', fcm);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-378: console statement in UI file
- **File:** `app/test-fcm.tsx` (line 42)
- **Detail:** console.log('❌ FCM Token not available');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-379: console statement in UI file
- **File:** `app/test-fcm.tsx` (line 46)
- **Detail:** console.log('✅ Expo Token:', expo);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-380: console statement in UI file
- **File:** `app/test-fcm.tsx` (line 48)
- **Detail:** console.log('❌ Expo Token not available');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-381: console statement in UI file
- **File:** `app/test-fcm.tsx` (line 64)
- **Detail:** console.log(`${type} Token:`, text);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-382: Touchable element missing accessibilityLabel
- **File:** `app/test-fcm.tsx` (line 231)
- **Detail:** <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-383: 14 hardcoded hex colors — breaks theme consistency
- **File:** `components/BiometricAuthGate.tsx` (line 1)
- **Detail:** 14 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-384: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 17)
- **Detail:** console.log('Resetting biometric session flag');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-385: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 70)
- **Detail:** console.log('✓ Already authenticated in this session, skipping biometric check')
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-386: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 78)
- **Detail:** console.log('=== BIOMETRIC AUTH GATE: Session Check ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-387: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 79)
- **Detail:** console.log('Session exists:', !!session);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-388: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 80)
- **Detail:** console.log('Is authenticated in session:', isAuthenticatedInSession);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-389: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 83)
- **Detail:** console.log('No session found, skipping biometric check');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-390: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 92)
- **Detail:** console.log('=== BIOMETRIC AUTH GATE: Doctor Check ===');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-391: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 93)
- **Detail:** console.log('Session user_type:', session.user_type);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-392: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 94)
- **Detail:** console.log('Session user:', session.user);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-393: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 95)
- **Detail:** console.log('Is doctor?', session.user_type === 'doctor' && session.user);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-394: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 98)
- **Detail:** console.log('Checking doctor biometric settings for user:', session.user.id);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-395: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 100)
- **Detail:** console.log('SecureStore doctor_biometric_enabled:', biometricEnabled);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-396: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 103)
- **Detail:** console.log('Getting doctor biometric settings from primary company using global
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-397: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 107)
- **Detail:** console.log('Doctor primary settings:', settings);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-398: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 110)
- **Detail:** console.log('Biometric login enabled in primary company, requiring authenticatio
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-399: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 113)
- **Detail:** console.log('Biometric login disabled in primary company');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-400: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 117)
- **Detail:** console.log('No global_id found, falling back to current user settings');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-401: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 119)
- **Detail:** console.log('Doctor biometric settings:', settings);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-402: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 122)
- **Detail:** console.log('Biometric login enabled, requiring authentication');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-403: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 125)
- **Detail:** console.log('Biometric login disabled in database');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-404: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 130)
- **Detail:** console.log('Biometric not enabled in SecureStore');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-405: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 141)
- **Detail:** console.log('Getting patient biometric settings from primary (using medical_id).
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-406: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 143)
- **Detail:** console.log('Patient primary settings:', settings);
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-407: console statement in UI file
- **File:** `components/BiometricAuthGate.tsx` (line 151)
- **Detail:** console.log('No medical_id found, falling back to patient_id');
- **Fix:** Remove or guard with `if (__DEV__) console.log(...)` to keep production output clean.

### L-408: 13 hardcoded hex colors — breaks theme consistency
- **File:** `components/CardScannerModal.tsx` (line 1)
- **Detail:** 13 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-409: Touchable element missing accessibilityLabel
- **File:** `components/CardScannerModal.tsx` (line 104)
- **Detail:** <TouchableOpacity style={[styles.webFallbackBtn, { backgroundColor: colors.primary }]} onPress={onCl
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-410: Touchable element missing accessibilityLabel
- **File:** `components/CardScannerModal.tsx` (line 132)
- **Detail:** <TouchableOpacity style={styles.permissionSkipBtn} onPress={onClose}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-411: Touchable element missing accessibilityLabel
- **File:** `components/CardScannerModal.tsx` (line 149)
- **Detail:** <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-412: Touchable element missing accessibilityLabel
- **File:** `components/CardScannerModal.tsx` (line 195)
- **Detail:** <TouchableOpacity style={styles.retryHint} onPress={() => setError(null)}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-413: 12 hardcoded hex colors — breaks theme consistency
- **File:** `components/ErrorBoundary.tsx` (line 1)
- **Detail:** 12 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-414: Touchable element missing accessibilityLabel
- **File:** `components/ErrorBoundary.tsx` (line 92)
- **Detail:** <TouchableOpacity style={styles.button} onPress={this.handleReload}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-415: Touchable element missing accessibilityLabel
- **File:** `components/FilterBottomSheet.tsx` (line 63)
- **Detail:** <TouchableOpacity onPress={onClose} style={styles.closeButton}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-416: Touchable element missing accessibilityLabel
- **File:** `components/FilterBottomSheet.tsx` (line 283)
- **Detail:** <TouchableOpacity style={[styles.resetButton, { backgroundColor: colors.backgroundSecondary, borderC
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-417: Touchable element missing accessibilityLabel
- **File:** `components/FilterBottomSheet.tsx` (line 286)
- **Detail:** <TouchableOpacity style={[styles.applyButton, { backgroundColor: colors.primary }]} onPress={handleA
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-418: 24 hardcoded hex colors — breaks theme consistency
- **File:** `components/ImageCaptcha.tsx` (line 1)
- **Detail:** 24 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-419: Touchable element missing accessibilityLabel
- **File:** `components/ImageCaptcha.tsx` (line 215)
- **Detail:** <TouchableOpacity onPress={onClose} style={styles.closeButton}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-420: Touchable element missing accessibilityLabel
- **File:** `components/ImageCaptcha.tsx` (line 227)
- **Detail:** <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-421: 9 hardcoded hex colors — breaks theme consistency
- **File:** `components/NotificationCard.tsx` (line 1)
- **Detail:** 9 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-422: Touchable element missing accessibilityLabel
- **File:** `components/NotificationCard.tsx` (line 96)
- **Detail:** <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-423: 20 hardcoded hex colors — breaks theme consistency
- **File:** `components/NotificationDetail.tsx` (line 1)
- **Detail:** 20 hex color values (#xxxxxx) found inline
- **Fix:** Move all colors into `constants/Colors.ts` or a theme file and reference via `Colors.primary` etc.

### L-424: Touchable element missing accessibilityLabel
- **File:** `components/NotificationDetail.tsx` (line 155)
- **Detail:** <TouchableOpacity onPress={onClose} style={styles.closeButton}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

### L-425: Touchable element missing accessibilityLabel
- **File:** `components/NotificationDetail.tsx` (line 212)
- **Detail:** <TouchableOpacity style={styles.closeButtonLarge} onPress={onClose}>
- **Fix:** Add `accessibilityLabel="Descriptive text"` for screen reader (VoiceOver / TalkBack) support.

---

## Suggested Fixes

1. **StyleSheet.create** — Replace all inline `style={{ }}` with `StyleSheet.create({})` declarations at the bottom of each file.
2. **Loading states** — Every screen fetching from Supabase should have a loading state that shows an `<ActivityIndicator />`.
3. **FlatList for dynamic lists** — Replace `ScrollView + .map()` patterns with `<FlatList>` for all server-driven lists.
4. **Design system** — Centralize all colors, spacing, and typography in `constants/Colors.ts` and `constants/Typography.ts`.
5. **Component decomposition** — Split any file over 350 lines into smaller, single-responsibility components.

---

## 📄 Affected Files (58)

- `app/(auth)/doctor-login.tsx`
- `app/(auth)/forgot-password.tsx`
- `app/(auth)/otp-verify.tsx`
- `app/(auth)/patient-login.tsx`
- `app/(auth)/patient-register.tsx`
- `app/(auth)/registration-success.tsx`
- `app/(auth)/reset-password-otp.tsx`
- `app/(auth)/reset-password.tsx`
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
- `app/login.tsx`
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

---

## ✅ Frontend Test Cases

- [ ] TC-001: Patient tab screens render without crash on Android and iOS
- [ ] TC-002: Doctor tab screens render without crash on Android and iOS
- [ ] TC-003: Auth screens display correctly on small screen (iPhone SE)
- [ ] TC-004: Auth screens display correctly on large screen (iPhone 14 Pro Max)
- [ ] TC-005: All form fields use the correct keyboard type (email, phone, password)
- [ ] TC-006: Form validation error messages display clearly below each field
- [ ] TC-007: Loading spinner shows while data is being fetched from Supabase
- [ ] TC-008: Error state UI shown when a network request fails
- [ ] TC-009: Empty state UI shown when a list has no results
- [ ] TC-010: Appointment FlatList scrolls smoothly with 50+ items
- [ ] TC-011: Bottom navigation tabs highlight the active tab correctly
- [ ] TC-012: Dark mode renders consistently across all screens
- [ ] TC-013: RTL layout (Arabic content) renders correctly
- [ ] TC-014: Pull-to-refresh works on all list screens
- [ ] TC-015: Filter bottom sheet opens, applies filter, dismisses correctly
- [ ] TC-016: Modal opens and closes without layout shift
- [ ] TC-017: Back navigation from nested screens returns to correct parent
- [ ] TC-018: Deep link from notification navigates to the correct screen
- [ ] TC-019: Profile avatar upload and preview works correctly
- [ ] TC-020: Appointment booking form prevents double-submission (button disabled)
- [ ] TC-021: Settings screen saves preferences and reflects them immediately
- [ ] TC-022: Help center screen renders content without layout overflow
- [ ] TC-023: Invoice amounts formatted correctly with currency symbol
- [ ] TC-024: Doctor patient-detail screen shows complete history
- [ ] TC-025: Safe area insets prevent content from being hidden by notch/home indicator
- [ ] TC-026: Keyboard avoidance works in all form screens (input not hidden by keyboard)

---

## Final Status

**🟠 AT RISK — High issues affect UX quality and should be fixed**

> Report generated by Frontend QA Agent.  
> Last run: 06/13/2026, 07:30:01 PM
