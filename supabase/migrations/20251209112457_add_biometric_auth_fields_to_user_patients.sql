/*
  # Add Biometric Authentication Fields to User Patients
  
  1. New Columns
    - `biometric_login_enabled` (boolean): Flag to enable/disable biometric login
    - `lock_method` (text): Method of locking the app ('biometric' or null)
  
  2. Security
    - Default values are secure (biometric disabled by default)
*/

-- Add biometric authentication fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_patients' AND column_name = 'biometric_login_enabled'
  ) THEN
    ALTER TABLE user_patients ADD COLUMN biometric_login_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_patients' AND column_name = 'lock_method'
  ) THEN
    ALTER TABLE user_patients ADD COLUMN lock_method text;
  END IF;
END $$;
