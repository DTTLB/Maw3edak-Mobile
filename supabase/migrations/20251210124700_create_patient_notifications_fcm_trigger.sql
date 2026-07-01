/*
  # Create FCM Trigger for Patient Notifications

  1. Changes
    - Creates a trigger that sends FCM push notifications when a new notification is inserted into `patient_notifications` table
    - The trigger looks up the patient's FCM device tokens and sends notifications via the `send-push-notification` edge function
    - Uses the message_header as the notification title and message_body as the notification body

  2. Security
    - Notifications are sent asynchronously (doesn't block the main transaction)
    - Failed notifications don't prevent the database operation
    - Only sends to patients with valid FCM tokens
*/

-- Create the function that sends FCM notifications when a patient notification is created
CREATE OR REPLACE FUNCTION send_fcm_on_patient_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url TEXT := 'https://hmffzwvdgomzuqrzcmco.supabase.co';
BEGIN
  -- Send notification via edge function for the patient's FCM token(s)
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
        'type', COALESCE(NEW.category, 'notification')
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trigger_send_fcm_on_patient_notification ON patient_notifications;

-- Create the trigger on patient_notifications table
CREATE TRIGGER trigger_send_fcm_on_patient_notification
AFTER INSERT ON patient_notifications
FOR EACH ROW
EXECUTE FUNCTION send_fcm_on_patient_notification();
