# Push Notifications Setup Guide

## Two Options Available

Your app now supports **TWO** push notification methods:

### Option 1: Expo Push Notifications (Recommended for Development)
- ✅ Easier setup
- ✅ Works in Expo Go (development)
- ✅ Uses Expo's push service
- ✅ Already configured in Supabase Edge Functions

### Option 2: Firebase FCM (Native FCM Tokens)
- ✅ Direct Firebase integration
- ✅ More control over notifications
- ✅ Works with your custom Node.js backend
- ✅ Better for production apps
- ⚠️ Requires physical device testing

---

## What's Been Set Up

### Existing (Option 1 - Expo):
1. **Database**: `device_tokens` table to store tokens
2. **Utilities**: `registerForPushNotifications()` - Gets Expo tokens
3. **Edge Functions**: `send-push-notification` - Sends via Expo

### New (Option 2 - FCM):
1. **Backend Server**: `api/server.js` - Node.js FCM sender
2. **Utilities**: `getFCMToken()` - Gets native FCM tokens
3. **Firebase Config**: Android & iOS config files ready

## Next Steps

### 1. Get Your EAS Project ID

Run this command in your project directory:

```bash
npx eas init
```

This will create an EAS project and give you a project ID. Then update `app.json`:

```json
"extra": {
  "eas": {
    "projectId": "your-actual-project-id-here"
  }
}
```

### 2. Build Your App

For testing on a physical device, create a development build:

```bash
npx eas build --profile development --platform ios
# or
npx eas build --profile development --platform android
```

### 3. Test on Physical Device

Push notifications only work on physical devices, not simulators/emulators.

## How It Works

### Auto-Registration

When a patient logs in, the app:
1. Requests notification permissions
2. Gets an Expo push token
3. Saves it to the database with device info

### Sending Notifications

Use the `send-push-notification` edge function:

```javascript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/send-push-notification`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      medicalId: 'MED-12345',  // or use patientId
      title: 'Appointment Reminder',
      body: 'You have an appointment tomorrow at 10:00 AM',
      data: {  // optional custom data
        type: 'appointment',
        appointmentId: '123'
      }
    }),
  }
);
```

### Testing Locally

You can test by calling the edge function directly from your code or using a tool like Postman.

Example test:

```bash
curl -X POST \
  "${SUPABASE_URL}/functions/v1/send-push-notification" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "medicalId": "MED-12345",
    "title": "Test Notification",
    "body": "This is a test notification"
  }'
```

## Notification Handling

Notifications are automatically handled when:
- **App is in foreground**: Shows an alert
- **App is in background**: Shows in notification tray
- **App is closed**: Shows in notification tray

## Database Structure

The `device_tokens` table stores:
- `patient_id`: Links to the patient
- `fcm_token`: The Expo push token
- `platform`: ios or android
- `device_model`: Device information
- `app_version`: App version
- `is_active`: Whether the token is active

## Security

- Row Level Security (RLS) is enabled
- Patients can only manage their own tokens
- Old tokens are automatically deactivated when new ones are registered

---

## Option 2: Using Firebase FCM (Native Tokens)

### Architecture
```
┌──────────────┐    FCM Token    ┌──────────────┐    Firebase    ┌──────────┐
│  Expo App    │ ──────────────▶ │ Node.js API  │ ─────────────▶ │ Firebase │
│              │                  │ (api/server) │                 │   FCM    │
└──────────────┘                  └──────────────┘                 └──────────┘
```

### Setup Steps

#### 1. Start the FCM Backend Server

```bash
cd api
npm start
```

Server runs on `http://localhost:3000`

#### 2. Get FCM Token in Your App

Add to your login or home screen:

```typescript
import { getFCMToken } from '@/utils/notifications';
import { useEffect, useState } from 'react';

export default function HomeScreen() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    // Get native FCM token
    getFCMToken().then((token) => {
      if (token) {
        console.log('FCM Token:', token);
        setFcmToken(token);
        // Save to your backend/database
      }
    });
  }, []);

  return (
    <View>
      <Text>FCM Token: {fcmToken ? '✅ Ready' : 'Not available'}</Text>
    </View>
  );
}
```

#### 3. Build for Physical Device

**Important:** FCM tokens only work on physical devices!

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

#### 4. Send Test Notification

Once you have the FCM token from your device:

**Using curl:**
```bash
curl -X POST http://localhost:3000/mobile_fcm_send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_DEVICE_FCM_TOKEN",
    "title": "Test Notification",
    "body": "Hello from FCM!"
  }'
```

**Using the test script:**
```bash
cd api
node test-notification.js YOUR_DEVICE_FCM_TOKEN
```

### FCM API Reference

#### Backend Endpoint

**POST** `/mobile_fcm_send-notification`

**Request:**
```json
{
  "token": "device-fcm-token",
  "title": "Notification title",
  "body": "Notification message"
}
```

**Success Response:**
```json
{
  "success": true,
  "messageId": "projects/maw3edak/messages/123456"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

#### Frontend Function

**getFCMToken()**

Returns native FCM device token for Firebase backend.

```typescript
const token = await getFCMToken();
// Returns: "c1234567890abcdef..." or null
```

### Troubleshooting FCM

#### No FCM Token Received

1. ✅ Test on **physical device** (not simulator)
2. ✅ Check `google-services.json` (Android) or `GoogleService-Info.plist` (iOS) exists
3. ✅ Verify notification permissions granted
4. ✅ Rebuild: `npx expo run:android` or `npx expo run:ios`

#### Notification Not Received

1. ✅ Device not in "Do Not Disturb" mode
2. ✅ App has notification permissions
3. ✅ Check app notification settings
4. ✅ Verify FCM token is current

#### Backend Error

1. ✅ Verify `api/serviceaccountkey.json` exists
2. ✅ Check JSON file is valid
3. ✅ Ensure Firebase Cloud Messaging API enabled

### Production Deployment

#### Deploy FCM Server

Deploy `api/` folder to:
- Heroku
- DigitalOcean
- AWS (EC2/Lambda)
- Render

#### Security Checklist

- ✅ `serviceaccountkey.json` in `.gitignore` (already done)
- ✅ Use environment variables
- ✅ Enable HTTPS in production
- ✅ Add authentication to endpoint
- ✅ Validate tokens before sending

---

## Which Option Should You Use?

### Use Option 1 (Expo) if:
- 🎯 Developing and testing quickly
- 🎯 Using Expo Go for development
- 🎯 Want simplicity

### Use Option 2 (FCM) if:
- 🎯 Need direct Firebase integration
- 🎯 Building for production
- 🎯 Want more control over notifications
- 🎯 Have custom backend infrastructure

**You can use BOTH!** Save both Expo and FCM tokens, send via whichever service you prefer.
