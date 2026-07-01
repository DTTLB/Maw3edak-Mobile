/*
  # Fix get_doctor_patients Function - Use Correct Phone Column

  1. Changes
    - Fix column reference from p.mobile to p.phone (correct column name in patients table)
*/

DROP FUNCTION IF EXISTS get_doctor_patients(TEXT, UUID);

CREATE OR REPLACE FUNCTION get_doctor_patients(
  p_global_id TEXT,
  p_company_id UUID DEFAULT NULL
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
  WHERE u.global_id = p_global_id
    AND (p_company_id IS NULL OR u.company_id = p_company_id)
  GROUP BY p.id, p.medical_id, p.first_name, p.last_name, p.email, p.phone, c.id, c.name
  ORDER BY MAX(a.appointment_date) DESC NULLS LAST, full_name;
END;
$$;