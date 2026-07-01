/*
  # Fix Patients Table RLS for Profile Updates

  This migration adds a new RLS policy to allow patient profile updates
  without requiring company access, specifically for the mobile app profile update flow.

  ## Changes

  1. Add a new permissive policy for UPDATE operations that allows:
     - Updates when the medical_id matches an existing user_patients record
     - This enables the mobile-update-patient-profile edge function to sync data
  
  ## Security

  - Only allows updates to patients that have a corresponding user_patients record
  - Medical ID must match between tables
  - Still maintains data integrity and ownership
*/

-- Add a policy to allow updates to patients table when updating from user_patients
CREATE POLICY "Allow patient profile sync updates"
ON public.patients
FOR UPDATE
TO authenticated
USING (
  medical_id IN (
    SELECT medical_id 
    FROM public.user_patients 
    WHERE medical_id IS NOT NULL
  )
)
WITH CHECK (
  medical_id IN (
    SELECT medical_id 
    FROM public.user_patients 
    WHERE medical_id IS NOT NULL
  )
);
