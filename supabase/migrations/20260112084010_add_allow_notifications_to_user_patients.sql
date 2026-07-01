/*
  # Add allow_notifications to user_patients table

  1. Changes
    - Add `allow_notifications` column to `user_patients` table
      - Type: boolean
      - Default: true (enabled by default for existing users)
      - Controls whether user wants to receive FCM push notifications
    
  2. Notes
    - This is a user-level preference, not device-level
    - When false, no notifications will be sent regardless of active device tokens
    - Existing users default to true to maintain current behavior
*/

-- Add allow_notifications column to user_patients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_patients' AND column_name = 'allow_notifications'
  ) THEN
    ALTER TABLE user_patients ADD COLUMN allow_notifications boolean DEFAULT true;
  END IF;
END $$;