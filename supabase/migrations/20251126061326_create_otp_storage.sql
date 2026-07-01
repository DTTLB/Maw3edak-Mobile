/*
  # Create OTP Verification Storage

  1. New Tables
    - `otp_verifications` - Temporary OTP storage for registration

  2. Security
    - Enable RLS
    - Policies for anon and service role access
*/

CREATE TABLE otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  email text NOT NULL,
  otp_code text NOT NULL,
  is_verified boolean DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;