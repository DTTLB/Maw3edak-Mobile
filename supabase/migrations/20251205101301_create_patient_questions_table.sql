/*
  # Create Patient Questions Table for Doctor Q&A

  1. New Tables
    - `patient_questions`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `doctor_id` (uuid, references doctors)
      - `company_id` (uuid, references companies)
      - `question` (text) - Patient's question
      - `response` (text, nullable) - Doctor's response
      - `status` (text) - Question status (pending/answered)
      - `created_at` (timestamptz) - When question was asked
      - `answered_at` (timestamptz, nullable) - When doctor responded

  2. Security
    - Enable RLS on `patient_questions` table
    - Add policies for patients to view their own questions
    - Add policies for doctors to view questions from their patients
*/

CREATE TABLE IF NOT EXISTS patient_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  question text NOT NULL,
  response text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered')),
  created_at timestamptz DEFAULT now(),
  answered_at timestamptz
);

ALTER TABLE patient_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view their own questions"
  ON patient_questions
  FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients 
      WHERE medical_id = current_setting('request.jwt.claims', true)::json->>'medical_id'
    )
  );

CREATE POLICY "Doctors can view questions from their patients"
  ON patient_questions
  FOR SELECT
  TO authenticated
  USING (
    doctor_id IN (
      SELECT id FROM doctors 
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'doctor_id')::uuid
    )
  );

CREATE POLICY "Doctors can update responses to questions"
  ON patient_questions
  FOR UPDATE
  TO authenticated
  USING (
    doctor_id IN (
      SELECT id FROM doctors 
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'doctor_id')::uuid
    )
  )
  WITH CHECK (
    doctor_id IN (
      SELECT id FROM doctors 
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'doctor_id')::uuid
    )
  );

CREATE INDEX IF NOT EXISTS idx_patient_questions_patient_id ON patient_questions(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_questions_doctor_id ON patient_questions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_questions_status ON patient_questions(status);
