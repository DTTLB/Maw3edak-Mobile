/*
  # Create Notification Triggers for All Screens
  
  This migration creates database triggers that automatically send push notifications
  to patients when doctors create or update relevant data.
  
  ## Triggers Created
  
  1. **Prescriptions** (`patient_prescriptions`)
     - Sends notification when doctor creates a new prescription
     - Notification type: `new_prescription`
  
  2. **Nutrition Plans** (`patient_meal_plan`)
     - Sends notification when doctor assigns a meal plan
     - Notification type: `new_nutrition`
  
  3. **Vision/Eye Tests** (`eye_tests`)
     - Sends notification when doctor creates eye test results
     - Notification type: `vision_result`
  
  4. **Eyeglass Prescriptions** (`eyeglass_prescriptions`)
     - Sends notification when doctor creates eyeglass prescription
     - Notification type: `eyeglass_prescription`
  
  5. **Dental Encounters** (`encounters`)
     - Sends notification when doctor creates dental encounter
     - Notification type: `dental_encounter`
  
  6. **Appointments** (`appointments`)
     - Sends notification when appointment is created or status changes
     - Notification type: `appointment_update`
  
  7. **Invoices** (`invoice_headers`)
     - Sends notification when new invoice is created
     - Notification type: `new_invoice`
  
  8. **Doctor Responses** (`patient_questions`)
     - Sends notification when doctor responds to patient question
     - Notification type: `doctor_response`
  
  ## How It Works
  
  Each trigger:
  - Fires after INSERT or UPDATE on the respective table
  - Looks up patient's medical_id from the patients table
  - Looks up doctor's full name from the doctors table
  - Calls the `send-push-notification` edge function via HTTP POST
  - Includes relevant data (doctor name, patient medical_id, notification type)
  
  ## Security
  
  - All triggers use hardcoded Supabase URL for the edge function
  - Notifications are sent asynchronously (doesn't block the main transaction)
  - Failed notifications don't prevent the database operation
*/

-- ============================================================================
-- 1. PRESCRIPTIONS NOTIFICATION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_prescription_created()
RETURNS TRIGGER AS $$
DECLARE
  v_medical_id TEXT;
  v_doctor_name TEXT;
  v_supabase_url TEXT := 'https://hmffzwvdgomzuqrzcmco.supabase.co';
BEGIN
  -- Get patient's medical_id
  SELECT medical_id INTO v_medical_id
  FROM patients
  WHERE id = NEW.patient_id;
  
  -- Get doctor's name
  SELECT full_name INTO v_doctor_name
  FROM doctors
  WHERE id = NEW.doctor_id;
  
  -- Send notification via edge function
  IF v_medical_id IS NOT NULL AND v_doctor_name IS NOT NULL THEN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'medicalId', v_medical_id,
        'title', 'New Prescription',
        'body', v_doctor_name || ' has sent you a new prescription',
        'type', 'new_prescription'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_prescription_created ON patient_prescriptions;

CREATE TRIGGER trigger_notify_prescription_created
AFTER INSERT ON patient_prescriptions
FOR EACH ROW
EXECUTE FUNCTION notify_prescription_created();

-- ============================================================================
-- 2. NUTRITION PLANS NOTIFICATION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_nutrition_plan_assigned()
RETURNS TRIGGER AS $$
DECLARE
  v_medical_id TEXT;
  v_doctor_name TEXT;
  v_supabase_url TEXT := 'https://hmffzwvdgomzuqrzcmco.supabase.co';
BEGIN
  -- Get patient's medical_id
  SELECT medical_id INTO v_medical_id
  FROM patients
  WHERE id = NEW.patient_id;
  
  -- Get doctor's name
  SELECT full_name INTO v_doctor_name
  FROM doctors
  WHERE id = NEW.doctor_id;
  
  -- Send notification via edge function
  IF v_medical_id IS NOT NULL AND v_doctor_name IS NOT NULL THEN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'medicalId', v_medical_id,
        'title', 'New Nutrition Plan',
        'body', v_doctor_name || ' has assigned you a new nutrition plan',
        'type', 'new_nutrition'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_nutrition_plan_assigned ON patient_meal_plan;

