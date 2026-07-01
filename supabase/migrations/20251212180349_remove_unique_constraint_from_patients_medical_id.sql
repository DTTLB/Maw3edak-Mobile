/*
  # Remove unique constraint from patients.medical_id

  1. Changes
    - Drop the unique constraint on medical_id because the same medical_id 
      can exist for patients in different companies
    - This is valid business logic where one medical ID can be registered
      across multiple healthcare companies

  2. Notes
    - user_patients table links app users to their medical_id
    - patients table can have multiple records with same medical_id (different companies)
    - The relationship is: user_patients.medical_id -> patients.medical_id (one to many)
*/

-- Drop the unique index if it exists
DROP INDEX IF EXISTS patients_medical_id_unique_idx;