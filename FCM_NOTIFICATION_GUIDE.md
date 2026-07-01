# FCM Notification Guide

## Overview
FCM notifications are now **fully automatic** for ALL records in `patient_notifications`.

**How it works:**
- Just insert a record into `patient_notifications`
- FCM push notification is sent automatically via database trigger
- No manual FCM calls needed!

**Works for ALL notification types:**
- Orders
- Appointments
- Prescriptions
- Invoices
- Doctor responses
- Questionnaires
- Lab results
- Any custom notifications

## How to Send Notifications

### Simple Pattern (Automatic FCM)

Just insert into `patient_notifications` - FCM is sent automatically:

```typescript
// Just insert - FCM is sent automatically!
const { data: notification, error: notifError } = await supabase
  .from('patient_notifications')
  .insert({
    medical_id: 'PATIENT_MEDICAL_ID',
    message_header: 'New Order Created',
    message_body: 'Your order #123 has been created',
    category: 'order',
    doctor_id: doctorId, // optional
    is_read: false,
  })
  .select()
  .single();

// That's it! FCM push notification sent automatically via database trigger
```

### From Your Web Project

This works for ANY notification type - orders, appointments, prescriptions, etc.

#### Example 1: Order Notification

```javascript
// Create order and notification - FCM sent automatically!
async function createOrderWithNotification(orderData) {
  const { data: order } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  // Insert notification - FCM sent automatically via trigger
  await supabase
    .from('patient_notifications')
    .insert({
      medical_id: order.patient_medical_id,
      message_header: 'New Order',
      message_body: `Order #${order.id} has been created`,
      category: 'order',
      is_read: false,
    });

  return order;
}
```

#### Example 2: Appointment Notification

```javascript
async function createAppointmentWithNotification(appointmentData) {
  const { data: appointment } = await supabase
    .from('appointments')
    .insert(appointmentData)
    .select()
    .single();

  // Insert notification - FCM sent automatically via trigger
  await supabase
    .from('patient_notifications')
    .insert({
      medical_id: appointment.patient_medical_id,
      message_header: 'Appointment Confirmed',
      message_body: `Your appointment on ${appointmentData.date} has been confirmed`,
      category: 'appointment',
      is_read: false,
    });

  return appointment;
}
```

#### Example 3: Prescription Notification

```javascript
async function createPrescriptionWithNotification(prescriptionData) {
  const { data: prescription } = await supabase
    .from('prescriptions')
    .insert(prescriptionData)
    .select()
    .single();

  // Insert notification - FCM sent automatically via trigger
  await supabase
    .from('patient_notifications')
    .insert({
      medical_id: prescription.patient_medical_id,
      message_header: 'New Prescription',
      message_body: 'You have a new prescription from your doctor',
      category: 'prescription',
      doctor_id: prescriptionData.doctor_id,
      is_read: false,
    });

  return prescription;
}
```

#### Example 4: Generic Notification

```javascript
// Send any custom notification
async function sendCustomNotification(medicalId, title, body, category) {
  // Just insert - FCM sent automatically via trigger
  await supabase
    .from('patient_notifications')
    .insert({
      medical_id: medicalId,
      message_header: title,
      message_body: body,
      category: category,
      is_read: false,
    });
}

// Usage - That's all you need!
await sendCustomNotification(
  'P12345',
  'Lab Results Ready',
  'Your lab results are now available',
  'lab_results'
);
```

## Important Notes

### ✅ Benefits of Automatic FCM Trigger
- **No manual FCM calls needed** - just insert into patient_notifications
- **Works for ALL notification types** - orders, appointments, prescriptions, invoices, etc.
- **Consistent delivery** - every notification is guaranteed to send FCM
- **Simplified codebase** - no code duplication
- **Works everywhere** - edge functions, web projects, mobile apps
- **Automatic screen routing** - trigger intelligently routes to correct screen based on category

### 🎯 How the Trigger Works
When you insert into `patient_notifications`, the database trigger:
1. Reads the notification data (medical_id, message_header, message_body, category)
2. Builds the FCM payload with proper screen routing based on category
3. Calls the `send-push-notification` edge function automatically
4. Handles all device tokens for that patient

### 📱 Automatic Screen Routing
The trigger automatically routes notifications to the correct screen:
- `order` → screens: 'orders'
- `appointment` → screen: 'appointments'
- `prescription` → screen: 'prescriptions'
- `invoice` → screen: 'invoices'
- `doctor_response` → screen: 'doctor-responses'
- `questionnaire` → screen: 'questionnaire'
- All others → screen: 'notifications'

### ⚠️ Key Points
1. **Just insert into `patient_notifications`** - FCM happens automatically
2. **Use correct category** - This determines screen routing
3. **Include medical_id** - Required for device token lookup
4. **Optional doctor_id** - Include for doctor-related notifications
5. **No error handling needed** - Trigger handles FCM failures gracefully

### 🔑 Database Trigger Details
- **Trigger Name**: `trigger_auto_send_fcm_notification`
- **Fires**: AFTER INSERT on `patient_notifications`
- **Function**: `auto_send_fcm_notification()`
- **What it does**: Automatically calls `send-push-notification` edge function for each new notification

## Edge Function (For Reference Only)

You don't need to call this directly - the trigger calls it automatically.

**Edge Function URL:**
```
https://ttyukcvqifqyfolxtwba.supabase.co/functions/v1/send-push-notification
```

**Request Body Format (Handled by Trigger):**
```typescript
{
  medicalId: string;
  title: string;
  body: string;
  data: {
    type: string;
    notification_id: string;
    screen: string;
    doctor_id?: string;
  }
}
```

## Testing

### From Your Web Project
Just insert a notification and check your mobile app:

```javascript
await supabase
  .from('patient_notifications')
  .insert({
    medical_id: 'YOUR_TEST_MEDICAL_ID',
    message_header: 'Test Notification',
    message_body: 'Testing automatic FCM trigger',
    category: 'order',
    is_read: false,
  });
```

The notification should appear on your mobile device automatically!
