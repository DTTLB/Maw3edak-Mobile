/*
  # Remove Old Notification Triggers

  1. Changes
    - Removes all old notification triggers that used to send FCM notifications directly
    - These are replaced by the new patient_notifications table system
    - All notifications now go through the patient_notifications table first

  2. Removed Triggers
    - trigger_notify_prescription_created
    - trigger_notify_nutrition_plan_assigned
    - trigger_notify_eye_test_created
    - trigger_notify_eyeglass_prescription_created
    - trigger_notify_dental_encounter_created
    - trigger_notify_appointment_update
    - trigger_notify_invoice_created
    - trigger_notify_doctor_response
    - trigger_notify_order_created (if exists)
*/

-- Drop all old notification triggers
DROP TRIGGER IF EXISTS trigger_notify_prescription_created ON patient_prescriptions;
DROP TRIGGER IF EXISTS trigger_notify_nutrition_plan_assigned ON patient_meal_plan;
DROP TRIGGER IF EXISTS trigger_notify_eye_test_created ON eye_tests;
DROP TRIGGER IF EXISTS trigger_notify_eyeglass_prescription_created ON eyeglass_prescriptions;
DROP TRIGGER IF EXISTS trigger_notify_dental_encounter_created ON encounters;
DROP TRIGGER IF EXISTS trigger_notify_appointment_update ON appointments;
DROP TRIGGER IF EXISTS trigger_notify_invoice_created ON invoice_headers;
DROP TRIGGER IF EXISTS trigger_notify_doctor_response ON patient_questions;
DROP TRIGGER IF EXISTS trigger_notify_order_created ON orders;

-- Drop all old notification functions
DROP FUNCTION IF EXISTS notify_prescription_created();
DROP FUNCTION IF EXISTS notify_nutrition_plan_assigned();
DROP FUNCTION IF EXISTS notify_eye_test_created();
DROP FUNCTION IF EXISTS notify_eyeglass_prescription_created();
DROP FUNCTION IF EXISTS notify_dental_encounter_created();
DROP FUNCTION IF EXISTS notify_appointment_update();
DROP FUNCTION IF EXISTS notify_invoice_created();
DROP FUNCTION IF EXISTS notify_doctor_response();
DROP FUNCTION IF EXISTS notify_order_created();
