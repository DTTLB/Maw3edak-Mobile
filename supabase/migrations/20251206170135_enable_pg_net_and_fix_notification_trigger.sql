/*
  # Enable pg_net extension and fix notification trigger

  ## Changes
  1. Enable pg_net extension for HTTP requests
  2. Update notification trigger to properly call edge function
  
  ## How it works
  - pg_net allows database triggers to make HTTP requests
  - Trigger sends notification via edge function when doctor_order is created
*/

-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop and recreate the notification function with proper implementation
DROP FUNCTION IF EXISTS notify_patient_new_order() CASCADE;

CREATE OR REPLACE FUNCTION notify_patient_new_order()
RETURNS TRIGGER AS $$
DECLARE
  v_request_id BIGINT;
BEGIN
  -- Call the edge function to send notification using pg_net
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'patientId', NEW.patient_id::text,
      'title', 'New Order',
      'body', 'You have received a new order from your doctor',
      'data', jsonb_build_object(
        'orderId', NEW.id::text,
        'type', 'doctor_order'
      )
    )
  ) INTO v_request_id;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the insert
  RAISE WARNING 'Failed to send notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger for new doctor orders
DROP TRIGGER IF EXISTS trigger_notify_new_doctor_order ON doctor_orders;

CREATE TRIGGER trigger_notify_new_doctor_order
  AFTER INSERT ON doctor_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_patient_new_order();
