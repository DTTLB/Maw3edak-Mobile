/*
  # Clean and Fix All Doctor Dashboard Functions

  1. Problem
    - Multiple versions of dashboard functions exist causing conflicts
    - Some versions have incorrect logic

  2. Solution
    - Drop all old versions
    - Recreate functions with correct logic
    - Scheduled: All appointments for today
    - Pending: Appointments with status 'scheduled', 'pending', or 'confirmed'
    - Completed: Appointments with status 'completed'
    - Cancelled: Appointments with status 'cancelled'
*/

-- Drop all versions of dashboard functions
DROP FUNCTION IF EXISTS get_doctor_today_schedule(uuid, uuid);
DROP FUNCTION IF EXISTS get_doctor_today_schedule(text, text, text);
DROP FUNCTION IF EXISTS get_doctor_today_schedule(text, text, text, integer);
DROP FUNCTION IF EXISTS get_doctor_today_schedule(text, text, text, uuid);

DROP FUNCTION IF EXISTS get_doctor_completed_today(uuid, uuid);
DROP FUNCTION IF EXISTS get_doctor_completed_today(text, text, text);
DROP FUNCTION IF EXISTS get_doctor_completed_today(text, text, text, integer);
DROP FUNCTION IF EXISTS get_doctor_completed_today(text, text, text, uuid);

DROP FUNCTION IF EXISTS get_doctor_cancelled_count(text);
DROP FUNCTION IF EXISTS get_doctor_cancelled_count(uuid, uuid);
DROP FUNCTION IF EXISTS get_doctor_cancelled_count(text, text, text);
DROP FUNCTION IF EXISTS get_doctor_cancelled_count(text, text, text, integer);
DROP FUNCTION IF EXISTS get_doctor_cancelled_count(text, text, text, uuid);

-- Recreate get_doctor_today_schedule
CREATE FUNCTION get_doctor_today_schedule(
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

-- Recreate get_doctor_completed_today
CREATE FUNCTION get_doctor_completed_today(
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

-- Recreate get_doctor_cancelled_count
CREATE FUNCTION get_doctor_cancelled_count(
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
