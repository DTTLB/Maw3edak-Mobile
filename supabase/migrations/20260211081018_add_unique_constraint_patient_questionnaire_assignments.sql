/*
  # Add unique constraint to patient_questionnaire_assignments

  1. Changes
    - Add unique constraint to prevent duplicate questionnaire assignments for the same patient
    - Constraint ensures one patient cannot have the same questionnaire assigned multiple times
    - Covers combination of (patient_id, questionnaire_id, status) where status is not 'completed'

  2. Impact
    - Prevents accidentally assigning the same questionnaire twice to a patient
    - Completed questionnaires can still be reassigned if needed
*/

-- Add unique constraint to prevent duplicate active assignments
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_questionnaire_assignment 
ON patient_questionnaire_assignments (patient_id, questionnaire_id) 
WHERE status IN ('pending', 'in_progress');
