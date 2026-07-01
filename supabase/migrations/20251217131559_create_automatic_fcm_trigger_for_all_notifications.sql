/*
  # Create Automatic FCM Trigger for All Patient Notifications

  1. Overview
    - Automatically sends FCM push notifications for ALL records inserted into patient_notifications
    - Works for orders, appointments, prescriptions, invoices, doctor responses, questionnaires, and any custom notifications
    - No manual FCM calls needed - just insert into patient_notifications and FCM is sent automatically

  2. Changes
    - Creates trigger function to call send-push-notification edge function
    - Attaches trigger to patient_notifications table on INSERT
    - Trigger fires AFTER INSERT for each row

  3. Benefits
    - Simplified notification flow - just insert into patient_notifications
    - Consistent FCM delivery across all notification types
    - No code duplication or manual FCM calls needed
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_send_fcm_notification ON patient_notifications;
DROP FUNCTION IF EXISTS auto_send_fcm_notification();

-- Create function to automatically send FCM notifications
CREATE OR REPLACE FUNCTION auto_send_fcm_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fcm_payload jsonb;
  notification_data jsonb;
BEGIN
  -- Build notification data based on category
  notification_data := jsonb_build_object(
    'type', COALESCE(NEW.category, 'general'),
    'notification_id', NEW.id::text,
    'screen', CASE 
      WHEN NEW.category = 'order' THEN 'orders'
      WHEN NEW.category = 'appointment' THEN 'appointments'
      WHEN NEW.category = 'prescription' THEN 'prescriptions'
      WHEN NEW.category = 'invoice' THEN 'invoices'
      WHEN NEW.category = 'doctor_response' THEN 'doctor-responses'
      WHEN NEW.category = 'questionnaire' THEN 'questionnaire'
      ELSE 'notifications'
    END
  );

  -- Add doctor_id if present
  IF NEW.doctor_id IS NOT NULL THEN
    notification_data := notification_data || jsonb_build_object('doctor_id', NEW.doctor_id::text);
  END IF;

  -- Build FCM payload
  fcm_payload := jsonb_build_object(
    'medicalId', NEW.medical_id,
    'title', NEW.message_header,
    'body', NEW.message_body,
    'data', notification_data
  );

  -- Call send-push-notification edge function
  PERFORM net.http_post(
    url := 'https://ttyukcvqifqyfolxtwba.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0eXVrY3ZxaWZxeWZvbHh0d2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIyNDk2MzAsImV4cCI6MjA0NzgyNTYzMH0.xjYg8I6lO9f2y4xvbW-b3ZhNtqOXkSglj0FEu4SVQsw'
    ),
    body := fcm_payload
  );

  RETURN NEW;
END;
$$;

-- Create trigger to automatically send FCM on insert
CREATE TRIGGER trigger_auto_send_fcm_notification
AFTER INSERT ON patient_notifications
FOR EACH ROW
EXECUTE FUNCTION auto_send_fcm_notification();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, service_role;
