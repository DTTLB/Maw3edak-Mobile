/*
  # Add Unique Constraint to Device Tokens
  
  1. Changes
    - Add unique constraint on (patient_id, fcm_token) combination
    - This ensures one device token per patient per device
  
  2. Security
    - Prevents duplicate device token entries
    - Enables proper upsert operations
*/

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'device_tokens_patient_fcm_unique'
  ) THEN
    ALTER TABLE device_tokens
    ADD CONSTRAINT device_tokens_patient_fcm_unique
    UNIQUE (patient_id, fcm_token);
  END IF;
END $$;
