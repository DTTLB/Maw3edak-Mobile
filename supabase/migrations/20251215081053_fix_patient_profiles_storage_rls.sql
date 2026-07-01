/*
  # Fix Patient Profiles Storage RLS Policies

  This migration fixes the Row Level Security policies for the patient-profiles storage bucket
  to properly restrict access based on ownership.

  ## Changes

  1. Drop existing overly permissive policies
  2. Create new restrictive policies that:
     - Allow authenticated users to upload only to their own medical_id folder
     - Allow public read access to all profile images
     - Allow users to update/delete only files in their own medical_id folder
  
  ## File Structure
  
  Files should be stored as: patient-profiles/{medical_id}/profile.{ext}
  
  ## Security
  
  - Users can only upload/update/delete files in their own folder
  - Path validation ensures proper ownership
  - Public read access allows profile images to be displayed
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;

-- Allow authenticated users to upload their own profile images
-- Path format: patient-profiles/{medical_id}/profile.{ext}
CREATE POLICY "Authenticated users can upload their own profile images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'patient-profiles' AND
  (storage.foldername(name))[1] IN (
    SELECT CAST(medical_id AS TEXT)
    FROM public.user_patients
    WHERE id = auth.uid()
  )
);

-- Allow public read access to all profile images
CREATE POLICY "Public can view profile images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'patient-profiles');

-- Allow authenticated users to update their own profile images
CREATE POLICY "Authenticated users can update their own profile images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'patient-profiles' AND
  (storage.foldername(name))[1] IN (
    SELECT CAST(medical_id AS TEXT)
    FROM public.user_patients
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'patient-profiles' AND
  (storage.foldername(name))[1] IN (
    SELECT CAST(medical_id AS TEXT)
    FROM public.user_patients
    WHERE id = auth.uid()
  )
);

-- Allow authenticated users to delete their own profile images
CREATE POLICY "Authenticated users can delete their own profile images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'patient-profiles' AND
  (storage.foldername(name))[1] IN (
    SELECT CAST(medical_id AS TEXT)
    FROM public.user_patients
    WHERE id = auth.uid()
  )
);
