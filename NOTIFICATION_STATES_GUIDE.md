# FCM Notification States Guide

This document explains how Firebase Cloud Messaging (FCM) notifications work in all application states.

## Three App States

### 1. Foreground (App Open/Active)
**When**: User is actively using the app
**Behavior**:
- Notification received via `onMessage` listener
- Shows Alert dialog with title and body
- User can "Dismiss" or "View" to navigate
- Does NOT show in system notification tray

**Code Location**: `utils/notifications.ts` - `unsubscribeForeground`

```typescript
const unsubscribeForeground = msg().onMessage(async (remoteMessage) => {
  // Shows Alert dialog
  Alert.alert(title, body, [
    { text: 'Dismiss', style: 'cancel' },
    { text: 'View', onPress: () => navigate() }
  ]);
});
```

---

### 2. Background (App Minimized)
**When**: App is in background (user pressed home button)
**Behavior**:
- Notification shown in system notification tray
- When tapped, app opens and navigates to relevant screen
- Handled by `onNotificationOpenedApp` listener

**Code Location**: `utils/notifications.ts` - `unsubscribeBackgroundTap`

```typescript
const unsubscribeBackgroundTap = msg().onNotificationOpenedApp((remoteMessage) => {
  // App opens and navigates automatically
  handleNotificationNavigation(remoteMessage);
});
```

---

### 3. Quit/Closed (App Killed)
**When**: App is completely closed/terminated
**Behavior**:
- Notification shown in system notification tray
- Handled by Firebase background handler
- When tapped, app launches and gets notification via `getInitialNotification`
- Navigates to relevant screen after 1 second delay

**Code Location**:
- Background handler: `utils/notifications.ts` - `initializeBackgroundHandler`
- Initial notification: `setupNotificationListeners` - `getInitialNotification`

```typescript
// Background handler (top level)
msg().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Background notification received');
});

// Initial notification (when app opens)
const remoteMessage = await msg().getInitialNotification();
if (remoteMessage) {
  handleNotificationNavigation(remoteMessage);
}
```

---

## FCM Token Management

### Token Registration
- Tokens are registered during login in `app/(auth)/patient-login.tsx`
- Token saved to `device_tokens` table with patient info

### Token Refresh
- FCM tokens can refresh automatically (every few months or on app reinstall)
- `onTokenRefresh` listener saves new token to database automatically
- Works in all app states

**Code Location**: `utils/notifications.ts` - `unsubscribeTokenRefresh`

```typescript
const unsubscribeTokenRefresh = msg().onTokenRefresh(async (token) => {
  // Automatically saves new token to database
  await saveRefreshedToken(token);
});
```

---

## Notification Navigation

All notification types navigate to specific screens:

| Notification Type | Navigate To |
|------------------|-------------|
| `new_order` | Orders tab |
| `new_appointment` | Appointments tab |
| `appointment_reminder` | Appointments tab |
| `new_invoice` | Invoices tab |
| `invoice_due` | Invoices tab |
| `new_prescription` | Prescriptions tab |
| `doctor_response` | Doctor Responses tab |
| `new_nutrition` | Nutrition tab |
| `nutrition_update` | Nutrition tab |
| `new_vision_test` | Vision tab |
| `vision_result` | Vision tab |
| `new_dental` | Dental tab |
| `dental_appointment` | Dental tab |

**Code Location**: `utils/notifications.ts` - `handleNotificationNavigation`

---

## Testing Notifications

### Test All States

1. **Foreground Test**:
   - Keep app open
   - Send notification
   - Should see Alert dialog

2. **Background Test**:
   - Press home button
   - Send notification
   - Tap notification in tray
   - App should open and navigate

3. **Closed Test**:
   - Kill app completely
   - Send notification
   - Tap notification in tray
   - App should launch and navigate

### Send Test Notification

Use the test script in `api/test-notification.js`:

```bash
node api/test-notification.js <FCM_TOKEN>
```

---

## Troubleshooting

### Notifications Not Received

1. Check FCM token is saved in database:
   ```sql
   SELECT * FROM device_tokens WHERE patient_id = 'YOUR_ID';
   ```

2. Check notification logs in device console:
   ```
   📱 FOREGROUND notification received
   🔔 BACKGROUND notification tapped
   💤 App opened from CLOSED state
   ```

3. Verify Firebase configuration:
   - `android/app/google-services.json` exists
   - `ios/Maw3edakAPP/GoogleService-Info.plist` exists

### Token Not Saved

1. Check logs in `patient-login.tsx`:
   ```
   === DEVICE TOKEN SAVE RESULT ===
   Saved: true/false
   ```

2. Verify edge function `mobile-save-device-token` works:
   - Check Supabase dashboard logs
   - Look for "TOKEN SAVED SUCCESSFULLY" message

### Navigation Not Working

1. Check notification data structure:
   ```json
   {
     "notification": {
       "title": "New Order",
       "body": "You have a new order"
     },
     "data": {
       "type": "new_order",
       "order_id": "123"
     }
   }
   ```

2. Verify router is imported correctly:
   ```typescript
   import { router } from 'expo-router';
   ```

---

## Summary

✅ **Foreground**: Alert dialog with Dismiss/View buttons
✅ **Background**: System notification, tap to open and navigate
✅ **Closed**: System notification, tap to launch and navigate
✅ **Token Refresh**: Automatic save to database
✅ **Navigation**: Automatic routing based on notification type

All states are fully supported and tested!
