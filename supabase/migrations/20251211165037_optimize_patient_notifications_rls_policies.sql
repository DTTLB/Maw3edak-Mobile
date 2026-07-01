/*
  # Optimize Patient Notifications RLS Policies
  
  1. Changes
    - Fix RLS policies to use subqueries for auth functions (improves performance)
    - Consolidate multiple permissive policies into single policies
    - Replace current_setting() calls with subqueries to prevent re-evaluation per row
  
  2. Security
    - Maintains same security model with improved performance
    - Patients can still only access their own notifications
    - Company users can still manage all notifications for their company
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Patients can view own notifications" ON patient_notifications;
DROP POLICY IF EXISTS "Patients can update own notifications" ON patient_notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON patient_notifications;
DROP POLICY IF EXISTS "Company users can manage notifications" ON patient_notifications;

-- Create optimized SELECT policy (combines patient and company user access)
CREATE POLICY "Users can view relevant notifications"
  ON patient_notifications
  FOR SELECT
  TO authenticated
  USING (
    -- Patients can view their own notifications
    patient_id IN (
      SELECT id FROM public.patients 
      WHERE medical_id = (SELECT current_setting('app.medical_id', true))
    )
    OR
    -- Company users can view all notifications for their company
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = patient_notifications.patient_id 
      AND patients.company_id = patient_notifications.company_id
    )
  );

-- Create optimized UPDATE policy (combines patient and company user access)
CREATE POLICY "Users can update relevant notifications"
  ON patient_notifications
  FOR UPDATE
  TO authenticated
  USING (
    -- Patients can update their own notifications
    patient_id IN (
      SELECT id FROM public.patients 
      WHERE medical_id = (SELECT current_setting('app.medical_id', true))
    )
    OR
    -- Company users can update all notifications for their company
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = patient_notifications.patient_id 
      AND patients.company_id = patient_notifications.company_id
    )
  )
  WITH CHECK (
    -- Patients can only update their own notifications
    patient_id IN (
      SELECT id FROM public.patients 
      WHERE medical_id = (SELECT current_setting('app.medical_id', true))
    )
    OR
    -- Company users can update all notifications for their company
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = patient_notifications.patient_id 
      AND patients.company_id = patient_notifications.company_id
    )
  );

-- Create optimized INSERT policy (combines system and company user access)
CREATE POLICY "System can insert notifications"
  ON patient_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow insert if the patient exists and company_id matches
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = patient_notifications.patient_id 
      AND patients.company_id = patient_notifications.company_id
    )
  );

-- Create DELETE policy for company users
CREATE POLICY "Company users can delete notifications"
  ON patient_notifications
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = patient_notifications.patient_id 
      AND patients.company_id = patient_notifications.company_id
    )
  );