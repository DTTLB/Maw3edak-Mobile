/*
  # Fix Search Path Security for All Functions
  
  1. Changes
    - Add SET search_path = '' to all functions with security warnings:
      - send_fcm_on_patient_notification
      - update_patient_notifications_updated_at
      - notify_patient_new_order
      - notify_patient_new_appointment
    - Use fully qualified table names (public.table_name)
  
  2. Security
    - Prevents search path injection attacks
    - Ensures functions always reference correct schema
    - Fixes all mutable search_path security warnings
*/

-- Fix send_fcm_on_patient_notification
CREATE OR REPLACE FUNCTION send_fcm_on_patient_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_supabase_url TEXT := 'https://hmffzwvdgomzuqrzcmco.supabase.co';
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
        'type', COALESCE(NEW.category, 'notification')
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix update_patient_notifications_updated_at
CREATE OR REPLACE FUNCTION update_patient_notifications_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix notify_patient_new_order
CREATE OR REPLACE FUNCTION notify_patient_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_medical_id TEXT;
  v_order_name TEXT;
  v_message_header TEXT;
  v_has_mobile_app BOOLEAN;
BEGIN
  SELECT medical_id INTO v_medical_id
  FROM public.patients
  WHERE id = NEW.patient_id;

  IF v_medical_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.user_patients WHERE medical_id = v_medical_id
    ) INTO v_has_mobile_app;
  ELSE
    v_has_mobile_app := false;
  END IF;

  IF v_has_mobile_app THEN
    IF NEW.order_id IS NOT NULL THEN
      SELECT description INTO v_order_name FROM public.orders WHERE id = NEW.order_id;
    ELSE
      v_order_name := COALESCE(NEW.description, 'order');
    END IF;

    v_message_header := 'A new ' || v_order_name || ' order';

    INSERT INTO public.patient_notifications (
      company_id, patient_id, objective_id, medical_id, category,
      message_header, message_body, read, doctor_id, created_at, updated_at
    ) VALUES (
      NEW.company_id, NEW.patient_id, NEW.id, v_medical_id, 'Order',
      v_message_header, v_order_name, false, NEW.doctor_id, now(), now()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Fix notify_patient_new_appointment
CREATE OR REPLACE FUNCTION notify_patient_new_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_medical_id TEXT;
  v_doctor_name TEXT;
  v_clinic_name TEXT;
  v_message_body TEXT;
  v_appointment_datetime TEXT;
  v_has_mobile_app BOOLEAN;
BEGIN
  SELECT medical_id INTO v_medical_id
  FROM public.patients
  WHERE id = NEW.patient_id;
  
  IF v_medical_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.user_patients WHERE medical_id = v_medical_id
    ) INTO v_has_mobile_app;
  ELSE
    v_has_mobile_app := false;
  END IF;
  
  IF v_has_mobile_app THEN
    SELECT full_name INTO v_doctor_name FROM public.doctors WHERE id = NEW.doctor_id;
    
    IF NEW.clinic_id IS NOT NULL THEN
      SELECT name INTO v_clinic_name FROM public.clinics WHERE id = NEW.clinic_id;
    END IF;
    
    v_appointment_datetime := TO_CHAR(NEW.appointment_date, 'DD/MM/YYYY') || ' at ' || TO_CHAR(NEW.appointment_time, 'HH24:MI');
    
    v_message_body := 'You have an appointment with Dr. ' || COALESCE(v_doctor_name, 'Doctor');
    
    IF v_clinic_name IS NOT NULL THEN
      v_message_body := v_message_body || ' at ' || v_clinic_name;
    END IF;
    
    v_message_body := v_message_body || ' on ' || v_appointment_datetime;
    
    INSERT INTO public.patient_notifications (
      company_id, patient_id, objective_id, medical_id, category,
      message_header, message_body, read, doctor_id, created_at, updated_at
    ) VALUES (
      NEW.company_id, NEW.patient_id, NEW.id, v_medical_id, 'Appointment',
      'a new appointment', v_message_body, false, NEW.doctor_id, now(), now()
    );
  END IF;
  
  RETURN NEW;
END;
$$;