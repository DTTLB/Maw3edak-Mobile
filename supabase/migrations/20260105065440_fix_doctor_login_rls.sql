/*
  # Fix RLS policies for doctor login

  1. Security Changes
    - Add policy to allow service role to read users table for authentication
    - Service role needs to query users table during login to verify credentials
    - This is secure because only the service role (used by edge functions) can access this

  2. Changes
    - Add policy for service role to SELECT from users table
*/

-- Allow service role to read users for authentication
CREATE POLICY "Service role can read users for authentication"
  ON users
  FOR SELECT
  TO service_role
  USING (true);
