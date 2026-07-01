/*
  # Fix Doctor Notification Trigger URL

  1. Problem
    - Trigger uses hardcoded wrong Supabase URL (hmffzwvdgomzuqrzcmco)
    - Should use correct URL (ttyukcvqifqyfolxtwba) 

  2. Solution
    - Update trigger function with correct Supabase URL
*/

-- Drop and recreate with correct URL
DROP TRIGGER IF EXISTS trigger_send_fcm_on_doctor_notification ON doctor_notifications;
DROP FUNCTION IF EXISTS send_fcm_on_doctor_notification();

-- Create function with CORRECT Supabase URL
CREATE OR REPLACE FUNCTION send_fcm_on_doctor_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url TEXT := 'https://ttyukcvqifqyfolxtwba.supabase.co';
  v_global_id TEXT;
  v_title TEXT;
  v_body TEXT;
  v_notification_data JSONB;
BEGIN
  v_global_id := NEW.global_id;

  IF v_global_id IS NULL OR v_global_id = '' THEN
    RAISE NOTICE 'No global_id in notification record, skipping FCM notification';
    RETURN NEW;
  END IF;

  v_title := COALESCE(NEW.message_header, INITCAP(COALESCE(NEW.category, 'Notification')));
  v_body := COALESCE(NEW.message_body, 'You have a new notification');

  v_notification_data := jsonb_build_object(
    'notificationId', NEW.id,
    'category', COALESCE(NEW.category, 'notification'),
    'objectiveId', NEW.objective_id,
    'companyId', NEW.company_id
  );

  RAISE NOTICE 'Sending FCM notification to global_id: %, title: %, body: %', v_global_id, v_title, v_body;

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
    RAISE NOTICE 'Failed to send FCM notification: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER trigger_send_fcm_on_doctor_notification
  AFTER INSERT ON doctor_notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_fcm_on_doctor_notification();
