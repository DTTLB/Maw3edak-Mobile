/*
  # Fix FCM Trigger for Background Notifications

  1. Changes
    - Updates the FCM trigger to properly send push notifications when app is closed
    - Adds better error handling and logging
    - Ensures the edge function is called with correct parameters
    - Adds data field for proper navigation when notification is tapped

  2. How it Works
    - When a notification is inserted into patient_notifications table
    - The trigger automatically calls the send-push-notification edge function
    - The edge function sends FCM notification to all active devices
    - Includes navigation data so app can open the correct screen
*/

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS trigger_send_fcm_on_patient_notification ON patient_notifications;
DROP FUNCTION IF EXISTS send_fcm_on_patient_notification();

-- Create improved function with better error handling
CREATE OR REPLACE FUNCTION send_fcm_on_patient_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url TEXT := 'https://hmffzwvdgomzuqrzcmco.supabase.co';
  v_request_id BIGINT;
BEGIN
  -- Only send FCM if we have all required data
  IF NEW.medical_id IS NOT NULL AND 
     NEW.message_header IS NOT NULL AND 
     NEW.message_body IS NOT NULL THEN
    
    -- Log that we're sending a notification
    RAISE LOG 'Sending FCM notification for patient_notification id: %, medical_id: %, category: %', 
              NEW.id, NEW.medical_id, NEW.category;
    
    -- Send notification via edge function
    SELECT net.http_post(
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
          'notificationId', NEW.id::text,
          'category', NEW.category,
          'screen', CASE 
            WHEN NEW.category = 'Appointment' THEN 'appointments'
            WHEN NEW.category = 'Order' THEN 'orders'
            ELSE 'notifications'
          END
        )
      )
    ) INTO v_request_id;
    
    RAISE LOG 'FCM request initiated with id: %', v_request_id;
    
  ELSE
    RAISE WARNING 'Skipping FCM notification - missing required data: medical_id=%, header=%, body=%',
                  NEW.medical_id IS NOT NULL, 
                  NEW.message_header IS NOT NULL, 
                  NEW.message_body IS NOT NULL;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the insert
  RAISE WARNING 'Failed to send FCM notification: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER trigger_send_fcm_on_patient_notification
AFTER INSERT ON patient_notifications
FOR EACH ROW
EXECUTE FUNCTION send_fcm_on_patient_notification();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
