/*
  # Make patient_id nullable in device_tokens table

  1. Changes
    - Alter `patient_id` column in `device_tokens` table to be nullable
    - This allows storing device tokens for both patients and doctors
    - Doctors will use `user_id` + `global_id`, patients use `patient_id` + `medical_id`
  
  2. Notes
    - Existing patient tokens remain unchanged
    - Doctor tokens will have NULL patient_id but populated user_id
*/

-- Make patient_id nullable
ALTER TABLE device_tokens 
ALTER COLUMN patient_id DROP NOT NULL;