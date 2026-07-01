/*
  # Fix Doctor Notifications FCM Trigger

  1. Changes
    - Updates the trigger function to correctly lookup global_id from users table via doctor email
    - Allows notifications to be inserted even if global_id is not found
    - Only sends FCM notifications if doctor has a valid global_id in users table

  2. Notes
    - Doctors are linked to users via email address
    - global_id exists in users table, not doctors table
*/

-- Drop and recreate the function with correct logic
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