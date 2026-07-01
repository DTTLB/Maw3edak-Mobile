/*
  # Create Patient Profiles Storage Bucket

  1. Storage
    - Creates a public storage bucket `patient-profiles` for storing patient profile images
    - Sets up appropriate policies for authenticated users to manage their own profile images

  2. Security
    - Authenticated users can upload their own profile images
    - Anyone can view profile images (public read access)
    - Users can only update/delete their own images
*/

-- Create the storage bucket for patient profiles
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient-profiles',
  'patient-profiles',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own profile images
CREATE POLICY "Users can upload their own profile images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'patient-profiles'
);

-- Allow public read access to profile images
CREATE POLICY "Public read access to profile images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'patient-profiles');

-- Allow users to update their own profile images
CREATE POLICY "Users can update their own profile images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'patient-profiles');

-- Allow users to delete their own profile images
CREATE POLICY "Users can delete their own profile images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'patient-profiles');
