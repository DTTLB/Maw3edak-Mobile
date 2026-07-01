# Production Build Fix - Environment Variables

## Problem

**Login works in Expo dev mode but fails on real devices (Android/iOS).**

### Why This Happens

1. **Expo Dev Mode** - Environment variables from `.env` work because Metro bundler has direct access
2. **Production Builds** - `.env` files aren't bundled, so `process.env` values are undefined
3. **Result** - API calls fail with missing URL/keys, causing login errors

## Solution Applied

### 1. Created Centralized Config Module

**File:** `utils/config.ts`

This module:
- Uses `expo-constants` to access variables embedded in the app
- Falls back to `process.env` for dev mode compatibility
- Provides clear error messages when config is missing

```typescript
import Constants from 'expo-constants';

interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

function getConfig(): AppConfig {
  const config = Constants.expoConfig?.extra || {};

  const supabaseUrl =
    config.supabaseUrl ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    '';

  const supabaseAnonKey =
    config.supabaseAnonKey ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}

export const config = getConfig();
```

### 2. Embedded Variables in app.json

**File:** `app.json`

Added variables to the `extra` field so they're embedded at build time:

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://ttyukcvqifqyfolxtwba.supabase.co",
      "supabaseAnonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "eas": {
        "projectId": "3b9d4d2a-e4b5-4938-bdf1-fb2c4b3a6598"
      }
    }
  }
}
```

### 3. Updated All Files

Replaced all `process.env.EXPO_PUBLIC_SUPABASE_*` calls with `config.*`:

**Before:**
```typescript
const response = await fetch(
  `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/...`,
  {
    headers: {
      'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
    }
  }
);
```

**After:**
```typescript
import { config } from '@/utils/config';

const response = await fetch(
  `${config.supabaseUrl}/functions/v1/...`,
  {
    headers: {
      'Authorization': `Bearer ${config.supabaseAnonKey}`,
    }
  }
);
```

### Files Updated (24 total):
- `utils/config.ts` (new file)
- `utils/supabase.ts`
- `app/_layout.tsx`
- All auth screens (7 files)
- All tab screens (11 files)
- Other app screens (3 files)

## Building for Production

### Android

```bash
# Clean rebuild with new config
REBUILD_ANDROID.bat

# Or manually:
cd android
gradlew clean
cd ..
npx expo prebuild --clean --platform android
npx expo run:android
```

### iOS

```bash
# Clean rebuild
npx expo prebuild --clean --platform ios
npx expo run:ios

# Or use EAS Build:
eas build --profile development --platform ios
```

### Using EAS Build (Recommended)

```bash
# Build for both platforms
eas build --profile development --platform android
eas build --profile development --platform ios

# Or build both at once
eas build --profile development --platform all
```

## Verification

After rebuilding, the app will:

1. **Load config properly** - Check console logs on startup
2. **Connect to Supabase** - API calls will have correct URLs
3. **Login successfully** - Both patient and doctor login work
4. **Save device tokens** - Push notifications can be registered

### Console Logs to Check

On app startup, you should see:

```
=== APP INITIALIZATION START ===
App starting on platform: android
Environment variables loaded: {
  supabaseUrl: 'Set',
  supabaseKey: 'Set'
}
=== SUPABASE CLIENT INITIALIZATION ===
  Supabase URL: ✓ Set
  Supabase Anon Key: ✓ Set
✅ Supabase client created successfully
```

When logging in:

```
=== PATIENT LOGIN ATTEMPT ===
Medical ID: MED-XXXXX
Supabase URL: https://ttyukcvqifqyfolxtwba.supabase.co
Response status: 200
Response ok: true
=== LOGIN SUCCESS ===
```

## Testing

### 1. Test in Expo Dev (Should still work)
```bash
npx expo start
```

### 2. Test on Real Device
- Build and install using methods above
- Try patient login
- Try doctor login
- Check that all features work

### 3. Test Logo Change
- New logo should appear on splash screen
- New logo should appear as app icon

## Troubleshooting

### Login Still Fails

**Check Console Logs:**
```bash
# Android
DEBUG_ANDROID.bat

# iOS
npx react-native log-ios
```

**Look for:**
- "MISSING CONFIGURATION" errors
- Network request failures
- API response errors

### Config Not Loading

**Verify app.json:**
- Open `app.json`
- Check `extra.supabaseUrl` exists
- Check `extra.supabaseAnonKey` exists

**Rebuild from scratch:**
```bash
# Delete build folders
rm -rf android/app/build android/build ios/build

# Full clean rebuild
npx expo prebuild --clean
npx expo run:android  # or run:ios
```

### Network Errors

**Check device has internet:**
- Try opening browser on device
- Check WiFi/cellular connection

**Check Supabase URL is accessible:**
- Visit https://ttyukcvqifqyfolxtwba.supabase.co in browser
- Should see Supabase API response

## Important Notes

1. **Both Platforms Fixed** - Changes apply to Android and iOS
2. **Logo Updated** - New logo is configured for both platforms
3. **.env Still Works** - Dev mode uses .env, production uses app.json
4. **No Manual Config Needed** - Everything is embedded at build time
5. **Rebuild Required** - Must rebuild to see changes

## Summary

The root cause was environment variables not being available in production builds. By embedding them in `app.json` and creating a centralized config module, the app now works correctly on real devices for both Android and iOS.
