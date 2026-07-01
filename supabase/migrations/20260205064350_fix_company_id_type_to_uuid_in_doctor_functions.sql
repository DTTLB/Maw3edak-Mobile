/*
  # Fix Company ID Type to UUID in Doctor Dashboard Functions

  1. Updates
    - Update all doctor dashboard functions to use UUID instead of INTEGER for p_company_id parameter
    - Functions: get_doctor_today_schedule, get_doctor_completed_today, get_doctor_pending_today, 
                 get_doctor_cancelled_count, get_doctor_total_patients, get_doctor_patients

  2. Purpose
    - Fix company_id filtering to work with UUID type (companies.id is UUID, not integer)
    - Ensures proper data filtering by company
*/

-- Function to get today's schedule count with company filter (UUID)
CREATE OR REPLACE FUNCTION get_doctor_today_schedule(
  p_global_id TEXT,
  p_today TEXT,
  p_tomorrow TEXT,
  p_company_id UUID DEFAULT NULL
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

-- Function to get completed appointments today with company filter (UUID)
CREATE OR REPLACE FUNCTION get_doctor_completed_today(
  p_global_id TEXT,
  p_today TEXT,
  p_tomorrow TEXT,
  p_company_id UUID DEFAULT NULL
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

-- Function to get pending appointments today with company filter (UUID)
CREATE OR REPLACE FUNCTION get_doctor_pending_today(
  p_global_id TEXT,
  p_today TEXT,
  p_tomorrow TEXT,
  p_company_id UUID DEFAULT NULL
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

-- Function to get cancelled appointments today with company filter (UUID)
CREATE OR REPLACE FUNCTION get_doctor_cancelled_count(
  p_global_id TEXT,
  p_today TEXT,
  p_tomorrow TEXT,
  p_company_id UUID DEFAULT NULL
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

-- Function to get total unique patients with company filter (UUID)
CREATE OR REPLACE FUNCTION get_doctor_total_patients(
  p_global_id TEXT,
  p_company_id UUID DEFAULT NULL
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

-- Update get_doctor_patients function with UUID company filter
CREATE OR REPLACE FUNCTION get_doctor_patients(
  p_global_id TEXT,
  p_company_id UUID DEFAULT NULL
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