# Real FCM Token Implementation Summary

## What Was Done

Successfully migrated from Expo push tokens to real Firebase Cloud Messaging (FCM) tokens with proper device management.

## Key Changes

### 1. Native Firebase Integration

**Removed**: `expo-notifications` package
**Added**: `@react-native-firebase/app` and `@react-native-firebase/messaging`

### 2. Token Generation

The app now generates **real FCM tokens** using Firebase's native SDK:

```typescript
// Before (Expo)
const token = await Notifications.getExpoPushTokenAsync();
// Returns: "ExponentPushToken[xxxxxx]"

// After (Firebase)
const token = await messaging().getToken();
// Returns: "dZGN7F8VRe2M5...(160+ chars of real FCM token)"
```

### 3. Database Storage Logic

Updated `mobile-save-device-token` edge function with smart upsert logic:

**Logic Flow:**
1. Check if record exists for `patient_id` + `device_model`
2. **If EXISTS**: Update `fcm_token`, `updated_at`, and other fields
3. **If NEW**: Insert new record

**Benefits:**
- Same device gets token updated (not duplicated)
- Different devices for same patient get separate records
- FCM token refresh automatically updates existing record
- No duplicate device entries

**Validation:**
- Rejects Expo push tokens with clear error message
- Only accepts real FCM tokens (starts with valid FCM format)

### 4. Device Information Capture

Enhanced device information collection:

```typescript
const deviceModel = Device.modelName || Device.deviceName || 'Unknown';
const appVersion = Constants.expoConfig?.version || '1.0.0';
const platform = Platform.OS; // 'ios' or 'android'
```

### 5. Client-Side Protection

Added validation to prevent saving Expo tokens:

```typescript
if (token.startsWith('ExponentPushToken[')) {
  console.error('❌ Attempting to save Expo push token');
  return false;
}
```

## Database Schema

The `device_tokens` table structure:

```
- id (uuid, primary key)
- patient_id (uuid, not null)
- fcm_token (text, not null) ← Now stores REAL FCM tokens only
- platform (text, not null) ← 'ios' or 'android'
- device_model (text, nullable)
- app_version (text, nullable)
- is_active (boolean, default true)
- created_at (timestamp)
- updated_at (timestamp)
```

## How It Works

### On Login / App Start

1. Request push notification permissions
2. Get real FCM token from Firebase
3. Call `saveDeviceToken()` with patient_id and FCM token
4. Backend checks for existing device (by patient_id + device_model)
5. Updates FCM token if device exists, or inserts new record

### On Token Refresh

Firebase automatically refreshes tokens periodically. The app listens for refresh events:

```typescript
messaging().onTokenRefresh(async (newToken) => {
  console.log('FCM Token refreshed:', newToken);
  // Save new token to database (will update existing record)
});
```

### Notification States Handled

**Foreground** (app open and visible):
```typescript
messaging().onMessage(async (remoteMessage) => {
  console.log('Foreground notification:', remoteMessage);
});
```

**Background** (app minimized):
```typescript
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Background notification:', remoteMessage);
});
```

**Quit** (app completely closed):
```typescript
const initialNotification = await messaging().getInitialNotification();
// Called when app opens from notification tap
```

## Notification Icon Configuration

### Android Icon Setup

The app logo is configured in `AndroidManifest.xml`:

```xml
<meta-data
  android:name="com.google.firebase.messaging.default_notification_icon"
  android:resource="@mipmap/ic_launcher"/>
<meta-data
  android:name="com.google.firebase.messaging.default_notification_color"
  android:resource="@color/colorPrimary"/>
```

This ensures **all FCM notifications display your app icon automatically**.

### iOS Icon Setup

iOS automatically uses your app icon for all notifications. No configuration needed.

### How Icons Appear

**Android:**
- Small icon in status bar: System notification icon
- Large icon in notification: Your app logo (configured above)
- Color: Primary brand color

**iOS:**
- App icon appears automatically
- Badge number shows on icon
- No additional configuration required

## Sending Notifications

### Using the Edge Function

The `send-push-notification` edge function now uses **FCM HTTP v1 API** directly:

```typescript
// Call the edge function
const response = await fetch(
  `${supabaseUrl}/functions/v1/send-push-notification`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      patientId: 'patient-uuid',
      title: 'New Order Ready',
      body: 'Your prescription is ready for pickup',
      data: {
        orderId: '12345',
        type: 'prescription'
      }
    })
  }
);
```

The function:
1. Retrieves all active FCM tokens for the patient
2. Sends via Firebase Cloud Messaging HTTP v1 API
3. Includes proper Android/iOS configuration
4. Returns delivery results per device

### Testing

Use the built-in test screen at `/test-fcm`:
1. Displays your real FCM token
2. Send test notifications via backend
3. Verify token format and delivery

## Migration Notes

### Backward Compatibility

All existing function names are aliased for compatibility:

```typescript
// These all now return real FCM tokens:
registerForPushNotifications() → getRealFcmToken()
getFCMToken() → getRealFcmToken()
```

### No More Expo Tokens

The system now:
- **Rejects** any attempt to save Expo push tokens
- **Only accepts** real FCM tokens from Firebase
- **Validates** token format before saving

### Existing Data

If you have old Expo tokens in the database:
1. They start with `"ExponentPushToken["`
2. They won't work with Firebase Cloud Messaging
3. Users need to login again to generate real FCM tokens
4. Old tokens will be replaced automatically on next login

## Configuration Required

### Android

File: `android/app/google-services.json`
- Download from [Firebase Console](https://console.firebase.google.com/)
- Replace the template file

### iOS

File: `ios/Maw3edakAPP/GoogleService-Info.plist`
- Download from [Firebase Console](https://console.firebase.google.com/)
- Replace the template file

## Testing Checklist

- [ ] Replace Firebase config files (Android + iOS)
- [ ] Build app on physical device
- [ ] Login and verify real FCM token is generated
- [ ] Check database - fcm_token should be 160+ chars (not ExponentPushToken)
- [ ] Send test notification from backend
- [ ] Test foreground notifications
- [ ] Test background notifications
- [ ] Test notification when app is quit
- [ ] Verify token refresh updates existing record (not creates duplicate)
- [ ] Test with multiple devices for same patient

## Benefits

1. **Real FCM Tokens**: Native Firebase tokens that work with all FCM features
2. **Smart Upserts**: No duplicate device records
3. **Token Refresh Handling**: Automatic updates when FCM refreshes tokens
4. **Better Device Info**: Captures actual device model and app version
5. **Validation**: Prevents Expo tokens from being saved
6. **Multiple Device Support**: Each device gets its own record
7. **Active Status Tracking**: Easy to disable/enable devices

## Common Issues

### "Invalid token" error
- Make sure you downloaded real Firebase config files
- Verify you're on a physical device (not simulator)
- Check token doesn't start with "ExponentPushToken["

### Duplicate device records
- Should not happen with new upsert logic
- Check that device_model is being captured correctly
- Each unique device_model gets one record per patient

### Token not saving
- Check logs for "ExponentPushToken" rejection
- Verify permissions are granted
- Ensure Firebase is configured correctly in native code

## Next Steps

1. Update any backend code that sends notifications to use the new FCM tokens
2. Remove any Expo push notification server code
3. Test thoroughly on physical devices
4. Monitor token refresh behavior in production
5. Consider adding token cleanup for inactive devices
