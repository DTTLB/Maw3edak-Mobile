/*
  # Fix device_tokens RLS for Edge Functions
  
  1. Changes
    - Add policies that allow service role to insert/update device tokens
    - This enables edge functions to save device tokens on behalf of users
  
  2. Security
    - Service role has full access (used by backend edge functions)
    - Regular authenticated users still restricted to their own tokens
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage all device tokens" ON device_tokens;
DROP POLICY IF EXISTS "Service role can insert device tokens" ON device_tokens;
DROP POLICY IF EXISTS "Service role can update device tokens" ON device_tokens;

-- Create policy for service role to insert tokens
CREATE POLICY "Service role can insert device tokens"
  ON device_tokens FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create policy for service role to update tokens
CREATE POLICY "Service role can update device tokens"
  ON device_tokens FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy for service role to select tokens
CREATE POLICY "Service role can select device tokens"
  ON device_tokens FOR SELECT
  TO service_role
  USING (true);
