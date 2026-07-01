/*
  # Fix FCM Notification Delivery
  
  1. Changes
    - Add Authorization header to all notification triggers
    - Use correct Supabase URL consistently
    - Ensure edge functions receive proper authentication
    
  2. Why This Fixes Notifications
    - Edge functions require either service role or anon key authorization
    - Without Authorization header, requests are rejected
    - This prevents notifications from being sent
*/

-- Store the Supabase URL and anon key in database settings
-- These will be used by all notification triggers
DO $$
BEGIN
  -- Set the correct Supabase URL
  PERFORM set_config('app.settings.supabase_url', 'https://ttyukcvqifqyfolxtwba.supabase.co', false);
  
  -- Set the anon key for authorization
  PERFORM set_config('app.settings.supabase_anon_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0eXVrY3ZxaWZxeWZvbHh0d2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1MzExNjIsImV4cCI6MjA0ODEwNzE2Mn0.Gk2dqv0cI1NlAjjm1Cza8XJ3vIcPYE8rvR6bYz-Y-gk', false);
END $$;

-- Update patient notifications FCM trigger with authorization
CREATE OR REPLACE FUNCTION send_fcm_on_patient_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url TEXT;
  v_anon_key TEXT;
BEGIN
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_anon_key := current_setting('app.settings.supabase_anon_key', true);
  
  IF NEW.medical_id IS NOT NULL AND NEW.message_header IS NOT NULL AND NEW.message_body IS NOT NULL THEN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_anon_key
      ),
      body := jsonb_build_object(
        'medicalId', NEW.medical_id,
        'title', NEW.message_header,
        'body', NEW.message_body,
        'data', jsonb_build_object(
          'type', COALESCE(NEW.category, 'notification'),
          'notification_id', NEW.id::text
        )
      ),
      timeout_milliseconds := 5000
    );
    
    RAISE LOG 'Sent FCM notification for medical_id: %, notification_id: %', NEW.medical_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update appointment notification trigger with authorization
CREATE OR REPLACE FUNCTION notify_appointment_created()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url TEXT;
  v_anon_key TEXT;
  v_user_patient_id UUID;
  v_medical_id TEXT;
  v_patient_name TEXT;
  v_doctor_name TEXT;
  v_appointment_date_str TEXT;
  v_notification_body TEXT;
BEGIN
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_anon_key := current_setting('app.settings.supabase_anon_key', true);
  
  SELECT medical_id, first_name INTO v_medical_id, v_patient_name
  FROM patients
  WHERE id = NEW.patient_id;
  
  SELECT full_name INTO v_doctor_name
  FROM doctors
  WHERE id = NEW.doctor_id;
  
  v_appointment_date_str := TO_CHAR(NEW.appointment_date, 'DD/MM/YYYY') || ' at ' || NEW.appointment_time;
  
  IF v_medical_id IS NOT NULL THEN
    SELECT id INTO v_user_patient_id
    FROM user_patients
    WHERE medical_id = v_medical_id;
    
    IF v_user_patient_id IS NOT NULL THEN
      v_notification_body := 'Dear ' || COALESCE(v_patient_name, 'Patient') || 
                            ', you have an appointment with Dr. ' || 
                            COALESCE(v_doctor_name, 'Doctor') || 
                            ' on ' || v_appointment_date_str;
      
      PERFORM net.http_post(
        url := v_supabase_url || '/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_anon_key
        ),
        body := jsonb_build_object(
          'patientId', v_user_patient_id::text,
          'title', 'New Appointment Booked',
          'body', v_notification_body,
          'data', jsonb_build_object(
            'appointment_id', NEW.id::text,
            'type', 'new_appointment',
            'screen', 'appointments',
            'doctor_name', v_doctor_name,
            'patient_name', v_patient_name,
            'appointment_date', v_appointment_date_str
          )
        ),
        timeout_milliseconds := 5000
      );
      
      RAISE LOG 'Sent appointment notification for patient_id: %, appointment_id: %', v_user_patient_id, NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update questionnaire notification trigger with authorization
CREATE OR REPLACE FUNCTION notify_questionnaire_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url TEXT;
  v_anon_key TEXT;
  v_patient_id UUID;
  v_questionnaire_name TEXT;
BEGIN
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_anon_key := current_setting('app.settings.supabase_anon_key', true);
  
  SELECT id INTO v_patient_id
  FROM user_patients
  WHERE medical_id = NEW.patient_medical_id;
  
  SELECT name INTO v_questionnaire_name
  FROM patient_questionnaires
  WHERE id = NEW.questionnaire_id;
  
  IF v_patient_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_anon_key
      ),
      body := jsonb_build_object(
        'patientId', v_patient_id::text,
        'title', 'New Questionnaire Assigned',
        'body', 'You have been assigned: ' || COALESCE(v_questionnaire_name, 'a questionnaire'),
        'data', jsonb_build_object(
          'assignment_id', NEW.id::text,
          'questionnaire_id', NEW.questionnaire_id::text,
          'type', 'questionnaire',
          'screen', 'questionnaires'
        )
      ),
      timeout_milliseconds := 5000
    );
    
    RAISE LOG 'Sent questionnaire notification for patient_id: %, assignment_id: %', v_patient_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;