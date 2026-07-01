/*
  # Add user_id support to get_doctor_patients

  Receptionists (and single-company staff) have NO global_id of their own, so
  they cannot be resolved by `users.global_id`. This recreates get_doctor_patients
  to accept an optional `p_user_id` in addition to `p_global_id`:

    - Doctor (existing): pass p_global_id -> resolves users by global_id.
    - Receptionist (new): pass p_user_id   -> resolves the single user row,
      then their user_doctor_access -> assigned doctor profiles -> patients.

  Backward compatible: existing 2-arg calls get_doctor_patients(p_global_id,
  p_company_id) still work because every parameter is defaulted. The previous
  (TEXT, UUID) signature is dropped so there is no overload ambiguity.

  Preserves the latest body from
  20260628000001_filter_soft_deleted_in_get_doctor_patients.sql:
    - correct phone column (p.phone)
    - soft-delete filters on patients / doctors / users
*/

DROP FUNCTION IF EXISTS get_doctor_patients(TEXT, UUID);

CREATE OR REPLACE FUNCTION get_doctor_patients(
  p_global_id TEXT DEFAULT NULL,
  p_company_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  patient_id UUID,
  medical_id TEXT,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  company_id UUID,
  company_name TEXT,
  appointment_count BIGINT,
  last_appointment_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id AS patient_id,
    p.medical_id,
    (p.first_name || ' ' || p.last_name) AS full_name,
    p.email,
    p.phone,
    c.id AS company_id,
    c.name AS company_name,
    COUNT(a.id) AS appointment_count,
    MAX(a.appointment_date) AS last_appointment_date
  FROM patients p
  INNER JOIN patient_doctor_access pda ON pda.patient_id = p.id
  INNER JOIN doctors d ON d.id = pda.doctor_id
  INNER JOIN user_doctor_access uda ON uda.doctor_id = d.id
  INNER JOIN users u ON u.id = uda.user_id
  INNER JOIN companies c ON c.id = u.company_id
  LEFT JOIN appointments a ON a.patient_id = p.id AND a.doctor_id = d.id
  WHERE (
      (p_global_id IS NOT NULL AND u.global_id = p_global_id)
      OR (p_user_id IS NOT NULL AND u.id = p_user_id)
    )
    AND (p_company_id IS NULL OR u.company_id = p_company_id)
    AND p.is_deleted = FALSE
    AND d.is_deleted = FALSE
    AND u.is_deleted = FALSE
  GROUP BY p.id, p.medical_id, p.first_name, p.last_name, p.email, p.phone, c.id, c.name
  ORDER BY MAX(a.appointment_date) DESC NULLS LAST, full_name;
END;
$$;
