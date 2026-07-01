/*
  # Make global_id nullable in doctor_notifications
  
  1. Changes
    - Alter `doctor_notifications` table to make `global_id` column nullable
    - This allows notifications to be created without a specific user ID
*/

ALTER TABLE doctor_notifications 
ALTER COLUMN global_id DROP NOT NULL;
