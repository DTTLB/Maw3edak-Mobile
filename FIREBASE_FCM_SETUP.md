# Firebase FCM Setup Guide

This project now uses native Firebase Cloud Messaging (FCM) instead of Expo push notifications.

## What Changed

1. **Removed**: expo-notifications package
2. **Added**: @react-native-firebase/app and @react-native-firebase/messaging
3. **Ejected**: From Expo managed workflow to bare React Native workflow
4. **Updated**: All notification code to use native FCM

## Configuration Files You Must Update

### Android Configuration

**File**: `android/app/google-services.json`

Replace the placeholder values with your actual Firebase Android configuration:

```json
{
  "project_info": {
    "project_number": "YOUR_PROJECT_NUMBER",
    "project_id": "YOUR_PROJECT_ID",
    "storage_bucket": "YOUR_STORAGE_BUCKET"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "YOUR_ANDROID_APP_ID",
        "android_client_info": {
          "package_name": "com.maw3edak.app"
        }
      },
      "oauth_client": [],
      "api_key": [
        {
          "current_key": "YOUR_API_KEY"
        }
      ],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": []
        }
      }
    }
  ],
  "configuration_version": "1"
}
```

To get your actual `google-services.json`:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Your Apps
4. Download the `google-services.json` file for your Android app
5. Replace the file at `android/app/google-services.json`

### iOS Configuration

**File**: `ios/Maw3edakAPP/GoogleService-Info.plist`

Replace the placeholder values with your actual Firebase iOS configuration:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>API_KEY</key>
	<string>YOUR_API_KEY</string>
	<key>GCM_SENDER_ID</key>
	<string>YOUR_SENDER_ID</string>
	<key>PROJECT_ID</key>
	<string>YOUR_PROJECT_ID</string>
	<key>GOOGLE_APP_ID</key>
	<string>YOUR_IOS_APP_ID</string>
</dict>
</plist>
```

To get your actual `GoogleService-Info.plist`:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Your Apps
4. Download the `GoogleService-Info.plist` file for your iOS app
5. Replace the file at `ios/Maw3edakAPP/GoogleService-Info.plist`

## Building and Running

### Android

```bash
# Install dependencies
npm install

# Run on Android
npm run android
```

### iOS

```bash
# Install dependencies
npm install

# Install CocoaPods (iOS dependencies)
cd ios && pod install && cd ..

# Run on iOS
npm run ios
```

## How It Works

### 1. Getting FCM Token

The app uses `getRealFcmToken()` function to get the native FCM token:

```typescript
import { getRealFcmToken } from '@/utils/notifications';

const token = await getRealFcmToken();
console.log('REAL FCM TOKEN:', token);
```

This function:
- Requests push notification permissions
- Gets the native FCM token from Firebase
- Returns null if permissions are denied or on web platform

### 2. Notification Listeners

Three types of notification listeners are set up automatically:

**Foreground**: When app is open and visible
```typescript
messaging().onMessage(async (remoteMessage) => {
  console.log('Foreground notification:', remoteMessage);
});
```

**Background**: When app is in background
```typescript
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Background notification:', remoteMessage);
});
```

**Quit State**: When app is completely closed
```typescript
const initialNotification = await messaging().getInitialNotification();
```

### 3. Token Refresh

FCM tokens can be refreshed by Firebase. The app listens for token refresh events:

```typescript
messaging().onTokenRefresh(async (token) => {
  console.log('FCM Token refreshed:', token);
  // Save new token to your backend
});
```

## Testing FCM

### Using Test Screen

The app includes a test screen at `/test-fcm` that displays:
- Your real FCM token
- A form to send test notifications

### Using Your Backend

The backend server (`api/server.js`) is already configured to send FCM notifications:

```bash
# Start the backend
cd api
npm install
npm start
```

Then send a test notification:

```bash
curl -X POST http://localhost:3000/mobile_fcm_send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_FCM_TOKEN",
    "title": "Test Notification",
    "body": "Hello from FCM!"
  }'
```

## Important Notes

1. **Physical Device Required**: FCM tokens only work on physical devices, not simulators/emulators
2. **Web Not Supported**: Push notifications don't work on web builds
3. **Token Storage**: The app automatically saves FCM tokens to your Supabase database via the `mobile-save-device-token` edge function
4. **Permissions**: Users must grant notification permissions for FCM to work

## Troubleshooting

### Android Issues

1. **Build fails**: Make sure `google-services.json` has valid Firebase config
2. **No token**: Verify you're using a physical device with Google Play Services
3. **Permissions denied**: Check Android permissions in Settings → Apps → Your App → Notifications

### iOS Issues

1. **Build fails**: Run `cd ios && pod install` to install CocoaPods
2. **No token**: Make sure you're using a physical device
3. **Permissions denied**: Check iOS permissions in Settings → Your App → Notifications

### General Issues

1. **Token is null**: Make sure you're on a physical device and permissions are granted
2. **Notifications not received**: Check Firebase Console → Cloud Messaging → Send test message
3. **Background notifications not working**: Verify `setBackgroundMessageHandler` is set up correctly

## Migration from Expo Push Notifications

All your existing code continues to work because we aliased the old function names:

- `registerForPushNotifications()` → Now calls `getRealFcmToken()`
- `getFCMToken()` → Now calls `getRealFcmToken()`
- `setupNotificationListeners()` → Now uses Firebase listeners

The `saveDeviceToken()` function works the same way, just now saves real FCM tokens instead of Expo tokens.
