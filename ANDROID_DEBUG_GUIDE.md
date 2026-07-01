# Android Debugging Guide

## Problem: App Freezing/Crashing on Android

If your app is freezing or crashing on Android without showing errors, follow these steps:

## Step 1: Clean Build

First, do a complete clean build:

```bash
# Delete old build files
rmdir /s /q android\app\build
rmdir /s /q android\build

# Clean and rebuild
cd android
gradlew clean
cd ..

# Rebuild the app
npx expo prebuild --clean --platform android
npx expo run:android
```

## Step 2: Monitor Logs

Run the debug script while the app is starting:

```bash
# In a separate terminal, run:
DEBUG_ANDROID.bat
```

This will show you all console logs and errors from the app.

## Step 3: Check for Common Issues

### Issue 1: Environment Variables Not Loading
**Symptom:** App crashes immediately or shows blank screen
**Solution:** Make sure `.env` file exists and contains:
```
EXPO_PUBLIC_SUPABASE_URL=your_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

### Issue 2: AsyncStorage Issues
**Symptom:** App freezes on white screen
**Solution:** The app now has 5-second timeout. If AsyncStorage hangs, app will start anyway.

### Issue 3: Logo/Icon Not Showing
**Symptom:** Generic Android icon appears
**Solution:**
1. Logo file renamed to `maw3edak-logo.png` (no spaces)
2. Run: `npx expo prebuild --clean`
3. Rebuild app

## Step 4: Check Device Logs

Use Android Studio's Logcat to see detailed logs:

1. Open Android Studio
2. Go to View → Tool Windows → Logcat
3. Filter by "ReactNativeJS" or "maw3edak"
4. Launch your app
5. Look for red error messages

## Step 5: Test on Different Device/Emulator

Sometimes issues are device-specific. Try:
- Different Android emulator
- Physical device with USB debugging
- Different Android version

## Common Error Messages

### "Network request failed"
- Check if device has internet connection
- Check if Supabase URL is correct
- Try using mobile hotspot instead of WiFi

### "AsyncStorage is null"
- The app now handles this with timeouts
- App will continue loading even if AsyncStorage fails

### App freezes at splash screen
- Emergency timeout will force app to start after 5 seconds
- Check logs to see where it's hanging

## Recent Changes Made

1. **Added emergency timeouts** (5s for app, 2s for auth)
2. **Added comprehensive logging** throughout initialization
3. **Disabled new architecture** temporarily (was causing issues)
4. **Fixed logo filename** (removed spaces)
5. **Added defensive error handling** for AsyncStorage and Supabase
6. **Enhanced error boundary** to show errors instead of crashing

## Next Steps

If the app still crashes:

1. Share the output from `DEBUG_ANDROID.bat`
2. Note at which point the app freezes (based on console logs)
3. Check if any specific error appears in logcat
4. Try with a fresh emulator

## Emergency Recovery

If nothing works, try this minimal test:

1. Create a new test project: `npx create-expo-app test-app`
2. Install same dependencies
3. Test if basic Supabase connection works
4. Compare with current project

## Build Commands Summary

```bash
# Full clean rebuild
npx expo prebuild --clean
npx expo run:android

# Just rebuild without clean
npx expo run:android

# Build APK for testing
eas build --platform android --profile preview
```
