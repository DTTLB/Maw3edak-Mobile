/*
  # Fix Appointment Notification URL
  
  1. Changes
    - Update the appointment notification trigger to use the correct Supabase URL
    - The appointment trigger was using wrong URL: hmffzwvdgomzuqrzcmco.supabase.co
    - Should use the correct URL: ttyukcvqifqyfolxtwba.supabase.co
    - This matches the working order notification trigger
    
  2. Impact
    - Appointment notifications will now work properly
    - Uses the same proven approach as order notifications
*/

-- Update the appointment notification function with correct URL
CREATE OR REPLACE FUNCTION notify_appointment_created()
RETURNS TRIGGER AS $$
DECLARE
  v_function_url TEXT := 'https://ttyukcvqifqyfolxtwba.supabase.co/functions/v1/send-push-notification';
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
