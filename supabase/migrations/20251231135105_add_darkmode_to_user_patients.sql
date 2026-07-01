/*
  # Add Dark Mode Column to User Patients

  1. Changes
    - Add `darkmode` column to `user_patients` table
      - Type: boolean
      - Default: false (light mode)
      - Allows users to toggle dark mode in settings
  
  2. Notes
    - This column stores the user's dark mode preference
    - Can be updated via the settings page
    - Defaults to light mode for existing users
*/

-- Add darkmode column to user_patients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_patients' AND column_name = 'darkmode'
  ) THEN
    ALTER TABLE user_patients ADD COLUMN darkmode boolean DEFAULT false;
  END IF;
END $$;
