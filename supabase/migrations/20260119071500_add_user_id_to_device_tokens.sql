/*
  # Add user_id column to device_tokens for doctors

  1. Changes
    - Add `user_id` column to `device_tokens` table (nullable)
    - Add `global_id` column to `device_tokens` table (nullable)
    - This allows storing device tokens for both patients and doctors
    - Doctors will use `user_id` + `global_id`
    - Patients will use `patient_id` + `medical_id`
    - Add constraint: either patient_id or user_id must be set (not both, not neither)

  2. Security
    - Add RLS policies for doctors to manage their own tokens
    - Service role already has access via existing policies

  3. Notes
    - Existing patient tokens remain unchanged
    - Doctor tokens will have NULL patient_id but populated user_id
*/

-- Add user_id column for doctor device tokens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'device_tokens' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE device_tokens ADD COLUMN user_id uuid REFERENCES users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);
  END IF;
END $$;

-- Add global_id column for doctor device tokens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'device_tokens' AND column_name = 'global_id'
  ) THEN
    ALTER TABLE device_tokens ADD COLUMN global_id uuid;
    CREATE INDEX IF NOT EXISTS idx_device_tokens_global_id ON device_tokens(global_id);
  END IF;
END $$;

-- Add check constraint: must have either patient_id or user_id (not both, not neither)
DO $$
BEGIN
  ALTER TABLE device_tokens
  DROP CONSTRAINT IF EXISTS device_tokens_user_type_check;

  ALTER TABLE device_tokens
  ADD CONSTRAINT device_tokens_user_type_check
  CHECK (
    (patient_id IS NOT NULL AND user_id IS NULL) OR
    (patient_id IS NULL AND user_id IS NOT NULL)
  );
END $$;

-- Add RLS policies for doctors to view their own tokens
DROP POLICY IF EXISTS "Doctors can view own device tokens" ON device_tokens;
CREATE POLICY "Doctors can view own device tokens"
  ON device_tokens FOR SELECT
  TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());

-- Add RLS policies for doctors to insert their own tokens
DROP POLICY IF EXISTS "Doctors can insert own device tokens" ON device_tokens;
CREATE POLICY "Doctors can insert own device tokens"
  ON device_tokens FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NOT NULL AND user_id = auth.uid());

-- Add RLS policies for doctors to update their own tokens
DROP POLICY IF EXISTS "Doctors can update own device tokens" ON device_tokens;
CREATE POLICY "Doctors can update own device tokens"
  ON device_tokens FOR UPDATE
  TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid())
  WITH CHECK (user_id IS NOT NULL AND user_id = auth.uid());

-- Add RLS policies for doctors to delete their own tokens
DROP POLICY IF EXISTS "Doctors can delete own device tokens" ON device_tokens;
CREATE POLICY "Doctors can delete own device tokens"
  ON device_tokens FOR DELETE
  TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());
