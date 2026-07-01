/*
  # Add Registration Fields to OTP Verifications

  1. Changes
    - Add `first_name` column to store patient's first name
    - Add `last_name` column to store patient's last name
    - Add `password_hash` column to store hashed password (PBKDF2, 100k iterations, SHA-256)
    - Add `date_of_birth` column to store patient's birth date
    - Add `gender` column to store patient's gender
    - Add `blood_type` column to store patient's blood type
    - Add `address` column to store patient's address
    - Add `is_phone_update` column to distinguish between registration and phone update flows

  2. Security
    - Password is hashed on client side using PBKDF2 with 100,000 iterations
    - All sensitive registration data is temporarily stored until OTP verification
    - Data is cleared after verification or expiration
*/

-- Add registration fields to otp_verifications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'otp_verifications' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE otp_verifications ADD COLUMN first_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'otp_verifications' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE otp_verifications ADD COLUMN last_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'otp_verifications' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE otp_verifications ADD COLUMN password_hash text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'otp_verifications' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE otp_verifications ADD COLUMN date_of_birth date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'otp_verifications' AND column_name = 'gender'
  ) THEN
    ALTER TABLE otp_verifications ADD COLUMN gender text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'otp_verifications' AND column_name = 'blood_type'
  ) THEN
    ALTER TABLE otp_verifications ADD COLUMN blood_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'otp_verifications' AND column_name = 'address'
  ) THEN
    ALTER TABLE otp_verifications ADD COLUMN address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'otp_verifications' AND column_name = 'is_phone_update'
  ) THEN
    ALTER TABLE otp_verifications ADD COLUMN is_phone_update boolean DEFAULT false;
  END IF;
END $$;
