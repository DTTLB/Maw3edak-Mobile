/*
  # Add Device Token Upsert Function
  
  1. Purpose
    - Create efficient upsert function for device tokens
    - Implements single-device-only logic
    - Ensures atomic operations
  
  2. Function Details
    - Deactivates all other devices for the patient
    - Inserts new token or updates existing one
    - Returns the upserted record
  
  3. Security
    - Function uses SECURITY DEFINER to bypass RLS
    - Only accessible through edge functions with service role
*/

CREATE OR REPLACE FUNCTION upsert_device_token(
  p_patient_id UUID,
  p_medical_id TEXT,
  p_fcm_token TEXT,
  p_platform TEXT,
  p_device_model TEXT,
  p_app_version TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  patient_id UUID,
  medical_id TEXT,
  fcm_token TEXT,
  platform TEXT,
  device_model TEXT,
  app_version TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deactivate all other devices for this patient
  UPDATE device_tokens
  SET is_active = false
  WHERE device_tokens.patient_id = p_patient_id
    AND device_tokens.fcm_token != p_fcm_token;

  -- Insert or update the current device token
  RETURN QUERY
  INSERT INTO device_tokens (
    patient_id,
    medical_id,
    fcm_token,
    platform,
    device_model,
    app_version,
    is_active
  )
  VALUES (
    p_patient_id,
    p_medical_id,
    p_fcm_token,
    p_platform,
    p_device_model,
    p_app_version,
    true
  )
  ON CONFLICT (patient_id, fcm_token)
  DO UPDATE SET
    medical_id = EXCLUDED.medical_id,
    platform = EXCLUDED.platform,
    device_model = EXCLUDED.device_model,
    app_version = EXCLUDED.app_version,
    is_active = true,
    updated_at = NOW()
  RETURNING 
    device_tokens.id,
    device_tokens.patient_id,
    device_tokens.medical_id,
    device_tokens.fcm_token,
    device_tokens.platform,
    device_tokens.device_model,
    device_tokens.app_version,
    device_tokens.is_active,
    device_tokens.created_at,
    device_tokens.updated_at;
END;
$$;