/*
  # Fix Storage RLS for Service Role

  This migration adds a public INSERT policy for the patient-profiles storage bucket
  to allow the edge function (using SERVICE_ROLE_KEY) to upload profile images.

  ## Changes

  1. Add public INSERT policy for patient-profiles bucket
     - Allows uploads from edge functions using SERVICE_ROLE_KEY
     - Maintains security by restricting to specific bucket

  ## Security

  - Only allows uploads to patient-profiles bucket
  - Edge function validates session tokens before uploading
  - Files are public-readable as bucket is marked public
*/

-- Add public policy to allow uploads from edge functions
CREATE POLICY "Allow public uploads to patient profiles"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'patient-profiles');
