/*
  # Create FCM Trigger for Doctor Notifications

  1. Changes
    - Creates a trigger that sends FCM push notifications when a new notification is inserted into `doctor_notifications` table
    - The trigger looks up the doctor's global_id and sends notifications via device tokens with that global_id
    - Uses the category and message fields to construct notification title and body

  2. Security
    - Notifications are sent asynchronously (doesn't block the main transaction)
    - Failed notifications don't prevent the database operation
    - Only sends to doctors with valid FCM tokens with matching global_id

  3. Notes
    - Since doctors use global_id for device tokens, we need to find the doctor's global_id
    - The trigger will look up the doctor's global_id from the doctors table or users table
    - Creates a simple notification format with category as title prefix
*/

-- Create the function that sends FCM notifications when a doctor notification is created
CREATE OR REPLACE FUNCTION send_fcm_on_doctor_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url TEXT := 'https://hmffzwvdgomzuqrzcmco.supabase.co';
  v_global_id TEXT;
  v_title TEXT;
  v_body TEXT;
  v_notification_data JSONB;
BEGIN
  -- Get the doctor's global_id from the doctors table
  SELECT global_id INTO v_global_id
  FROM doctors
  WHERE id = NEW.doctor_id
  LIMIT 1;

  -- If doctor doesn't have global_id in doctors table, skip notification
  IF v_global_id IS NULL THEN
    -- Log that we couldn't find global_id
    RAISE NOTICE 'No global_id found for doctor_id: %', NEW.doctor_id;
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trigger_send_fcm_on_doctor_notification ON doctor_notifications;

-- Create the trigger on doctor_notifications table
CREATE TRIGGER trigger_send_fcm_on_doctor_notification
AFTER INSERT ON doctor_notifications
FOR EACH ROW
EXECUTE FUNCTION send_fcm_on_doctor_notification();
