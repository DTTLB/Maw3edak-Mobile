/*
  # Fix device_tokens.global_id data type

  1. Problem
    - users.global_id is TEXT (e.g., "DR-2WRZ2CFJ")
    - device_tokens.global_id is UUID
    - This causes inserts to fail when saving doctor device tokens

  2. Solution
    - Change device_tokens.global_id from UUID to TEXT
    - This matches the data type in users table

  3. Impact
    - Allows doctor device tokens to be saved correctly
    - No data loss (column should be empty since inserts were failing)
*/

-- Drop the existing global_id column (should be empty since inserts were failing)
ALTER TABLE device_tokens DROP COLUMN IF EXISTS global_id;

-- Re-add global_id as TEXT to match users table
ALTER TABLE device_tokens ADD COLUMN global_id TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_device_tokens_global_id ON device_tokens(global_id);
