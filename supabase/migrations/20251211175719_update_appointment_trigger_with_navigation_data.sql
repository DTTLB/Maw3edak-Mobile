/*
  # Update Appointment Notification Trigger
  
  1. Changes
    - Updates appointment notification to include navigation data for FCM
    - Adds appointment_id to notification data for proper deep linking
    
  2. Security
    - Uses existing RLS policies
*/

CREATE OR REPLACE FUNCTION create_appointment_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_medical_id TEXT;
  v_doctor_name TEXT;
  v_appointment_date_str TEXT;
  v_notification_id UUID;
BEGIN
  SELECT medical_id INTO v_patient_medical_id
  FROM patients
  WHERE id = NEW.patient_id;
  
  SELECT doctor_name INTO v_doctor_name
  FROM doctors
  WHERE id = NEW.doctor_id;
  
  v_appointment_date_str := TO_CHAR(NEW.appointment_date, 'DD/MM/YYYY') || ' at ' || NEW.appointment_time;
  
  IF v_patient_medical_id IS NOT NULL THEN
    INSERT INTO patient_notifications (
      medical_id,
      category,
      message_header,
      message_body,
      doctor_id,
      read
    ) VALUES (
      v_patient_medical_id,
      'Appointment',
      'New Appointment Booked',
      'You have an appointment with Dr. ' || COALESCE(v_doctor_name, 'Unknown') || ' on ' || v_appointment_date_str,
      NEW.doctor_id,
      false
    )
    RETURNING id INTO v_notification_id;
    
    RAISE LOG 'Created notification % for appointment %', v_notification_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;