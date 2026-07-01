# Single Device Login Implementation

## Overview
This document explains how the single-device-only login system works in the device token management.

## Behavior

When a user logs in from a new device or FCM token:

1. **All previous devices are deactivated** - Their `is_active` flag is set to `false`
2. **Current device is activated** - The new/current device token is saved with `is_active = true`
3. **Notifications only go to active device** - Only devices with `is_active = true` receive push notifications

## Example Flow

```
1. User logs in from Phone A
   → Device A: active = true

2. User logs in from Tablet B
   → Device A: active = false (deactivated)
   → Device B: active = true

3. User logs back in from Phone A
   → Device B: active = false (deactivated)
   → Device A: active = true
```

## Database Implementation

### Migration
File: `supabase/migrations/add_upsert_device_token_function.sql`

The database function `upsert_device_token()` handles:
- Deactivating all other devices for the patient
- Inserting new token OR updating existing token
- Setting current device as active

### Unique Constraint
```sql
UNIQUE (patient_id, fcm_token)
```
This ensures:
- Same patient can't have duplicate token entries
- Supports upsert operations efficiently
- Prevents data duplication

## Edge Function Implementation

### mobile-save-device-token
File: `supabase/functions/mobile-save-device-token/index.ts`

**Logic:**
1. Validate FCM token (reject Expo tokens)
2. Deactivate all other devices for this patient
3. Try to use `upsert_device_token()` RPC function
4. Fallback to manual upsert if RPC fails:
   - Check if token exists
   - Update if exists, insert if new
5. Always set current device as `is_active = true`

## Notification Delivery

### send-push-notification
File: `supabase/functions/send-push-notification/index.ts`

**Key filter:**
```typescript
.eq('medical_id', targetMedicalId)
.eq('is_active', true)  // Only active devices
```

This ensures notifications are ONLY sent to the currently active device.

## Security Benefits

1. **Prevents unauthorized access** - Old devices stop receiving notifications
2. **Session control** - Users can't maintain multiple active sessions
3. **Audit trail** - All device login history is preserved (is_active flag shows which was last)
4. **No data loss** - Device records are never deleted, only deactivated

## Testing

To verify single-device mode:

1. Login from Device A
2. Check device_tokens table - Device A should have `is_active = true`
3. Login from Device B
4. Check device_tokens table:
   - Device A should have `is_active = false`
   - Device B should have `is_active = true`
5. Send test notification
6. Only Device B should receive the notification

## Switching to Multi-Device Mode

If you want to allow multiple active devices, modify:

1. **mobile-save-device-token function:**
   - Remove the deactivation step (lines 80-90)
   - Keep the upsert logic

2. **No database changes needed** - The unique constraint still works

## Database Queries

### View all device tokens for a patient
```sql
SELECT medical_id, fcm_token, device_model, is_active, updated_at
FROM device_tokens
WHERE medical_id = 'MEDICAL_ID'
ORDER BY updated_at DESC;
```

### View only active devices
```sql
SELECT medical_id, fcm_token, device_model, updated_at
FROM device_tokens
WHERE medical_id = 'MEDICAL_ID' AND is_active = true;
```

### Manually deactivate all devices for a patient
```sql
UPDATE device_tokens
SET is_active = false
WHERE medical_id = 'MEDICAL_ID';
```
