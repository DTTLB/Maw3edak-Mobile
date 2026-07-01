/*
  # Fix Upsert Device Token Function - Remove Ambiguity
  
  1. Problem
    - Column name ambiguity between RETURNS TABLE columns and actual table columns
    - ON CONFLICT clause cannot determine which "patient_id" to use
  
  2. Solution
    - Use a record type instead of RETURNS TABLE to avoid naming conflicts
    - Simplify the function to eliminate ambiguous references
  
  3. Impact
    - Device tokens will now be saved correctly from mobile devices
*/

DROP FUNCTION IF EXISTS upsert_device_token(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);

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
  ON CONFLICT (patient_id, fcm_token)
  DO UPDATE SET
    medical_id = EXCLUDED.medical_id,
    platform = EXCLUDED.platform,
    device_model = EXCLUDED.device_model,
    app_version = EXCLUDED.app_version,
    is_active = true,
    updated_at = NOW()
  RETURNING *;
END;
$$;
