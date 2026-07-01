/*
  # Fix Order Notification Doctor Name Column

  1. Changes
    - Update the `notify_new_order()` function to use correct column name `full_name` instead of `name`
  
  2. Security
    - Function maintains SECURITY DEFINER to access pg_net
    - No changes to RLS policies
*/

CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_function_url text := 'https://ttyukcvqifqyfolxtwba.supabase.co/functions/v1/send-push-notification';
  v_user_patient_id uuid;
  v_medical_id text;
  v_patient_name text;
  v_doctor_name text;
  v_notification_body text;
BEGIN
  -- Get medical_id and patient name from patients table
  SELECT medical_id, first_name INTO v_medical_id, v_patient_name
  FROM patients
  WHERE id = NEW.patient_id;

  -- Get doctor name
  SELECT full_name INTO v_doctor_name
  FROM doctors
  WHERE id = NEW.doctor_id;

  -- If medical_id found, get the corresponding user_patients.id
  IF v_medical_id IS NOT NULL THEN
    SELECT id INTO v_user_patient_id
    FROM user_patients
    WHERE medical_id = v_medical_id;

    -- If user_patient found, send notification
    IF v_user_patient_id IS NOT NULL THEN
      -- Build personalized notification message
      v_notification_body := 'Dear ' || COALESCE(v_patient_name, 'Patient') || 
                            ', you have a new order from your doctor ' || 
                            COALESCE(v_doctor_name, 'Dr.') || 
                            ': ' || COALESCE(NEW.description, 'New order');

      PERFORM net.http_post(
        url := v_function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'patientId', v_user_patient_id::text,
          'title', 'New Order from Dr. ' || COALESCE(v_doctor_name, 'Doctor'),
          'body', v_notification_body,
          'data', jsonb_build_object(
            'order_id', NEW.id,
            'type', 'new_order',
            'doctor_name', v_doctor_name,
            'patient_name', v_patient_name
          )
        ),
        timeout_milliseconds := 5000
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
