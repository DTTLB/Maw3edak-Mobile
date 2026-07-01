/*
  # Fix upsert_device_token ON CONFLICT Clause
  
  1. Problem
    - Function uses ON CONFLICT (patient_id, fcm_token) 
    - But table only has UNIQUE constraint on fcm_token alone
    - This causes INSERT to fail silently
  
  2. Solution
    - Change ON CONFLICT to use (fcm_token) only
    - This matches the actual unique constraint on the table
  
  3. Impact
    - Device tokens will now be saved correctly during login
*/

CREATE OR REPLACE FUNCTION upsert_device_token(
  p_patient_id UUID,
  p_medical_id TEXT,
  p_fcm_token TEXT,
  p_platform TEXT,
  p_device_model TEXT,
  p_app_version TEXT DEFAULT NULL
)
RETURNS SETOF device_tokens
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  ON CONFLICT (fcm_token)
  DO UPDATE SET
    patient_id = EXCLUDED.patient_id,
    medical_id = EXCLUDED.medical_id,
    platform = EXCLUDED.platform,
    device_model = EXCLUDED.device_model,
    app_version = EXCLUDED.app_version,
    is_active = true,
    updated_at = NOW()
  RETURNING *;
END;
$$;