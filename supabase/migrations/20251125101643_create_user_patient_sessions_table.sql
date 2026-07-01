/*
  # Create user_patient_sessions table

  1. New Tables
    - `user_patient_sessions`
      - `id` (uuid, primary key) - Unique session identifier
      - `patient_id` (uuid, foreign key) - References user_patients.id
      - `token` (text, unique) - Session token for authentication
      - `expires_at` (timestamptz) - Session expiration timestamp
      - `created_at` (timestamptz) - Session creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `user_patient_sessions` table
    - Add policy for patients to read their own sessions
    - Add index on token for fast lookup
    - Add index on patient_id for efficient queries

  3. Important Notes
    - This table stores authentication sessions for mobile app users
    - Tokens are generated during login and validated on each request
    - Sessions automatically expire based on expires_at timestamp
*/

-- Create the user_patient_sessions table
CREATE TABLE IF NOT EXISTS user_patient_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES user_patients(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_patient_sessions_token ON user_patient_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_patient_sessions_patient_id ON user_patient_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_user_patient_sessions_expires_at ON user_patient_sessions(expires_at);

-- Enable Row Level Security
ALTER TABLE user_patient_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Patients can read their own sessions
CREATE POLICY "Patients can read own sessions"
  ON user_patient_sessions
  FOR SELECT
  TO authenticated
  USING (patient_id = (SELECT id FROM user_patients WHERE email = auth.jwt()->>'email'));

-- Policy: Service role can manage all sessions (for edge functions)
CREATE POLICY "Service role can manage all sessions"
  ON user_patient_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);