/*
  # Remove Webhook-Based Notification Triggers
  
  1. Changes
    - Drop all database triggers that use webhooks (net.http_post)
    - Drop all functions that make HTTP calls from the database
    - Clean approach: Edge functions will send FCM notifications directly
    
  2. Why This Fix
    - Webhooks from database triggers are unreliable
    - They can cause issues with web projects
    - Direct FCM sending from edge functions is more reliable
    - Better error handling and logging
    
  3. Tables Affected
    - patient_notifications (remove FCM trigger)
    - appointments (remove appointment notification trigger)
    - patient_questionnaire_assignments (remove questionnaire trigger)
*/

-- Drop all notification triggers
DROP TRIGGER IF EXISTS trigger_send_fcm_on_patient_notification ON patient_notifications;
DROP TRIGGER IF EXISTS trigger_notify_appointment_created ON appointments;
DROP TRIGGER IF EXISTS trigger_notify_questionnaire_assignment ON patient_questionnaire_assignments;

-- Drop all webhook-based notification functions
DROP FUNCTION IF EXISTS send_fcm_on_patient_notification();
DROP FUNCTION IF EXISTS notify_appointment_created();
DROP FUNCTION IF EXISTS notify_questionnaire_assignment();

-- Clean up old webhook functions if they exist
DROP FUNCTION IF EXISTS notify_order_created();
DROP FUNCTION IF EXISTS send_order_notification();

-- Note: FCM notifications should now be sent directly from edge functions
-- when they insert into patient_notifications table
-- This eliminates webhook dependency and improves reliability
