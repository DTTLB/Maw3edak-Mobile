/*
  # Add Company ID Filter to Doctor Dashboard Functions

  1. Updates
    - Update `get_doctor_today_schedule` to filter by company_id
    - Update `get_doctor_completed_today` to filter by company_id
    - Update `get_doctor_pending_today` to filter by company_id
    - Update `get_doctor_cancelled_count` to filter by company_id
    - Update `get_doctor_total_patients` to filter by company_id

  2. Purpose
    - Ensures doctors only see data from their selected clinic/company
    - Adds p_company_id parameter to all doctor dashboard functions

  3. Notes
    - company_id is filtered on the users table (d.company_id)
    - All functions maintain existing global_id filtering
    - Backwards compatible - works with existing data
*/

-- Function to get today's schedule count with company filter
CREATE OR REPLACE FUNCTION get_doctor_today_schedule(
  p_global_id TEXT,
  p_today TEXT,
  p_tomorrow TEXT,
  p_company_id INTEGER DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT a.id)::INTEGER INTO v_count
  FROM appointments a
  INNER JOIN doctors b ON a.doctor_id = b.id
  INNER JOIN user_doctor_access c ON c.doctor_id = b.id
  INNER JOIN users d ON d.id = c.user_id
  WHERE d.global_id = p_global_id
    AND (p_company_id IS NULL OR d.company_id = p_company_id)
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Function to get completed appointments today with company filter
CREATE OR REPLACE FUNCTION get_doctor_completed_today(
  p_global_id TEXT,
  p_today TEXT,
  p_tomorrow TEXT,
  p_company_id INTEGER DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT a.id)::INTEGER INTO v_count
  FROM appointments a
  INNER JOIN doctors b ON a.doctor_id = b.id
  INNER JOIN user_doctor_access c ON c.doctor_id = b.id
  INNER JOIN users d ON d.id = c.user_id
  WHERE d.global_id = p_global_id
    AND (p_company_id IS NULL OR d.company_id = p_company_id)
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND a.status = 'completed';
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Function to get pending appointments today with company filter
CREATE OR REPLACE FUNCTION get_doctor_pending_today(
  p_global_id TEXT,
  p_today TEXT,
  p_tomorrow TEXT,
  p_company_id INTEGER DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT a.id)::INTEGER INTO v_count
  FROM appointments a
  INNER JOIN doctors b ON a.doctor_id = b.id
  INNER JOIN user_doctor_access c ON c.doctor_id = b.id
  INNER JOIN users d ON d.id = c.user_id
  WHERE d.global_id = p_global_id
    AND (p_company_id IS NULL OR d.company_id = p_company_id)
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND a.status IN ('pending', 'scheduled', 'confirmed');
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Function to get cancelled appointments today with company filter
CREATE OR REPLACE FUNCTION get_doctor_cancelled_count(
  p_global_id TEXT,
  p_today TEXT,
  p_tomorrow TEXT,
  p_company_id INTEGER DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT a.id)::INTEGER INTO v_count
  FROM appointments a
  INNER JOIN doctors b ON a.doctor_id = b.id
  INNER JOIN user_doctor_access c ON c.doctor_id = b.id
  INNER JOIN users d ON d.id = c.user_id
  WHERE d.global_id = p_global_id
    AND (p_company_id IS NULL OR d.company_id = p_company_id)
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND LOWER(a.status) = 'cancelled';
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Function to get total unique patients with company filter
CREATE OR REPLACE FUNCTION get_doctor_total_patients(
  p_global_id TEXT,
  p_company_id INTEGER DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT a.patient_id)::INTEGER INTO v_count
  FROM appointments a
  INNER JOIN doctors b ON a.doctor_id = b.id
  INNER JOIN user_doctor_access c ON c.doctor_id = b.id
  INNER JOIN users d ON d.id = c.user_id
  WHERE d.global_id = p_global_id
    AND (p_company_id IS NULL OR d.company_id = p_company_id);
  
  RETURN COALESCE(v_count, 0);
END;
$$;