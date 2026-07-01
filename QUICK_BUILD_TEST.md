# Quick Build & Test Guide

## What Changed:

### 1. **Login now shows popup alerts** on your phone:
- "🔄 Saving device token..." when attempting to save
- "✅ Device Registered" if successful
- "❌ Failed to save" if it fails
- Specific error messages for each failure point

### 2. **Debug screen** in Settings:
- Settings → Developer → FCM Token Debug
- Test token registration manually
- See real-time logs on phone screen

## Build APK:

```bash
cd android
./gradlew clean assembleRelease
```

APK: `android/app/build/outputs/apk/release/app-release.apk`

## Test Flow:

1. **Install new APK** on your phone
2. **Login** with your credentials
3. **Watch for popup alerts** during login:
   - If you see "⚠️ Failed to get FCM token" → Firebase issue
   - If you see "⚠️ Missing patient data" → Backend issue
   - If you see "🔄 Saving device token..." → Function is being called
   - If you see "❌ Failed to save" → Edge function issue
   - If you see "✅ Device Registered" → SUCCESS!

4. **After login**, go to Settings → Developer → FCM Token Debug
5. Press **"Test Token Registration"**
6. **Take screenshot** of the logs

## What to Report:

### During Login:
- ❓ Which popup alert did you see?
- ❓ Did you see "🔄 Saving device token..." alert?

### In Debug Screen:
- ❓ Does it show "✓ FCM token received"?
- ❓ Does it show "✅ TOKEN SAVED SUCCESSFULLY"?
- ❓ Any red error messages?

## Expected Flow (Success):

```
LOGIN:
↓
Popup: "🔄 Saving device token..."
↓
Popup: "✅ Device Registered"
↓
DEBUG SCREEN:
↓
✓ FCM token received
✓ Token length: 163 chars
✓ TOKEN SAVED SUCCESSFULLY!
✓ Token found in database
```

## If Edge Function Still Not Called:

The popup alerts will tell us **exactly** where it's stopping:
- No popup at all = Code not reaching that section
- "Failed to get FCM token" = Firebase not returning token
- "Missing patient data" = Login response incomplete
- "Saving device token" but no success = Edge function issue

Share screenshots of what you see!
