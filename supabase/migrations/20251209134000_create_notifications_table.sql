/*
  # Create Notifications Table

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `medical_id` (text, foreign key to user_patients)
      - `title` (text)
      - `body` (text)
      - `type` (text) - notification type (order, appointment, prescription, etc.)
      - `data` (jsonb) - additional notification data
      - `is_read` (boolean, default false)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `notifications` table
    - Add policy for patients to read their own notifications
    - Add policy for patients to update their own notifications (mark as read)
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_id text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  type text DEFAULT 'general',
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_medical_id FOREIGN KEY (medical_id) REFERENCES user_patients(medical_id) ON DELETE CASCADE
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    medical_id IN (
      SELECT medical_id FROM user_patients WHERE id = auth.uid()
    )
  );

CREATE POLICY "Patients can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (
    medical_id IN (
      SELECT medical_id FROM user_patients WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    medical_id IN (
      SELECT medical_id FROM user_patients WHERE id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_notifications_medical_id ON notifications(medical_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
