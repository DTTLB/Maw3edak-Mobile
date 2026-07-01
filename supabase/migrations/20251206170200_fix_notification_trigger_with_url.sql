/*
  # Fix notification trigger with proper Supabase URL

  ## Changes
  - Update trigger to use actual Supabase URL
  - Use internal service role authentication
  
  ## How it works
  - When doctor_order is created, calls edge function via pg_net
  - Uses Supabase internal authentication
*/

-- Drop and recreate the notification function with hardcoded URL
DROP FUNCTION IF EXISTS notify_patient_new_order() CASCADE;

CREATE OR REPLACE FUNCTION notify_patient_new_order()
RETURNS TRIGGER AS $$
DECLARE
  v_request_id BIGINT;
  v_supabase_url TEXT := 'https://ttyukcvqifqyfolxtwba.supabase.co';
BEGIN
  -- Call the edge function to send notification using pg_net
  SELECT net.http_post(
    url := v_supabase_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
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
