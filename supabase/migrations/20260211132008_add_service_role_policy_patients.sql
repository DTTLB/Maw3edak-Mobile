/*
  # Add Service Role Policy for Patients Table
  
  1. Changes
    - Add policy to allow service role full access to patients
    - This ensures edge functions can join and query patient data properly
*/

-- Add policy for service role
CREATE POLICY "Service role full access"
  ON patients
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
