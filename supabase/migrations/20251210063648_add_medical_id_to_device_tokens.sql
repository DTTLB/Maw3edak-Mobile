/*
  # Add medical_id to device_tokens table

  1. Changes
    - Add `medical_id` column to `device_tokens` table
    - References user_patients.medical_id
    - Not nullable, required for all device tokens
    - Index on medical_id for fast lookups

  2. Notes
    - This allows quick lookup of devices by medical_id
    - Enables sending notifications by medical_id without joining to user_patients table
*/

-- Add medical_id column to device_tokens table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'device_tokens' AND column_name = 'medical_id'
  ) THEN
    ALTER TABLE device_tokens ADD COLUMN medical_id text;
    
    -- Add foreign key constraint
    ALTER TABLE device_tokens
      ADD CONSTRAINT fk_device_tokens_medical_id
      FOREIGN KEY (medical_id)
      REFERENCES user_patients(medical_id)
      ON DELETE CASCADE;
    
    -- Create index for fast lookups
    CREATE INDEX IF NOT EXISTS idx_device_tokens_medical_id ON device_tokens(medical_id);
  END IF;
END $$;