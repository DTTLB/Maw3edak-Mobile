/*
  # Fix FCM Trigger Data Field
  
  1. Changes
    - Updates the FCM trigger to pass notification data in the correct format
    - Adds type field to data object for proper navigation handling
    
  2. Security
    - Maintains existing security posture
*/

CREATE OR REPLACE FUNCTION send_fcm_on_patient_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url TEXT := 'https://hmffzwvdgomzuqrzcmco.supabase.co';
BEGIN
  IF NEW.medical_id IS NOT NULL AND NEW.message_header IS NOT NULL AND NEW.message_body IS NOT NULL THEN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'medicalId', NEW.medical_id,
        'title', NEW.message_header,
        'body', NEW.message_body,
        'data', jsonb_build_object(
          'type', LOWER(COALESCE(NEW.category, 'notification')),
          'notification_id', NEW.id::text
        )
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;