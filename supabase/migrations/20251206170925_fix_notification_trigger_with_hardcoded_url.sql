/*
  # Fix notification trigger with proper URL

  Updates the notification trigger to use the correct Supabase URL.
  The function URL is hardcoded since database settings are not configured.
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_order_created ON doctor_orders;
DROP FUNCTION IF EXISTS notify_new_order();

-- Create updated function with hardcoded URL
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
  v_function_url text := 'https://ttyukcvqifqyfolxtwba.supabase.co/functions/v1/send-push-notification';
  v_service_role_key text := current_setting('request.jwt.claim.sub', true);
  v_user_patient_id uuid;
  v_medical_id text;
BEGIN
  -- Get medical_id from patients table
  SELECT medical_id INTO v_medical_id
  FROM patients
  WHERE id = NEW.patient_id;
  
  -- If medical_id found, get the corresponding user_patients.id
  IF v_medical_id IS NOT NULL THEN
    SELECT id INTO v_user_patient_id
    FROM user_patients
    WHERE medical_id = v_medical_id;
    
    -- If user_patient found, send notification
    IF v_user_patient_id IS NOT NULL THEN
      PERFORM net.http_post(
        url := v_function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'patient_id', v_user_patient_id,
          'title', 'New Order',
          'body', 'You have received a new order from your doctor',
          'data', jsonb_build_object(
            'order_id', NEW.id,
            'type', 'new_order'
          )
        ),
        timeout_milliseconds := 5000
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_order_created
  AFTER INSERT ON doctor_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_order();
