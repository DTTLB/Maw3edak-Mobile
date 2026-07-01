/*
  # Fix Doctor Notifications FCM Trigger

  1. Problem
    - The trigger on doctor_notifications table is missing/not active
    - The trigger function references incorrect columns (doctor_id doesn't exist)
    - The table has global_id, message_header, and message_body directly

  2. Solution
    - Drop and recreate the trigger function with correct column references
    - Use NEW.global_id directly (no join needed)
    - Use NEW.message_header as title
    - Use NEW.message_body as body
    - Attach the trigger to doctor_notifications table

  3. Changes
    - Creates proper trigger function that sends FCM via edge function
    - Uses correct column names from doctor_notifications table
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_send_fcm_on_doctor_notification ON doctor_notifications;
DROP FUNCTION IF EXISTS send_fcm_on_doctor_notification();

-- Create the function to send FCM notifications
CREATE OR REPLACE FUNCTION send_fcm_on_doctor_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url TEXT := 'https://hmffzwvdgomzuqrzcmco.supabase.co';
  v_global_id TEXT;
  v_title TEXT;
  v_body TEXT;
  v_notification_data JSONB;
BEGIN
  -- Use the global_id directly from the notification record
  v_global_id := NEW.global_id;

  -- If global_id is missing, skip notification but allow insert
  IF v_global_id IS NULL OR v_global_id = '' THEN
    RAISE NOTICE 'No global_id in notification record, skipping FCM notification';
    RETURN NEW;
  END IF;

  -- Use message_header as title, fallback to category
  v_title := COALESCE(NEW.message_header, INITCAP(COALESCE(NEW.category, 'Notification')));
  
  -- Use message_body as body
  v_body := COALESCE(NEW.message_body, 'You have a new notification');

  -- Prepare notification data
  v_notification_data := jsonb_build_object(
    'notificationId', NEW.id,
    'category', COALESCE(NEW.category, 'notification'),
    'objectiveId', NEW.objective_id,
    'companyId', NEW.company_id
  );

  -- Log what we're about to send
  RAISE NOTICE 'Sending FCM notification to global_id: %, title: %, body: %', v_global_id, v_title, v_body;

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
    RAISE NOTICE 'FCM notification request sent successfully';
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

-- Verify the trigger was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_send_fcm_on_doctor_notification'
  ) THEN
    RAISE NOTICE '✅ Trigger created successfully on doctor_notifications table';
  ELSE
    RAISE EXCEPTION '❌ Failed to create trigger on doctor_notifications table';
  END IF;
END $$;
