# Notification Navigation Guide

This guide explains how notifications navigate users to specific screens in the app.

## How It Works

When a user taps on a notification, the app automatically opens and navigates to the relevant screen based on the notification type.

### Supported Notification Types

| Type | Screen | Description |
|------|--------|-------------|
| `new_order` | Orders | New order from doctor |
| `new_appointment` | Appointments | New appointment scheduled |
| `appointment_reminder` | Appointments | Upcoming appointment reminder |
| `new_invoice` | Invoices | New invoice created |
| `invoice_due` | Invoices | Invoice payment due |
| `new_prescription` | Prescriptions | New prescription available |
| `doctor_response` | Doctor Responses | Doctor replied to your question |
| `new_nutrition` | Nutrition | New nutrition plan available |
| `nutrition_update` | Nutrition | Nutrition plan updated |
| `new_vision_test` | Vision | New vision test results |
| `vision_result` | Vision | Vision test completed |
| `new_dental` | Dental | New dental record |
| `dental_appointment` | Dental | Dental appointment scheduled |

## Current Implementation

### Order Notifications (✅ Implemented)

The order notification is already set up with the database trigger. When a new order is created:

```sql
-- Database automatically sends notification with:
{
  "type": "new_order",
  "order_id": "uuid",
  "doctor_name": "Dr. Name",
  "patient_name": "Patient Name"
}
```

When tapped → Opens **Orders** screen

## Adding More Notification Types

Here are examples for implementing other notification types:

### Example 1: Appointment Notifications

```sql
-- Create trigger for new appointments
CREATE OR REPLACE FUNCTION notify_new_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_function_url text := 'https://ttyukcvqifqyfolxtwba.supabase.co/functions/v1/send-push-notification';
  v_user_patient_id uuid;
  v_medical_id text;
  v_patient_name text;
  v_doctor_name text;
  v_appointment_date text;
BEGIN
  -- Get patient info
  SELECT medical_id, first_name INTO v_medical_id, v_patient_name
  FROM patients
  WHERE id = NEW.patient_id;

  -- Get doctor name
  SELECT full_name INTO v_doctor_name
  FROM doctors
  WHERE id = NEW.doctor_id;

  -- Format appointment date
  v_appointment_date := to_char(NEW.appointment_date, 'Day, Mon DD at HH:MI AM');

  -- Get user_patient_id
  IF v_medical_id IS NOT NULL THEN
    SELECT id INTO v_user_patient_id
    FROM user_patients
    WHERE medical_id = v_medical_id;

    IF v_user_patient_id IS NOT NULL THEN
      PERFORM net.http_post(
        url := v_function_url,
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object(
          'patientId', v_user_patient_id::text,
          'title', 'New Appointment Scheduled',
          'body', 'Dear ' || v_patient_name || ', your appointment with Dr. ' || v_doctor_name || ' is scheduled for ' || v_appointment_date,
          'data', jsonb_build_object(
            'type', 'new_appointment',
            'appointment_id', NEW.id,
            'doctor_name', v_doctor_name,
            'appointment_date', v_appointment_date
          )
        ),
        timeout_milliseconds := 5000
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER on_appointment_created
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_appointment();
```

### Example 2: Invoice Notifications

```sql
-- Create trigger for new invoices
CREATE OR REPLACE FUNCTION notify_new_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_function_url text := 'https://ttyukcvqifqyfolxtwba.supabase.co/functions/v1/send-push-notification';
  v_user_patient_id uuid;
  v_medical_id text;
  v_patient_name text;
BEGIN
  -- Get patient info
  SELECT medical_id, first_name INTO v_medical_id, v_patient_name
  FROM patients
  WHERE id = NEW.patient_id;

  -- Get user_patient_id
  IF v_medical_id IS NOT NULL THEN
    SELECT id INTO v_user_patient_id
    FROM user_patients
    WHERE medical_id = v_medical_id;

    IF v_user_patient_id IS NOT NULL THEN
      PERFORM net.http_post(
        url := v_function_url,
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object(
          'patientId', v_user_patient_id::text,
          'title', 'New Invoice',
          'body', 'Dear ' || v_patient_name || ', you have a new invoice for $' || NEW.amount,
          'data', jsonb_build_object(
            'type', 'new_invoice',
            'invoice_id', NEW.id,
            'amount', NEW.amount
          )
        ),
        timeout_milliseconds := 5000
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER on_invoice_created
  AFTER INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_invoice();
```

### Example 3: Doctor Response Notifications

```sql
-- Create trigger for doctor responses
CREATE OR REPLACE FUNCTION notify_doctor_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_function_url text := 'https://ttyukcvqifqyfolxtwba.supabase.co/functions/v1/send-push-notification';
  v_user_patient_id uuid;
  v_medical_id text;
  v_patient_name text;
  v_doctor_name text;
BEGIN
  -- Only notify when response is added (not on creation)
  IF NEW.response IS NOT NULL AND OLD.response IS NULL THEN
    -- Get patient info
    SELECT medical_id, first_name INTO v_medical_id, v_patient_name
    FROM patients
    WHERE id = NEW.patient_id;

    -- Get doctor name
    SELECT full_name INTO v_doctor_name
    FROM doctors
    WHERE id = NEW.doctor_id;

    -- Get user_patient_id
    IF v_medical_id IS NOT NULL THEN
      SELECT id INTO v_user_patient_id
      FROM user_patients
      WHERE medical_id = v_medical_id;

      IF v_user_patient_id IS NOT NULL THEN
        PERFORM net.http_post(
          url := v_function_url,
          headers := jsonb_build_object('Content-Type', 'application/json'),
          body := jsonb_build_object(
            'patientId', v_user_patient_id::text,
            'title', 'Doctor Response',
            'body', 'Dear ' || v_patient_name || ', Dr. ' || v_doctor_name || ' has responded to your question',
            'data', jsonb_build_object(
              'type', 'doctor_response',
              'question_id', NEW.id,
              'doctor_name', v_doctor_name
            )
          ),
          timeout_milliseconds := 5000
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER on_doctor_response
  AFTER UPDATE ON patient_questions
  FOR EACH ROW
  EXECUTE FUNCTION notify_doctor_response();
```

