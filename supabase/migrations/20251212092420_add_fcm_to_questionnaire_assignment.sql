/*
  # Add FCM Push Notification to Questionnaire Assignment
  
  1. Changes
    - Update the `notify_patient_questionnaire_assignment()` function to:
      - Insert record into patient_notifications (already exists)
      - Send FCM push notification using net.http_post (NEW)
      - Include personalized notification with patient name, doctor name, and questionnaire title
      - Add navigation data for mobile app to open correct screen
  
  2. Pattern
    - Follows the same pattern as order and appointment notifications
    - Uses the same Supabase URL: ttyukcvqifqyfolxtwba.supabase.co
    - Sends notification to send-push-notification edge function
    
  3. Security
    - Function maintains SECURITY DEFINER to access pg_net
    - No changes to RLS policies
*/

CREATE OR REPLACE FUNCTION public.notify_patient_questionnaire_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_function_url TEXT := 'https://ttyukcvqifqyfolxtwba.supabase.co/functions/v1/send-push-notification';
  v_user_patient_id UUID;
  v_medical_id TEXT;
  v_patient_name TEXT;
  v_doctor_name TEXT;
  v_questionnaire_title TEXT;
  v_notification_body TEXT;
  v_has_mobile_app BOOLEAN;
BEGIN
  -- Get medical_id and patient name from patients table
  SELECT medical_id, first_name INTO v_medical_id, v_patient_name
  FROM patients
  WHERE id = NEW.patient_id;

  -- Check if patient has mobile app registration
  IF v_medical_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM user_patients WHERE medical_id = v_medical_id
    ) INTO v_has_mobile_app;
    
    -- Get the user_patient_id for FCM notification
    SELECT id INTO v_user_patient_id
    FROM user_patients
    WHERE medical_id = v_medical_id;
  ELSE
    v_has_mobile_app := false;
  END IF;

  -- Only create notification if patient has mobile app
  IF v_has_mobile_app THEN
    -- Get doctor name
    SELECT full_name INTO v_doctor_name
    FROM doctors
    WHERE id = NEW.doctor_id;

    -- Get questionnaire title
    SELECT title INTO v_questionnaire_title
    FROM questionnaires
    WHERE id = NEW.questionnaire_id;

    -- Build personalized notification message
    v_notification_body := 'Dear ' || COALESCE(v_patient_name, 'Patient') || 
                          ', Dr. ' || COALESCE(v_doctor_name, 'Doctor') || 
                          ' has assigned you a questionnaire: ' || 
                          COALESCE(v_questionnaire_title, 'Questionnaire');

    -- Insert notification record
    INSERT INTO patient_notifications (
      company_id,
      patient_id,
      objective_id,
      medical_id,
      category,
      message_header,
      message_body,
      read,
      doctor_id,
      created_at,
      updated_at
    ) VALUES (
      NEW.company_id,
      NEW.patient_id,
      NEW.questionnaire_id,
      v_medical_id,
      'Question',
      'New Questionnaire',
      COALESCE(v_questionnaire_title, 'Questionnaire'),
      false,
      NEW.doctor_id,
      now(),
      now()
    );

    -- Send FCM push notification if user_patient found
    IF v_user_patient_id IS NOT NULL THEN
      PERFORM net.http_post(
        url := v_function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'patientId', v_user_patient_id::text,
          'title', 'New Questionnaire from Dr. ' || COALESCE(v_doctor_name, 'Doctor'),
          'body', v_notification_body,
          'data', jsonb_build_object(
            'questionnaire_id', NEW.questionnaire_id::text,
            'assignment_id', NEW.id::text,
            'type', 'questionnaire',
            'screen', 'doctor-responses',
            'doctor_name', v_doctor_name,
            'patient_name', v_patient_name,
            'questionnaire_title', v_questionnaire_title
          )
        ),
        timeout_milliseconds := 5000
      );
      
      RAISE LOG 'Sent questionnaire notification for patient_id: %, questionnaire_id: %', v_user_patient_id, NEW.questionnaire_id;
    END IF;

    -- Store medical_id in assignment for easy mobile access
    NEW.medical_id := v_medical_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;