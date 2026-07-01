/*
  # Add slot_duration to doctor_schedules

  1. Changes
    - Add `slot_duration` column to doctor_schedules table
    - Default value is 30 minutes
    - Used to determine appointment slot intervals
*/

ALTER TABLE doctor_schedules 
ADD COLUMN IF NOT EXISTS slot_duration integer DEFAULT 30 CHECK (slot_duration > 0);

COMMENT ON COLUMN doctor_schedules.slot_duration IS 'Duration of each appointment slot in minutes';
