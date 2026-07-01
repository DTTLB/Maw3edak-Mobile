/*
  # Create device tokens table for push notifications

  1. New Tables
    - `device_tokens`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients table)
      - `fcm_token` (text, unique)
      - `platform` (text) - ios or android
      - `device_model` (text)
      - `app_version` (text)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `device_tokens` table
    - Add policies for patients to manage their own device tokens

  3. Indexes
    - Add index on patient_id for faster lookups
    - Add unique index on fcm_token
*/

CREATE TABLE IF NOT EXISTS device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  fcm_token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  device_model text,
  app_version text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_device_tokens_fcm_token ON device_tokens(fcm_token);
CREATE INDEX IF NOT EXISTS idx_device_tokens_patient_id ON device_tokens(patient_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_active ON device_tokens(is_active) WHERE is_active = true;

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own device tokens"
  ON device_tokens FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

CREATE POLICY "Patients can insert own device tokens"
  ON device_tokens FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can update own device tokens"
  ON device_tokens FOR UPDATE
  TO authenticated
  USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can delete own device tokens"
  ON device_tokens FOR DELETE
  TO authenticated
  USING (patient_id = auth.uid());
