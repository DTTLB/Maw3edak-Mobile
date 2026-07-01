/*
  # Recreate device tokens table for push notifications

  1. New Tables
    - `device_tokens`
      - `id` (uuid, primary key) - Unique identifier for the token record
      - `patient_id` (uuid, references patients table) - Links token to a patient
      - `fcm_token` (text, unique) - The Expo/FCM push token
      - `platform` (text) - Device platform (ios or android)
      - `device_model` (text) - Device model name
      - `app_version` (text) - App version that registered the token
      - `is_active` (boolean, default true) - Whether the token is currently active
      - `created_at` (timestamptz) - When the token was first registered
      - `updated_at` (timestamptz) - When the token was last updated

  2. Security
    - Enable RLS on `device_tokens` table
    - Patients can view their own device tokens
    - Patients can insert their own device tokens
    - Patients can update their own device tokens
    - Patients can delete their own device tokens

  3. Indexes
    - Unique index on fcm_token for fast lookups and preventing duplicates
    - Index on patient_id for efficient patient token queries
    - Conditional index on is_active for filtering active tokens

  4. Notes
    - Only ios and android platforms are allowed
    - Tokens are automatically timestamped on creation and update
    - Old tokens for the same patient/platform should be deactivated when new ones are registered
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
