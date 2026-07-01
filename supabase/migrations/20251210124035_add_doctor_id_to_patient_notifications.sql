/*
  # Add doctor_id column to patient_notifications table

  1. Changes
    - Add `doctor_id` (uuid) column to `patient_notifications` table
    - This column will reference the doctor related to the notification
*/

-- Add doctor_id column to patient_notifications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_notifications' AND column_name = 'doctor_id'
  ) THEN
    ALTER TABLE patient_notifications ADD COLUMN doctor_id uuid;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_patient_notifications_doctor_id ON patient_notifications(doctor_id);