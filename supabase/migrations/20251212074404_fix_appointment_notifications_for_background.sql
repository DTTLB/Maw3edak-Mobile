/*
  # Fix Appointment Notifications for Background/Closed App
  
  1. Changes
    - Replace the appointment notification system to use direct FCM calls
    - Uses the same proven approach as order notifications
    - Calls send-push-notification edge function directly with patientId
    - Works reliably when app is closed or in background
    
  2. How It Works
    - When appointment is created, trigger fires immediately
    - Looks up user_patients.id from medical_id
    - Calls edge function directly via pg_net
    - Includes proper navigation data for deep linking
    
  3. Security
    - Function uses SECURITY DEFINER to access pg_net
    - No changes to RLS policies
*/

-- Drop the old appointment trigger that inserts into patient_notifications
DROP TRIGGER IF EXISTS trigger_create_appointment_notification ON appointments;
DROP FUNCTION IF EXISTS create_appointment_notification();

-- Create new direct notification function (like orders)
CREATE OR REPLACE FUNCTION notify_appointment_created()
RETURNS TRIGGER AS $$
DECLARE
  v_function_url TEXT := 'https://hmffzwvdgomzuqrzcmco.supabase.co/functions/v1/send-push-notification';
  v_user_patient_id UUID;
  v_medical_id TEXT;
  v_patient_name TEXT;
  v_doctor_name TEXT;
  v_appointment_date_str TEXT;
  v_notification_body TEXT;
BEGIN
  -- Get medical_id and patient name from patients table
  SELECT medical_id, first_name INTO v_medical_id, v_patient_name
  FROM patients
  WHERE id = NEW.patient_id;
  
  -- Get doctor name
  SELECT full_name INTO v_doctor_name
  FROM doctors
  WHERE id = NEW.doctor_id;
  
  -- Format appointment date
  v_appointment_date_str := TO_CHAR(NEW.appointment_date, 'DD/MM/YYYY') || ' at ' || NEW.appointment_time;
  
  -- If medical_id found, get the corresponding user_patients.id
  IF v_medical_id IS NOT NULL THEN
    SELECT id INTO v_user_patient_id
    FROM user_patients
    WHERE medical_id = v_medical_id;
    
    -- If user_patient found, send notification
    IF v_user_patient_id IS NOT NULL THEN
      -- Build personalized notification message
      v_notification_body := 'Dear ' || COALESCE(v_patient_name, 'Patient') || 
                            ', you have an appointment with Dr. ' || 
                            COALESCE(v_doctor_name, 'Doctor') || 
                            ' on ' || v_appointment_date_str;
      
      PERFORM net.http_post(
        url := v_function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'patientId', v_user_patient_id::text,
          'title', 'New Appointment Booked',
          'body', v_notification_body,
          'data', jsonb_build_object(
            'appointment_id', NEW.id::text,
            'type', 'appointment',
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

-- Create trigger on appointments table
DROP TRIGGER IF EXISTS trigger_notify_appointment_created ON appointments;

CREATE TRIGGER trigger_notify_appointment_created
AFTER INSERT ON appointments
FOR EACH ROW
EXECUTE FUNCTION notify_appointment_created();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
