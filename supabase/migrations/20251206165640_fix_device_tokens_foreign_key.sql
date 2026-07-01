/*
  # Fix device_tokens foreign key constraint

  ## Problem
  The device_tokens table has a foreign key constraint pointing to the wrong table.
  - Current: patient_id references patients.id
  - Correct: patient_id should reference user_patients.id
  
  ## Changes
  1. Drop the existing foreign key constraint
  2. Add new foreign key constraint pointing to user_patients table
  
  ## Impact
  - Allows device tokens to be saved for logged-in users from user_patients table
  - Maintains referential integrity with the correct parent table
*/

-- Drop the existing foreign key constraint
ALTER TABLE device_tokens 
DROP CONSTRAINT IF EXISTS device_tokens_patient_id_fkey;

-- Add new foreign key constraint pointing to user_patients
ALTER TABLE device_tokens 
ADD CONSTRAINT device_tokens_patient_id_fkey 
FOREIGN KEY (patient_id) 
REFERENCES user_patients(id) 
ON DELETE CASCADE;
