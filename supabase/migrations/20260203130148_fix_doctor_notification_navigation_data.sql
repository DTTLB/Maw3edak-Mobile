/*
  # Fix Doctor Notification Navigation Data

  1. Problem
    - Doctor notifications don't include userType or navigation type
    - App opens patient screens instead of doctor screens

  2. Solution
    - Add userType and type fields for proper navigation
    - Include category-based navigation type
*/

DROP TRIGGER IF EXISTS trigger_send_fcm_on_doctor_notification ON doctor_notifications;
DROP FUNCTION IF EXISTS send_fcm_on_doctor_notification();

CREATE OR REPLACE FUNCTION send_fcm_on_doctor_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url TEXT := 'https://ttyukcvqifqyfolxtwba.supabase.co';
  v_global_id TEXT;
  v_title TEXT;
  v_body TEXT;
  v_notification_data JSONB;
  v_type TEXT;
BEGIN
  v_global_id := NEW.global_id;

  IF v_global_id IS NULL OR v_global_id = '' THEN
    RAISE NOTICE 'No global_id in notification record, skipping FCM notification';
    RETURN NEW;
  END IF;

  v_title := COALESCE(NEW.message_header, INITCAP(COALESCE(NEW.category, 'Notification')));
  v_body := COALESCE(NEW.message_body, 'You have a new notification');

  -- Map category to navigation type
  v_type := CASE 
    WHEN NEW.category = 'appointment' THEN 'doctor_appointment'
    WHEN NEW.category = 'order' THEN 'doctor_order'
    WHEN NEW.category = 'prescription' THEN 'doctor_prescription'
    WHEN NEW.category = 'patient' THEN 'doctor_patient'
    WHEN NEW.category = 'authorization' THEN 'doctor_authorization'
    ELSE 'doctor_notification'
  END;

  v_notification_data := jsonb_build_object(
    'notificationId', NEW.id,
    'category', COALESCE(NEW.category, 'notification'),
    'objectiveId', NEW.objective_id,
    'companyId', NEW.company_id,
    'userType', 'doctor',
    'type', v_type
  );

  RAISE NOTICE 'Sending FCM notification to doctor global_id: %, type: %', v_global_id, v_type;

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

CREATE TRIGGER trigger_send_fcm_on_doctor_notification
  AFTER INSERT ON doctor_notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_fcm_on_doctor_notification();
