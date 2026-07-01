# Build APK with Debug Token Screen

## What's New

Added an **in-app debug screen** to help troubleshoot FCM token registration without connecting to a PC.

### Features:
- ✅ Shows session status (Patient ID, Medical ID)
- ✅ Tests FCM token retrieval
- ✅ Tests database save operation
- ✅ Checks if token exists in database
- ✅ Real-time logs visible on phone screen
- ✅ Copy token to clipboard
- ✅ Color-coded logs (success=green, error=red, warning=yellow)

## How to Access Debug Screen

1. Open the app on your phone
2. Go to **Settings** tab
3. Scroll down to **Developer** section
4. Tap **"FCM Token Debug"**

## Build New APK

### Option 1: Development Build (Recommended)

```bash
# Navigate to project directory
cd /tmp/cc-agent/60678772/project

# Build for Android
npx expo prebuild --platform android --clean
cd android
./gradlew clean
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

### Option 2: EAS Build (Cloud)

```bash
# Install EAS CLI if not installed
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android
eas build --platform android --profile preview
```

## After Installing New APK

1. **Install the APK** on your phone
2. **Login** to the app
3. Go to **Settings** → **Developer** → **FCM Token Debug**
4. Press **"Test Token Registration"** button
5. Watch the logs appear in real-time

### What to Look For:

**Success Flow:**
```
✓ FCM token received
✓ TOKEN SAVED SUCCESSFULLY!
✓ Token found in database
```

**Error Flow:**
```
❌ Failed to get FCM token
❌ Failed to save token
⚠ No token found in database
```

## Share Results

After running the test:
1. Take **screenshots** of the logs
2. Share the screenshots so we can identify the exact issue
3. If you see errors, note the specific error messages

## Quick Build Commands

```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleRelease

# Find APK
ls -la app/build/outputs/apk/release/
```

The debug screen will help us see **exactly** what's happening during token registration!
