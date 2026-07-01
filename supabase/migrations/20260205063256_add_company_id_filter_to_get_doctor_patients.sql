/*
  # Add Company ID Filter to get_doctor_patients Function

  1. Updates
    - Update `get_doctor_patients` function to accept and filter by company_id parameter

  2. Purpose
    - Ensures doctors only see patients from their selected clinic/company

  3. Notes
    - Backwards compatible - company_id is optional (defaults to NULL)
    - Filters on users.company_id to match the doctor's selected company
*/

-- Update get_doctor_patients function with company filter
CREATE OR REPLACE FUNCTION get_doctor_patients(
  p_global_id TEXT,
  p_company_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
  medical_id TEXT,
  full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.medical_id,
    (p.first_name || ' ' || p.last_name) AS full_name
  FROM patients p
  INNER JOIN patient_doctor_access pda ON pda.patient_id = p.id
  INNER JOIN doctors d ON d.id = pda.doctor_id
  INNER JOIN user_doctor_access uda ON uda.doctor_id = d.id
  INNER JOIN users u ON u.id = uda.user_id
  WHERE u.global_id = p_global_id
    AND (p_company_id IS NULL OR u.company_id = p_company_id)
  ORDER BY full_name;
END;
$$;