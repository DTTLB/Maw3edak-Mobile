/*
  # Fix Patient Notifications Foreign Key - Step by Step

  1. Changes
    - Drop the old foreign key constraint first
    - Update existing notifications to use the correct patient_id from user_patients
    - Add new foreign key constraint that points to `user_patients` table
    
  2. Why This Fix Is Needed
    - The mobile app uses the `user_patients` table for authentication
    - But `patient_notifications` was referencing the old `patients` table
    - Need to migrate the data to use the correct patient_id
*/

-- Step 1: Drop the old foreign key constraint
ALTER TABLE patient_notifications
DROP CONSTRAINT IF EXISTS patient_notifications_patient_id_fkey;

-- Step 2: Update existing notifications to use the correct patient_id from user_patients
UPDATE patient_notifications pn
SET patient_id = up.id
FROM user_patients up
WHERE pn.medical_id = up.medical_id;

-- Step 3: Add new foreign key constraint pointing to user_patients
ALTER TABLE patient_notifications
ADD CONSTRAINT patient_notifications_patient_id_user_patients_fkey
FOREIGN KEY (patient_id) 
REFERENCES user_patients(id) 
ON DELETE CASCADE;