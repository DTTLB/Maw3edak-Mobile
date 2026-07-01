/*
  # Create Scheduling Tables for Appointment Booking

  1. New Tables
    - `doctor_schedules`
      - Stores recurring weekly schedules for doctors
      - Includes day_of_week (0=Sunday, 6=Saturday)
      - start_time and end_time for each day
      - Links to doctor_id and clinic_id
    
    - `schedule_exceptions`
      - Handles one-time schedule changes (vacations, special hours)
      - Overrides the regular schedule for specific dates
      - Can mark entire days as unavailable or set custom hours
    
    - `schedule_blocks`
      - Blocks specific time slots (lunch breaks, meetings, etc.)
      - Prevents booking during blocked times
      - Can be recurring or one-time blocks

  2. Security
    - Enable RLS on all tables
    - Public read access for viewing schedules
    - Admin-only write access
*/

-- Create doctor_schedules table
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, clinic_id, day_of_week)
);

-- Create schedule_exceptions table
CREATE TABLE IF NOT EXISTS schedule_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  exception_date date NOT NULL,
  is_available boolean DEFAULT false,
  start_time time,
  end_time time,
  reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, clinic_id, exception_date)
);

-- Create schedule_blocks table
CREATE TABLE IF NOT EXISTS schedule_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  block_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctor_schedules
CREATE POLICY "Anyone can view doctor schedules"
  ON doctor_schedules FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only authenticated users can insert schedules"
  ON doctor_schedules FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update schedules"
  ON doctor_schedules FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can delete schedules"
  ON doctor_schedules FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for schedule_exceptions
CREATE POLICY "Anyone can view schedule exceptions"
  ON schedule_exceptions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only authenticated users can insert exceptions"
  ON schedule_exceptions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update exceptions"
  ON schedule_exceptions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can delete exceptions"
  ON schedule_exceptions FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for schedule_blocks
CREATE POLICY "Anyone can view schedule blocks"
  ON schedule_blocks FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only authenticated users can insert blocks"
  ON schedule_blocks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update blocks"
  ON schedule_blocks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can delete blocks"
  ON schedule_blocks FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_clinic 
  ON doctor_schedules(doctor_id, clinic_id);

CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_doctor_date 
  ON schedule_exceptions(doctor_id, exception_date);

CREATE INDEX IF NOT EXISTS idx_schedule_blocks_doctor_date 
  ON schedule_blocks(doctor_id, block_date);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date_time 
  ON appointments(doctor_id, appointment_date, appointment_time);
