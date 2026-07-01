/*
  # Recreate Doctor Notifications FCM Trigger

  1. Purpose
    - Ensures the FCM trigger is properly attached to the doctor_notifications table
    - This trigger sends push notifications when new doctor notifications are created

  2. Changes
    - Drops existing trigger if exists
    - Recreates the trigger function with correct logic
    - Attaches the trigger to doctor_notifications table for INSERT operations
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_send_fcm_on_doctor_notification ON doctor_notifications;

-- Recreate the function to send FCM notifications
CREATE OR REPLACE FUNCTION send_fcm_on_doctor_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url TEXT := 'https://hmffzwvdgomzuqrzcmco.supabase.co';
  v_global_id TEXT;
  v_title TEXT;
  v_body TEXT;
  v_notification_data JSONB;
BEGIN
  -- Get the doctor's global_id by joining to users table via email
  SELECT u.global_id INTO v_global_id
  FROM doctors d
  LEFT JOIN users u ON d.email = u.email
  WHERE d.id = NEW.doctor_id
  LIMIT 1;

  -- If doctor doesn't have global_id, skip notification but allow insert
  IF v_global_id IS NULL THEN
    RAISE NOTICE 'No global_id found for doctor_id: %, skipping FCM notification', NEW.doctor_id;
    RETURN NEW;
  END IF;

  -- Construct title from category
  v_title := INITCAP(COALESCE(NEW.category, 'Notification'));
  
  -- Use message as body
  v_body := COALESCE(NEW.message, 'You have a new notification');

  -- Prepare notification data
  v_notification_data := jsonb_build_object(
    'notificationId', NEW.id,
    'category', COALESCE(NEW.category, 'notification'),
    'objectiveId', NEW.objective_id,
    'patientId', NEW.patient_id
  );

  -- Send notification via edge function using global_id
  BEGIN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/send-doctor-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'globalId', v_global_id,
        'title', v_title,
        'body', v_body,
        'data', v_notification_data
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE NOTICE 'Failed to send FCM notification: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on doctor_notifications table
CREATE TRIGGER trigger_send_fcm_on_doctor_notification
  AFTER INSERT ON doctor_notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_fcm_on_doctor_notification();