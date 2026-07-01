/*
  # Add Service Role Policy for Patient Questionnaire Responses
  
  1. Changes
    - Add policy to allow service role full access to patient_questionnaire_responses
    - This ensures edge functions can query responses properly
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role full access" ON patient_questionnaire_responses;

-- Add policy for service role
CREATE POLICY "Service role full access"
  ON patient_questionnaire_responses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
