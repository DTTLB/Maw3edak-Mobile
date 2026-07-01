/*
  # Add settings columns to users table for doctors

  ## Summary
  Add dark mode and biometric authentication settings columns to the users table
  to enable doctors to persist their preferences across app sessions.

  ## Changes
  1. Add columns to users table:
     - `darkmode` (boolean) - Stores dark mode preference
     - `biometric_login` (boolean) - Stores biometric authentication preference
     - `lock_method` (text) - Stores lock method ('none', 'pin', or 'biometric')

  ## Notes
  - All columns have sensible defaults
  - Dark mode defaults to false (light mode)
  - Biometric login defaults to false (disabled)
  - Lock method defaults to 'none'
*/

-- Add darkmode column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'darkmode'
  ) THEN
    ALTER TABLE users ADD COLUMN darkmode boolean DEFAULT false;
  END IF;
END $$;

-- Add biometric_login column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'biometric_login'
  ) THEN
    ALTER TABLE users ADD COLUMN biometric_login boolean DEFAULT false;
  END IF;
END $$;

-- Add lock_method column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'lock_method'
  ) THEN
    ALTER TABLE users ADD COLUMN lock_method text DEFAULT 'none' CHECK (lock_method IN ('none', 'pin', 'biometric'));
  END IF;
END $$;
