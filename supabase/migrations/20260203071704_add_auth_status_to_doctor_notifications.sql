/*
  # Add Authorization Status to Doctor Notifications

  1. Changes
    - Add `auth_status` column to track authorization decisions
    - Values: null (pending), 'authorized', 'denied'
    - Keep `completed` as boolean for backward compatibility

  2. Purpose
    - Properly track authorization workflow states
    - Distinguish between authorized and denied requests
*/

-- Add auth_status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctor_notifications' AND column_name = 'auth_status'
  ) THEN
    ALTER TABLE doctor_notifications ADD COLUMN auth_status text;
  END IF;
END $$;

-- Create index for filtering by auth status
CREATE INDEX IF NOT EXISTS idx_doctor_notifications_auth_status ON doctor_notifications(auth_status);