/*
  # Add automatic notifications for new orders

  ## Changes
  1. Create function to send notification when doctor_order is created
  2. Add trigger to automatically call notification function on insert
  
  ## How it works
  - When a new doctor_order is inserted, the trigger fires
  - Gets the patient's info and sends a push notification
  - Uses Supabase Edge Function to send the notification
*/

-- Function to send notification when a new order is created
CREATE OR REPLACE FUNCTION notify_patient_new_order()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
  v_response TEXT;
BEGIN
  -- Get environment variables
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_service_key := current_setting('app.settings.service_role_key', true);
  
  -- Call the edge function to send notification
  -- Using pg_net extension if available, otherwise log for manual processing
  BEGIN
    PERFORM
      net.http_post(
        url := v_supabase_url || '/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_key
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
      );
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to send notification: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new doctor orders
DROP TRIGGER IF EXISTS trigger_notify_new_doctor_order ON doctor_orders;

CREATE TRIGGER trigger_notify_new_doctor_order
  AFTER INSERT ON doctor_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_patient_new_order();
