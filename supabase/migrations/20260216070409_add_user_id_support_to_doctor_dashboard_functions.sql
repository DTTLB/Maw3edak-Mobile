/*
  # Add user_id Support to Doctor Dashboard Functions

  1. Updates
    - Update all doctor dashboard functions to support both p_global_id and p_user_id
    - Functions will work with either parameter (global_id for multi-company users, user_id for single-company users)
    - Functions: get_doctor_today_schedule, get_doctor_completed_today, get_doctor_pending_today, get_doctor_cancelled_count

  2. Purpose
    - Support users without global_id (single-company admins/doctors)
    - Maintain backward compatibility with existing global_id-based queries
*/

-- Function to get today's schedule count with user_id support
CREATE OR REPLACE FUNCTION get_doctor_today_schedule(
  p_global_id TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_today TEXT DEFAULT NULL,
  p_tomorrow TEXT DEFAULT NULL,
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
  WHERE (
    (p_global_id IS NOT NULL AND d.global_id = p_global_id)
    OR (p_user_id IS NOT NULL AND d.id = p_user_id)
  )
    AND (p_company_id IS NULL OR d.company_id = p_company_id)
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Function to get completed appointments today with user_id support
CREATE OR REPLACE FUNCTION get_doctor_completed_today(
  p_global_id TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_today TEXT DEFAULT NULL,
  p_tomorrow TEXT DEFAULT NULL,
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
  WHERE (
    (p_global_id IS NOT NULL AND d.global_id = p_global_id)
    OR (p_user_id IS NOT NULL AND d.id = p_user_id)
  )
    AND (p_company_id IS NULL OR d.company_id = p_company_id)
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND a.status = 'completed';
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Function to get pending appointments today with user_id support
CREATE OR REPLACE FUNCTION get_doctor_pending_today(
  p_global_id TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_today TEXT DEFAULT NULL,
  p_tomorrow TEXT DEFAULT NULL,
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
  WHERE (
    (p_global_id IS NOT NULL AND d.global_id = p_global_id)
    OR (p_user_id IS NOT NULL AND d.id = p_user_id)
  )
    AND (p_company_id IS NULL OR d.company_id = p_company_id)
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND a.status IN ('pending', 'scheduled', 'confirmed');
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Function to get cancelled appointments today with user_id support
CREATE OR REPLACE FUNCTION get_doctor_cancelled_count(
  p_global_id TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_today TEXT DEFAULT NULL,
  p_tomorrow TEXT DEFAULT NULL,
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
  WHERE (
    (p_global_id IS NOT NULL AND d.global_id = p_global_id)
    OR (p_user_id IS NOT NULL AND d.id = p_user_id)
  )
    AND (p_company_id IS NULL OR d.company_id = p_company_id)
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND LOWER(a.status) = 'cancelled';
  
  RETURN COALESCE(v_count, 0);
END;
$$;
