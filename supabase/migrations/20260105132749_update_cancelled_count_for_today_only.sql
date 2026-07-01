/*
  # Update Cancelled Count - Today Only

  1. Changes
    - Update get_doctor_cancelled_count to accept date parameters
    - Count only cancelled appointments for today
    - Filters by appointment_date between p_today and p_tomorrow
  
  2. Reasoning
    - Dashboard should show only today's cancelled appointments, not all-time
    - Matches pattern used by other dashboard stat functions
*/

CREATE OR REPLACE FUNCTION get_doctor_cancelled_count(
  p_global_id text,
  p_today text DEFAULT NULL,
  p_tomorrow text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cancelled_count integer;
BEGIN
  -- If dates not provided, count all cancelled appointments (backward compatibility)
  IF p_today IS NULL OR p_tomorrow IS NULL THEN
    SELECT COUNT(*)::integer INTO v_cancelled_count
    FROM appointments a
    WHERE a.doctor_id IN (
      SELECT uda.doctor_id
      FROM user_doctor_access uda
      JOIN users u ON u.id = uda.user_id
      WHERE u.global_id = p_global_id
    )
    AND LOWER(a.status) = 'cancelled';
  ELSE
    -- Count only today's cancelled appointments
    SELECT COUNT(*)::integer INTO v_cancelled_count
    FROM appointments a
    WHERE a.doctor_id IN (
      SELECT uda.doctor_id
      FROM user_doctor_access uda
      JOIN users u ON u.id = uda.user_id
      WHERE u.global_id = p_global_id
    )
    AND LOWER(a.status) = 'cancelled'
    AND a.appointment_date >= p_today::date
    AND a.appointment_date < p_tomorrow::date;
  END IF;

  RETURN COALESCE(v_cancelled_count, 0);
END;
$$;