CREATE TRIGGER trigger_notify_nutrition_plan_assigned
AFTER INSERT ON patient_meal_plan
FOR EACH ROW
EXECUTE FUNCTION notify_nutrition_plan_assigned();

-- ============================================================================
-- 3. EYE TESTS NOTIFICATION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_eye_test_created()
RETURNS TRIGGER AS $$
DECLARE
  v_medical_id TEXT;
  v_doctor_name TEXT;
  v_supabase_url TEXT := 'https://hmffzwvdgomzuqrzcmco.supabase.co';
BEGIN
  -- Get patient's medical_id
  SELECT medical_id INTO v_medical_id
  FROM patients
  WHERE id = NEW.patient_id;
  
  -- Get doctor's name
  SELECT full_name INTO v_doctor_name
  FROM doctors
  WHERE id = NEW.doctor_id;
  
  -- Send notification via edge function
  IF v_medical_id IS NOT NULL AND v_doctor_name IS NOT NULL THEN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'medicalId', v_medical_id,
        'title', 'Eye Test Results',
        'body', v_doctor_name || ' has added new eye test results for you',
        'type', 'vision_result'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_eye_test_created ON eye_tests;

CREATE TRIGGER trigger_notify_eye_test_created
AFTER INSERT ON eye_tests
FOR EACH ROW
EXECUTE FUNCTION notify_eye_test_created();

-- ============================================================================
-- 4. EYEGLASS PRESCRIPTIONS NOTIFICATION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_eyeglass_prescription_created()
RETURNS TRIGGER AS $$
DECLARE
  v_medical_id TEXT;
  v_doctor_name TEXT;
  v_supabase_url TEXT := 'https://hmffzwvdgomzuqrzcmco.supabase.co';
BEGIN
  -- Get patient's medical_id
  SELECT medical_id INTO v_medical_id
  FROM patients
  WHERE id = NEW.patient_id;
  
  -- Get doctor's name
  SELECT full_name INTO v_doctor_name
  FROM doctors
  WHERE id = NEW.doctor_id;
  
  -- Send notification via edge function
  IF v_medical_id IS NOT NULL AND v_doctor_name IS NOT NULL THEN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'medicalId', v_medical_id,
        'title', 'Eyeglass Prescription',
        'body', v_doctor_name || ' has created an eyeglass prescription for you',
        'type', 'eyeglass_prescription'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_eyeglass_prescription_created ON eyeglass_prescriptions;

CREATE TRIGGER trigger_notify_eyeglass_prescription_created
AFTER INSERT ON eyeglass_prescriptions
FOR EACH ROW
EXECUTE FUNCTION notify_eyeglass_prescription_created();

-- ============================================================================
-- 5. DENTAL ENCOUNTERS NOTIFICATION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_dental_encounter_created()
RETURNS TRIGGER AS $$
DECLARE
  v_medical_id TEXT;
  v_doctor_name TEXT;
  v_supabase_url TEXT := 'https://hmffzwvdgomzuqrzcmco.supabase.co';
BEGIN
  -- Get patient's medical_id
  SELECT medical_id INTO v_medical_id
  FROM patients
  WHERE id = NEW.patient_id;
  
  -- Get doctor's name
  SELECT full_name INTO v_doctor_name
  FROM doctors
  WHERE id = NEW.doctor_id;
  
  -- Send notification via edge function
  IF v_medical_id IS NOT NULL AND v_doctor_name IS NOT NULL THEN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'medicalId', v_medical_id,
        'title', 'Dental Record Updated',
        'body', v_doctor_name || ' has updated your dental records',
        'type', 'dental_encounter'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_dental_encounter_created ON encounters;

CREATE TRIGGER trigger_notify_dental_encounter_created
AFTER INSERT ON encounters
FOR EACH ROW
EXECUTE FUNCTION notify_dental_encounter_created();

