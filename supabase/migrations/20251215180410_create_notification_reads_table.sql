/*
  # Create notification_reads table

  1. New Tables
    - `notification_reads`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid, not null) - Reference to user who should see this notification
      - `appointment_id` (uuid, not null) - Reference to the appointment
      - `notification_type` (text, not null) - Type of notification (booked, confirmed, cancelled)
      - `read_at` (timestamptz, nullable) - When the notification was read (null = unread)
      - `created_at` (timestamptz) - When the notification was created

  2. Indexes
    - Index on user_id for fast user lookups
    - Index on appointment_id for fast appointment lookups
    - Composite unique index on (user_id, appointment_id, notification_type) to prevent duplicates

  3. Security
    - Enable RLS on `notification_reads` table
    - Add policy for users to view their own notification reads
    - Add policy for users to update their own notification read status
*/

-- Create notification_reads table
CREATE TABLE IF NOT EXISTS notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  appointment_id uuid NOT NULL,
  notification_type text NOT NULL,
  read_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notification_reads_user_id ON notification_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_appointment_id ON notification_reads(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_read_at ON notification_reads(read_at);

-- Create unique constraint to prevent duplicate notifications
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_reads_unique 
  ON notification_reads(user_id, appointment_id, notification_type);

-- Enable RLS
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can view their own notification reads
CREATE POLICY "Users can view own notification reads"
  ON notification_reads
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can update their own notification read status
CREATE POLICY "Users can update own notification reads"
  ON notification_reads
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Service role can insert notification reads
CREATE POLICY "Service role can insert notification reads"
  ON notification_reads
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Service role can manage all notifications
CREATE POLICY "Service role can manage all notifications"
  ON notification_reads
  FOR ALL
  TO service_role
  USING (true);