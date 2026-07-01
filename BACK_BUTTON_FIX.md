# Back Button & Navigation Fix

## Problem
Users were experiencing logout issues when pressing the back button or navigating within the app:
- Pressing back button on any screen would log users out
- Users would be redirected to login after navigating back
- Session state was not persisting correctly during navigation

## Root Cause
1. **Navigation Stack Issue**: The index screen remained in the navigation stack after login, so pressing back would navigate to the index screen
2. **Session Re-evaluation**: The index screen would re-check authentication state, and if there was any delay or issue loading the session, it would redirect to login
3. **No Back Button Handling**: There was no back button handler to prevent unwanted navigation from main tab screens

## Fixes Applied

### 1. Back Button Handlers in Tab Layouts
**Files Modified:**
- `app/(tabs)/_layout.tsx`
- `app/(doctor-tabs)/_layout.tsx`

**Changes:**
- Added `BackHandler` to intercept hardware back button presses
- On main tab screens (Home, Appointments), back button now exits the app instead of navigating
- On other screens within tabs, back button works normally

```typescript
useEffect(() => {
  if (Platform.OS !== 'android') return;

  const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
    // If on main tab screens, exit the app
    if (pathname === '/(tabs)' || pathname === '/(tabs)/appointments') {
      BackHandler.exitApp();
      return true;
    }
    // For other screens, allow default back navigation
    return false;
  });

  return () => backHandler.remove();
}, [pathname]);
```

### 2. Prevent Swipe-Back Gestures
**File Modified:** `app/_layout.tsx`

**Changes:**
- Disabled swipe gestures on Stack screens to prevent accidental navigation back to index/login
- Added `gestureEnabled: false` to:
  - `index` screen
  - `login` screen
  - `(tabs)` group
  - `(doctor-tabs)` group

```typescript
<Stack.Screen
  name="(tabs)"
  options={{
    gestureEnabled: false,
    headerShown: false,
  }}
/>
```

### 3. Improved Index Screen Navigation
**File Modified:** `app/index.tsx`

**Changes:**
- Changed from `<Redirect>` component to `router.replace()`
- Using `router.replace()` removes the index screen from the navigation stack
- Added navigation guard to prevent multiple navigations
- Added proper loading state management

```typescript
useEffect(() => {
  if (hasNavigated) return;
  if (isLoading && !forceRender) return;

  const userType = session?.user_type;

  if (session || supabaseSession) {
    if (userType === 'doctor') {
      setHasNavigated(true);
      router.replace('/(doctor-tabs)');
    } else {
      setHasNavigated(true);
      router.replace('/(tabs)');
    }
  } else {
    setHasNavigated(true);
    router.replace('/login');
  }
}, [session, supabaseSession, isLoading, forceRender, hasNavigated]);
```

### 4. Global Back Handler Fallback
**File Modified:** `app/_layout.tsx`

**Changes:**
- Added root-level back handler as a fallback safety measure
- Logs when triggered for debugging purposes

## Expected Behavior After Fix

### Patient App
1. **On Home Screen**: Back button exits the app
2. **On Appointments Screen**: Back button exits the app
3. **On Other Screens** (Orders, Prescriptions, etc.): Back button navigates to previous screen
4. **Login Persistence**: Session persists across all navigation

### Doctor App
1. **On Home Screen**: Back button exits the app
2. **On Appointments Screen**: Back button exits the app
3. **On Settings Screen**: Back button exits the app
4. **On Other Screens** (Patients, Time Management, etc.): Back button navigates to previous screen
5. **Login Persistence**: Session persists across all navigation

## Testing Instructions

### Test 1: Main Tab Navigation
1. Login as patient or doctor
2. Navigate to Home tab
3. Press back button
4. **Expected**: App exits (or shows "Press back again to exit" if Android double-back is enabled)
5. **Not Expected**: User is NOT logged out

### Test 2: Deep Navigation
1. Login as patient
2. Navigate to Orders screen
3. Open an order detail
4. Press back button
5. **Expected**: Returns to Orders list
6. Press back button again
7. **Expected**: Returns to Home screen
8. **Not Expected**: User is NOT logged out at any point

### Test 3: Session Persistence
1. Login as patient or doctor
2. Navigate to any screen
3. Close the app (don't logout)
4. Reopen the app
5. **Expected**: User is still logged in and sees their last screen or home screen
6. **Not Expected**: User is NOT redirected to login

### Test 4: Swipe Navigation (iOS)
1. On iOS, try to swipe back from tab screens
2. **Expected**: Swipe gesture does not navigate back to login
3. **Expected**: User remains on current screen

## Additional Notes

- All login screens already use `router.replace()` which correctly removes the login screen from the navigation stack
- Session persistence is managed by `AuthContext` using AsyncStorage
- Firebase notifications and device tokens continue to work as expected
- The fix is Android-specific for back button, but navigation improvements benefit all platforms

## Files Modified
1. `app/(tabs)/_layout.tsx` - Added back button handler
2. `app/(doctor-tabs)/_layout.tsx` - Added back button handler
3. `app/_layout.tsx` - Disabled gestures, added fallback handler
4. `app/index.tsx` - Changed from Redirect to router.replace()

## Migration Notes
No database changes required. This is a pure client-side navigation fix.
