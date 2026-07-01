# Multi-Device Login Implementation

## Overview
The system now supports multi-device login for patients. Multiple devices can be logged in simultaneously with the same medical_id, and all active devices receive push notifications.

## Changes Implemented

### 1. Device Token Management (`mobile-save-device-token`)

**Previous Behavior:**
- On login, all other devices for the same patient were deactivated
- Only one device could receive notifications at a time

**New Behavior:**
- On login, ONLY the current device token is upserted as `is_active=true`
- Other devices remain active and untouched
- Both Expo tokens (for development) and FCM tokens (for production) are accepted

**Edge Function:** `/supabase/functions/mobile-save-device-token/index.ts`

### 2. Push Notification Delivery (`send-push-notification`)

**Previous Behavior:**
- Fetched active tokens for a medical_id
- Sent notifications without cleanup

**New Behavior:**
- Fetches ALL active tokens where:
  - `medical_id = <targetMedicalId>`
  - `patient_id IS NOT NULL`
  - `is_active = true`
- Sends FCM multicast to all returned tokens
- Detects unregistered/invalid tokens and marks them as `is_active=false`
- Returns detailed results showing success/failure per device

**Edge Function:** `/supabase/functions/send-push-notification/index.ts`

**Error Detection:**
- `UNREGISTERED`
- `NOT_FOUND`
- `registration-token-not-registered`
- `Requested entity was not found`

### 3. Logout Behavior (`mobile-logout-device`)

**Previous Behavior:**
- No token cleanup on logout

**New Behavior:**
- Created new edge function to deactivate ONLY the current device
- Uses `fcm_token` to identify and deactivate the specific device
- Other devices remain active

**Edge Function:** `/supabase/functions/mobile-logout-device/index.ts`

**Integration:**
- `contexts/AuthContext.tsx` - Calls logout function during sign out
- `utils/notifications.ts` - Stores FCM token in SecureStore for logout

### 4. Token Storage

**Location:** `expo-secure-store` with key `fcm_token`

**Purpose:**
- Allows the app to identify which device token to deactivate on logout
- Persists across app restarts

**Implementation:**
- Stored in `saveDeviceToken()` and `saveDoctorDeviceToken()`
- Retrieved in `AuthContext.signOut()`

## Token Types Supported

### FCM Tokens (Production)
- Format: Long alphanumeric string
- Used on real mobile devices
- Supports both Android and iOS

### Expo Push Tokens (Development)
- Format: `ExponentPushToken[...]`
- Used when running in Expo Go during development
- Automatically detected and accepted

## Database Schema

### `device_tokens` Table
- `id` - Primary key
- `patient_id` - Patient ID (nullable)
- `medical_id` - Medical ID
- `fcm_token` - Device token (unique)
- `platform` - 'android', 'ios', or 'web'
- `device_model` - Device model name
- `app_version` - App version
- `is_active` - Boolean (true = receives notifications)
- `created_at` - Timestamp
- `updated_at` - Timestamp

## Notification Flow

1. **Login/App Start:**
   - Get FCM token from Firebase
   - Store in SecureStore
   - Call `mobile-save-device-token` (upserts current device as active)
   - Other devices remain active

2. **Sending Notification:**
   - Backend calls `send-push-notification` with medical_id
   - Function fetches ALL active tokens for that medical_id
   - Sends FCM message to each token
   - If token is invalid/unregistered, marks it as inactive

3. **Logout:**
   - Retrieve FCM token from SecureStore
   - Call `mobile-logout-device` with the token
   - Only that specific device is deactivated
   - Other devices continue receiving notifications

## Testing

### Multi-Device Test:
1. Login on Device A → Device A receives notifications ✓
2. Login on Device B → Both devices receive notifications ✓
3. Send notification → Both devices get it ✓
4. Logout from Device A → Only Device A is deactivated ✓
5. Send notification → Only Device B receives it ✓

### Token Cleanup Test:
1. Login on device
2. Uninstall app (token becomes invalid)
3. Send notification
4. System detects unregistered token
5. Token is automatically marked as inactive ✓

## Development vs Production

### In Expo Development:
- Uses Expo Push Tokens when running in Expo Go
- Tokens are saved and work in development environment
- Allows testing without physical device

### In Production:
- Uses real FCM tokens from `@react-native-firebase/messaging`
- Full Firebase Cloud Messaging support
- Works on both Android and iOS devices

## API Endpoints

### Save Device Token
```
POST /functions/v1/mobile-save-device-token
Body: {
  patientId: string,
  medicalId: string,
  fcmToken: string,
  platform: string,
  deviceModel?: string,
  appVersion?: string
}
```

### Send Notification
```
POST /functions/v1/send-push-notification
Body: {
  medicalId: string,
  title: string,
  body: string,
  data?: object
}
```

### Logout Device
```
POST /functions/v1/mobile-logout-device
Body: {
  fcmToken: string
}
```

## Benefits

1. **Better User Experience:**
   - Users can stay logged in on multiple devices
   - No need to log out from other devices
   - Seamless multi-device access

2. **Reliable Notifications:**
   - All active devices receive notifications
   - Automatic cleanup of invalid tokens
   - No duplicate login issues

3. **Development Flexibility:**
   - Supports both Expo and FCM tokens
   - Easy testing in development
   - Production-ready implementation

## Migration Notes

**No database migration required** - The system uses existing `device_tokens` table structure. The change is purely behavioral in the edge functions.

## Security Considerations

- RLS policies remain unchanged
- Only authenticated users can save tokens
- Tokens are encrypted in SecureStore
- Edge functions use service role for cleanup operations
- No sensitive data exposed to client
