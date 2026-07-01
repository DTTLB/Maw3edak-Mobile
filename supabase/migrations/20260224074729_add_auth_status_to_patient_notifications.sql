/*
  # Add auth_status to patient_notifications

  ## Changes
  - Adds `auth_status` column to `patient_notifications` table (nullable text)
    to support authorization-type notifications where patients can approve or deny
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_notifications' AND column_name = 'auth_status'
  ) THEN
    ALTER TABLE patient_notifications ADD COLUMN auth_status text;
  END IF;
END $$;
