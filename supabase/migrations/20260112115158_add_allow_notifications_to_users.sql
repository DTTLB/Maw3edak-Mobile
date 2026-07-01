/*
  # Add allow_notifications to users table

  1. Changes
    - Add `allow_notifications` column to `users` table
      - Type: boolean
      - Default: true (enabled by default for existing users)
      - Controls whether doctor users want to receive FCM push notifications
    
  2. Notes
    - This is a user-level preference for doctors
    - When false, no notifications will be sent regardless of active device tokens
    - Existing users default to true to maintain current behavior
    - Checked for primary company users only
*/

-- Add allow_notifications column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'allow_notifications'
  ) THEN
    ALTER TABLE users ADD COLUMN allow_notifications boolean DEFAULT true;
  END IF;
END $$;
