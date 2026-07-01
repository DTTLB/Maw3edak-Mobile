/*
  # Add UserType to Patient Notifications

  1. Purpose
    - Make navigation more explicit by adding userType field
    - Ensure patient notifications always route to patient screens

  2. Changes
    - Add userType: 'patient' to all patient notification data
*/

-- Update patient notifications FCM trigger
CREATE OR REPLACE FUNCTION send_fcm_on_patient_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url TEXT := 'https://ttyukcvqifqyfolxtwba.supabase.co';
BEGIN
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
        'data', jsonb_build_object(
          'type', COALESCE(NEW.category, 'notification'),
          'notification_id', NEW.id::text,
          'userType', 'patient'
        )
      ),
      timeout_milliseconds := 5000
    );
    
    RAISE LOG 'Sent FCM notification for medical_id: %, notification_id: %', NEW.medical_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update appointment notification trigger
CREATE OR REPLACE FUNCTION notify_appointment_created()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url TEXT := 'https://ttyukcvqifqyfolxtwba.supabase.co';
  v_user_patient_id UUID;
  v_medical_id TEXT;
  v_patient_name TEXT;
  v_doctor_name TEXT;
  v_appointment_date_str TEXT;
  v_notification_body TEXT;
BEGIN
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
          'Content-Type', 'application/json'
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
            'appointment_date', v_appointment_date_str,
            'userType', 'patient'
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

-- Update questionnaire notification trigger
CREATE OR REPLACE FUNCTION notify_questionnaire_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_supabase_url TEXT := 'https://ttyukcvqifqyfolxtwba.supabase.co';
  v_patient_id UUID;
  v_questionnaire_name TEXT;
BEGIN
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
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'patientId', v_patient_id::text,
        'title', 'New Questionnaire Assigned',
        'body', 'You have been assigned: ' || COALESCE(v_questionnaire_name, 'a questionnaire'),
        'data', jsonb_build_object(
          'assignment_id', NEW.id::text,
          'questionnaire_id', NEW.questionnaire_id::text,
          'type', 'questionnaire',
          'screen', 'questionnaires',
          'userType', 'patient'
        )
      ),
      timeout_milliseconds := 5000
    );
    
    RAISE LOG 'Sent questionnaire notification for patient_id: %, assignment_id: %', v_patient_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
