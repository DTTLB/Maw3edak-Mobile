/*
  # Add Unique Constraint for Doctor Device Tokens

  1. Changes
    - Add unique constraint on (user_id, fcm_token) combination for doctors
    - This enables proper upsert operations for doctor tokens
    - Mirrors the existing patient constraint

  2. Security
    - Prevents duplicate device token entries for doctors
    - Allows same FCM token for different roles (patient vs doctor)
*/

-- Add unique constraint for doctor tokens if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'device_tokens_user_fcm_unique'
  ) THEN
    ALTER TABLE device_tokens
    ADD CONSTRAINT device_tokens_user_fcm_unique
    UNIQUE (user_id, fcm_token);
  END IF;
END $$;