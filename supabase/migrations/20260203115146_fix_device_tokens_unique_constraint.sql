/*
  # Fix Device Tokens Unique Constraint for Dual-Role Users

  1. Changes
    - Drop the unique index on fcm_token alone
    - Create separate unique constraints for patient and doctor tokens
    - This allows the same FCM token to be used by a person who is both a doctor and patient

  2. Rationale
    - A user can have both a doctor role and patient role
    - They use the same device, so same FCM token
    - But need separate entries for notifications to work correctly
    - patient_id + fcm_token should be unique
    - user_id + fcm_token should be unique

  3. Security
    - Maintains data integrity while supporting dual roles
    - Prevents duplicate entries for the same role + token combination
*/

-- Drop the old unique index on fcm_token alone
DROP INDEX IF EXISTS idx_device_tokens_fcm_token;

-- Create a unique index for patient tokens (patient_id + fcm_token)
CREATE UNIQUE INDEX IF NOT EXISTS idx_device_tokens_patient_fcm
  ON device_tokens(patient_id, fcm_token)
  WHERE patient_id IS NOT NULL;

-- Create a unique index for doctor tokens (user_id + fcm_token)
CREATE UNIQUE INDEX IF NOT EXISTS idx_device_tokens_user_fcm
  ON device_tokens(user_id, fcm_token)
  WHERE user_id IS NOT NULL;

-- Keep the general fcm_token index for lookups (non-unique)
CREATE INDEX IF NOT EXISTS idx_device_tokens_fcm_token_lookup
  ON device_tokens(fcm_token);