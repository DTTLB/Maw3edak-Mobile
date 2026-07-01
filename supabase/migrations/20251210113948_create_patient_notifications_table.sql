/*
  # Create patient_notifications table

  1. New Tables
    - `patient_notifications`
      - `id` (uuid, primary key) - Unique identifier for the notification
      - `company_id` (uuid, not null) - Company identifier
      - `patient_id` (uuid, not null) - Patient identifier with foreign key to patients table
      - `objective_id` (uuid) - Reference to related objective or event
      - `medical_id` (text, not null) - Patient medical ID for quick lookups
      - `category` (text, not null) - Notification category (e.g., appointment, order, prescription)
      - `message_header` (text, not null) - Notification title
      - `message_body` (text, not null) - Notification message content
      - `read` (boolean, default false) - Whether the notification has been read
      - `created_at` (timestamptz) - When the notification was created
      - `updated_at` (timestamptz) - When the notification was last updated

  2. Security
    - Enable RLS on `patient_notifications` table
    - Add policy for patients to view their own notifications
    - Add policy for patients to update read status on their own notifications
*/

-- Create patient_notifications table
CREATE TABLE IF NOT EXISTS patient_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  objective_id uuid,
  medical_id text NOT NULL,
  category text NOT NULL,
  message_header text NOT NULL,
  message_body text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patient_notifications_patient_id ON patient_notifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_notifications_medical_id ON patient_notifications(medical_id);
CREATE INDEX IF NOT EXISTS idx_patient_notifications_created_at ON patient_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_notifications_read ON patient_notifications(read);
CREATE INDEX IF NOT EXISTS idx_patient_notifications_category ON patient_notifications(category);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_patient_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER patient_notifications_updated_at
  BEFORE UPDATE ON patient_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_patient_notifications_updated_at();

-- Enable RLS
ALTER TABLE patient_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Patients can view their own notifications
CREATE POLICY "Patients can view own notifications"
  ON patient_notifications
  FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE medical_id = current_setting('app.medical_id', true)
    )
  );

-- Policy: Patients can update read status on their own notifications
CREATE POLICY "Patients can update own notifications"
  ON patient_notifications
  FOR UPDATE
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE medical_id = current_setting('app.medical_id', true)
    )
  )
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE medical_id = current_setting('app.medical_id', true)
    )
  );

-- Policy: System can insert notifications
CREATE POLICY "System can insert notifications"
  ON patient_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Users with company access can manage notifications
CREATE POLICY "Company users can manage notifications"
  ON patient_notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = patient_notifications.patient_id 
      AND patients.company_id = patient_notifications.company_id
    )
  );