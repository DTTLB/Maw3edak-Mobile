/*
  # Add Completed Column to Doctor Notifications

  1. Changes
    - Add `completed` column to `doctor_notifications` table (text, default 'no')
    - This allows tracking authorization status for authorization-type notifications
    - Values: 'yes' (authorized), 'no' (not yet acted upon), 'denied' (rejected)

  2. Purpose
    - Support authorization workflow where doctors can approve or deny requests
    - Track completion status independently from the read status
*/

-- Add completed column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctor_notifications' AND column_name = 'completed'
  ) THEN
    ALTER TABLE doctor_notifications ADD COLUMN completed text NOT NULL DEFAULT 'no';
  END IF;
END $$;

-- Create index for filtering by completed status
CREATE INDEX IF NOT EXISTS idx_doctor_notifications_completed ON doctor_notifications(completed);