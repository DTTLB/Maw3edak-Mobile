/*
  # Fix Upsert Device Token Function - Ambiguous Column Reference
  
  1. Problem
    - The upsert_device_token function has ambiguous column references
    - Column name "patient_id" conflicts between function parameters and table columns
    - This causes the function to fail silently in production
  
  2. Solution
    - Properly qualify all column references with schema and table names
    - Fix the UPDATE statement to avoid ambiguity
    - Fix the ON CONFLICT clause
  
  3. Impact
    - Device tokens will now be saved correctly from mobile devices
    - Single-device-only logic will work as intended
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
SET search_path = public
AS $$
BEGIN
  -- Deactivate all other devices for this patient
  UPDATE public.device_tokens dt
  SET is_active = false
  WHERE dt.patient_id = p_patient_id
    AND dt.fcm_token != p_fcm_token;

  -- Insert or update the current device token
  RETURN QUERY
  INSERT INTO public.device_tokens (
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
    public.device_tokens.id,
    public.device_tokens.patient_id,
    public.device_tokens.medical_id,
    public.device_tokens.fcm_token,
    public.device_tokens.platform,
    public.device_tokens.device_model,
    public.device_tokens.app_version,
    public.device_tokens.is_active,
    public.device_tokens.created_at,
    public.device_tokens.updated_at;
END;
$$;