-- ============================================================================
-- 6. APPOINTMENTS NOTIFICATION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_appointment_update()
RETURNS TRIGGER AS $$
DECLARE
  v_medical_id TEXT;
  v_doctor_name TEXT;
  v_supabase_url TEXT := 'https://hmffzwvdgomzuqrzcmco.supabase.co';
  v_title TEXT;
  v_body TEXT;
BEGIN
  -- Get patient's medical_id
  SELECT medical_id INTO v_medical_id
  FROM patients
  WHERE id = NEW.patient_id;
  
  -- Get doctor's name
  SELECT full_name INTO v_doctor_name
  FROM doctors
  WHERE id = NEW.doctor_id;
  
  -- Determine notification message based on operation
  IF TG_OP = 'INSERT' THEN
    v_title := 'New Appointment';
    v_body := 'Your appointment with ' || v_doctor_name || ' has been scheduled';
  ELSE
    v_title := 'Appointment Updated';
    v_body := 'Your appointment with ' || v_doctor_name || ' has been updated';
  END IF;
  
  -- Send notification via edge function
  IF v_medical_id IS NOT NULL AND v_doctor_name IS NOT NULL THEN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'medicalId', v_medical_id,
        'title', v_title,
        'body', v_body,
        'type', 'appointment_update'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_appointment_update ON appointments;

CREATE TRIGGER trigger_notify_appointment_update
AFTER INSERT OR UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION notify_appointment_update();

-- ============================================================================
-- 7. INVOICES NOTIFICATION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_invoice_created()
RETURNS TRIGGER AS $$
DECLARE
  v_medical_id TEXT;
  v_doctor_name TEXT;
  v_supabase_url TEXT := 'https://hmffzwvdgomzuqrzcmco.supabase.co';
BEGIN
  -- Get patient's medical_id
  SELECT medical_id INTO v_medical_id
  FROM patients
  WHERE id = NEW.patient_id;
  
  -- Get doctor's name (if available)
  IF NEW.doctor_id IS NOT NULL THEN
    SELECT full_name INTO v_doctor_name
    FROM doctors
    WHERE id = NEW.doctor_id;
  ELSE
    v_doctor_name := 'Your clinic';
  END IF;
  
  -- Send notification via edge function
  IF v_medical_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'medicalId', v_medical_id,
        'title', 'New Invoice',
        'body', v_doctor_name || ' has created a new invoice for you',
        'type', 'new_invoice'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_invoice_created ON invoice_headers;

CREATE TRIGGER trigger_notify_invoice_created
AFTER INSERT ON invoice_headers
FOR EACH ROW
EXECUTE FUNCTION notify_invoice_created();

-- ============================================================================
-- 8. DOCTOR RESPONSES NOTIFICATION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_doctor_response()
RETURNS TRIGGER AS $$
DECLARE
  v_medical_id TEXT;
  v_doctor_name TEXT;
  v_supabase_url TEXT := 'https://hmffzwvdgomzuqrzcmco.supabase.co';
BEGIN
  -- Only send notification when doctor responds (answer_text is added)
  IF NEW.answer_text IS NOT NULL AND (OLD.answer_text IS NULL OR OLD.answer_text != NEW.answer_text) THEN
    -- Get patient's medical_id
    SELECT medical_id INTO v_medical_id
    FROM patients
    WHERE id = NEW.patient_id;
    
    -- Get doctor's name
    SELECT full_name INTO v_doctor_name
    FROM doctors
    WHERE id = NEW.doctor_id;
    
    -- Send notification via edge function
    IF v_medical_id IS NOT NULL AND v_doctor_name IS NOT NULL THEN
      PERFORM net.http_post(
        url := v_supabase_url || '/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'medicalId', v_medical_id,
          'title', 'Doctor Response',
          'body', v_doctor_name || ' has responded to your question',
          'type', 'doctor_response'
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_doctor_response ON patient_questions;

CREATE TRIGGER trigger_notify_doctor_response
AFTER INSERT OR UPDATE ON patient_questions
FOR EACH ROW
EXECUTE FUNCTION notify_doctor_response();
