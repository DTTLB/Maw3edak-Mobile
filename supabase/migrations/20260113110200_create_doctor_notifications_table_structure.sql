/*
  # Create Doctor Notifications Table Structure

  1. New Tables
    - `doctor_notifications`
      - `id` (uuid, primary key)
      - `company_id` (integer, foreign key to companies)
      - `doctor_id` (integer, foreign key to doctors)
      - `patient_id` (integer, foreign key to patients)
      - `objective_id` (integer, references various objects like appointments)
      - `category` (text, e.g., 'appointment', 'order', 'questionnaire')
      - `message` (text, notification message)
      - `read` (boolean, default false)
      - `status` (text, e.g., 'pending', 'completed')
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Indexes
    - Index on doctor_id for fast lookups
    - Index on read status for filtering
    - Index on created_at for sorting
*/

-- Create the doctor_notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS doctor_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id integer NOT NULL,
  doctor_id integer NOT NULL,
  patient_id integer,
  objective_id integer,
  category text NOT NULL DEFAULT 'notification',
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_doctor_notifications_company'
  ) THEN
    ALTER TABLE doctor_notifications
      ADD CONSTRAINT fk_doctor_notifications_company
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_doctor_notifications_doctor'
  ) THEN
    ALTER TABLE doctor_notifications
      ADD CONSTRAINT fk_doctor_notifications_doctor
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_doctor_notifications_patient'
  ) THEN
    ALTER TABLE doctor_notifications
      ADD CONSTRAINT fk_doctor_notifications_patient
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctor_notifications_doctor_id ON doctor_notifications(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_notifications_read ON doctor_notifications(read);
CREATE INDEX IF NOT EXISTS idx_doctor_notifications_created_at ON doctor_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doctor_notifications_category ON doctor_notifications(category);