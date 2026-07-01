/*
  # Remove Duplicate Indexes
  
  ## Issue
  Database linter detected duplicate indexes:
  1. prescription_items: idx_prescription_items_prescription (duplicate of idx_prescription_items_definition_id)
  2. user_patient_sessions: idx_user_patient_sessions_expires (duplicate of idx_user_patient_sessions_expires_at)
  
  ## Changes
  - Drop the duplicate indexes created in recent optimization
  - Keep the original indexes
  
  ## Impact
  - Reduces index maintenance overhead
  - Saves disk space
  - Improves write performance slightly
*/

-- Drop duplicate index on prescription_items
-- Keep idx_prescription_items_definition_id, drop idx_prescription_items_prescription
DROP INDEX IF EXISTS idx_prescription_items_prescription;

-- Drop duplicate index on user_patient_sessions  
-- Keep idx_user_patient_sessions_expires_at, drop idx_user_patient_sessions_expires
DROP INDEX IF EXISTS idx_user_patient_sessions_expires;

-- Add comment to track this fix
COMMENT ON INDEX idx_prescription_items_definition_id IS 'Performance: prescription items lookup by definition (duplicate removed)';
COMMENT ON INDEX idx_user_patient_sessions_expires_at IS 'Performance: session expiration lookup (duplicate removed)';
