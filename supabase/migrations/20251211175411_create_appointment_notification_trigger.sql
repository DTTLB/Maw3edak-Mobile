/*
  # Create Appointment Notification Trigger
  
  1. Changes
    - Creates a trigger that automatically creates a notification in `patient_notifications` when a new appointment is booked
    - The notification includes appointment details and doctor information
    
  2. Security
    - Uses existing RLS policies on patient_notifications table
    - Notifications are created automatically and securely
*/

-- Create function to send notification when appointment is created
CREATE OR REPLACE FUNCTION create_appointment_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_medical_id TEXT;
  v_doctor_name TEXT;
  v_appointment_date_str TEXT;
BEGIN
  -- Get patient's medical_id
  SELECT medical_id INTO v_patient_medical_id
  FROM patients
  WHERE id = NEW.patient_id;
  
  -- Get doctor's name
  SELECT doctor_name INTO v_doctor_name
  FROM doctors
  WHERE id = NEW.doctor_id;
  
  -- Format appointment date
  v_appointment_date_str := TO_CHAR(NEW.appointment_date, 'DD/MM/YYYY') || ' at ' || NEW.appointment_time;
  
  -- Insert notification into patient_notifications
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
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_create_appointment_notification ON appointments;

-- Create trigger
CREATE TRIGGER trigger_create_appointment_notification
AFTER INSERT ON appointments
FOR EACH ROW
EXECUTE FUNCTION create_appointment_notification();