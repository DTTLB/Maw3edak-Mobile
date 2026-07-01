/*
  # Fix Doctor Dashboard Pending Status Check

  1. Problem
    - The get_doctor_pending_today function was checking LOWER(a.status) = 'pending'
    - This misses appointments with status 'scheduled' or 'confirmed'
    - As per requirements: PENDING should include appointments with "scheduled" status

  2. Solution
    - Drop old function versions to avoid conflicts
    - Recreate the function with correct status check: IN ('pending', 'scheduled', 'confirmed')
*/

-- Drop all versions of the function to avoid conflicts
DROP FUNCTION IF EXISTS get_doctor_pending_today(uuid, uuid);
DROP FUNCTION IF EXISTS get_doctor_pending_today(text, text, text);
DROP FUNCTION IF EXISTS get_doctor_pending_today(text, text, text, integer);
DROP FUNCTION IF EXISTS get_doctor_pending_today(text, text, text, uuid);

-- Recreate with correct logic
CREATE FUNCTION get_doctor_pending_today(
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
