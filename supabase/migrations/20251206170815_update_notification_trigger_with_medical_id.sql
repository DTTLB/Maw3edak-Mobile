/*
  # Update notification trigger to use medical_id relationship

  Updates the notification trigger to properly match patients:
  1. Gets patient_id from doctor_orders
  2. Looks up medical_id from patients table
  3. Finds matching user_patients record by medical_id
  4. Uses user_patients.id to find device token

  This ensures notifications are sent to the correct mobile app user.
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_order_created ON doctor_orders;
DROP FUNCTION IF EXISTS notify_new_order();

-- Create updated function that uses medical_id relationship
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
  v_function_url text;
  v_user_patient_id uuid;
  v_medical_id text;
BEGIN
  -- Get the Supabase function URL
  v_function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification';
  
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
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
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
