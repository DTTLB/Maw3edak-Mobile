/*
  # Add OTP and Verification Columns to user_patients

  1. Changes
    - Add `otp_code` column (text, nullable) - stores the 6-digit OTP
    - Add `otp_expiry` column (timestamptz, nullable) - stores OTP expiration time
    - Add `is_verified` column (boolean, default false) - tracks account verification status

  2. Notes
    - OTP fields are nullable as they're only used during registration/verification
    - is_verified defaults to false for new registrations
    - OTP expires after 10 minutes (enforced in application code)
*/

-- Add OTP and verification columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_patients' AND column_name = 'otp_code'
  ) THEN
    ALTER TABLE user_patients ADD COLUMN otp_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_patients' AND column_name = 'otp_expiry'
  ) THEN
    ALTER TABLE user_patients ADD COLUMN otp_expiry timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_patients' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE user_patients ADD COLUMN is_verified boolean DEFAULT false;
  END IF;
END $$;

-- Update existing records to be verified (since they were created before this system)
UPDATE user_patients SET is_verified = true WHERE is_verified IS NULL;