### Example 4: Nutrition Notifications

```sql
-- Create trigger for nutrition updates
CREATE OR REPLACE FUNCTION notify_nutrition_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_function_url text := 'https://ttyukcvqifqyfolxtwba.supabase.co/functions/v1/send-push-notification';
  v_user_patient_id uuid;
  v_medical_id text;
  v_patient_name text;
BEGIN
  -- Get patient info
  SELECT medical_id, first_name INTO v_medical_id, v_patient_name
  FROM patients
  WHERE id = NEW.patient_id;

  -- Get user_patient_id
  IF v_medical_id IS NOT NULL THEN
    SELECT id INTO v_user_patient_id
    FROM user_patients
    WHERE medical_id = v_medical_id;

    IF v_user_patient_id IS NOT NULL THEN
      PERFORM net.http_post(
        url := v_function_url,
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object(
          'patientId', v_user_patient_id::text,
          'title', 'New Nutrition Plan',
          'body', 'Dear ' || v_patient_name || ', your personalized nutrition plan is now available',
          'data', jsonb_build_object(
            'type', 'new_nutrition',
            'nutrition_id', NEW.id
          )
        ),
        timeout_milliseconds := 5000
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER on_nutrition_created
  AFTER INSERT ON nutrition_plans
  FOR EACH ROW
  EXECUTE FUNCTION notify_nutrition_update();
```

### Example 5: Vision Test Notifications

```sql
-- Create trigger for vision test results
CREATE OR REPLACE FUNCTION notify_vision_test()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_function_url text := 'https://ttyukcvqifqyfolxtwba.supabase.co/functions/v1/send-push-notification';
  v_user_patient_id uuid;
  v_medical_id text;
  v_patient_name text;
BEGIN
  -- Only notify when results are available
  IF NEW.results IS NOT NULL AND OLD.results IS NULL THEN
    -- Get patient info
    SELECT medical_id, first_name INTO v_medical_id, v_patient_name
    FROM patients
    WHERE id = NEW.patient_id;

    -- Get user_patient_id
    IF v_medical_id IS NOT NULL THEN
      SELECT id INTO v_user_patient_id
      FROM user_patients
      WHERE medical_id = v_medical_id;

      IF v_user_patient_id IS NOT NULL THEN
        PERFORM net.http_post(
          url := v_function_url,
          headers := jsonb_build_object('Content-Type', 'application/json'),
          body := jsonb_build_object(
            'patientId', v_user_patient_id::text,
            'title', 'Vision Test Results',
            'body', 'Dear ' || v_patient_name || ', your vision test results are ready',
            'data', jsonb_build_object(
              'type', 'vision_result',
              'vision_test_id', NEW.id
            )
          ),
          timeout_milliseconds := 5000
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER on_vision_test_result
  AFTER UPDATE ON vision_tests
  FOR EACH ROW
  EXECUTE FUNCTION notify_vision_test();
```

### Example 6: Dental Notifications

```sql
-- Create trigger for dental appointments/records
CREATE OR REPLACE FUNCTION notify_dental_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_function_url text := 'https://ttyukcvqifqyfolxtwba.supabase.co/functions/v1/send-push-notification';
  v_user_patient_id uuid;
  v_medical_id text;
  v_patient_name text;
BEGIN
  -- Get patient info
  SELECT medical_id, first_name INTO v_medical_id, v_patient_name
  FROM patients
  WHERE id = NEW.patient_id;

  -- Get user_patient_id
  IF v_medical_id IS NOT NULL THEN
    SELECT id INTO v_user_patient_id
    FROM user_patients
    WHERE medical_id = v_medical_id;

    IF v_user_patient_id IS NOT NULL THEN
      PERFORM net.http_post(
        url := v_function_url,
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object(
          'patientId', v_user_patient_id::text,
          'title', 'Dental Update',
          'body', 'Dear ' || v_patient_name || ', you have a new dental record available',
          'data', jsonb_build_object(
            'type', 'new_dental',
            'dental_id', NEW.id
          )
        ),
        timeout_milliseconds := 5000
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER on_dental_record_created
  AFTER INSERT ON dental_records
  FOR EACH ROW
  EXECUTE FUNCTION notify_dental_update();
```

## Testing Navigation

To test notification navigation:

1. **Send a test notification**:
```sql
-- Insert a test order to trigger notification
INSERT INTO doctor_orders (doctor_id, patient_id, company_id, description)
VALUES (
  'doctor-uuid',
  'patient-uuid',
  'company-uuid',
  'Blood Test - CBC'
);
```

2. **Tap the notification** on your device

3. **App should open** and navigate to the Orders screen

## Important Notes

- Navigation works when app is:
  - ✅ In background (minimized)
  - ✅ Completely closed (quit state)
  - ✅ In foreground (currently open)

- All notification data must include:
  - `type`: The notification type (e.g., "new_order")
  - `[resource]_id`: The ID of the resource (e.g., "order_id", "appointment_id")

- The navigation is instant and automatic - no user action needed except tapping the notification
