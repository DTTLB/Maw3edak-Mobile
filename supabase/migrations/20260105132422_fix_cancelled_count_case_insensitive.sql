/*
  # Fix Cancelled Count Function - Case Insensitive

  1. Changes
    - Update get_doctor_cancelled_count to use case-insensitive comparison
    - Now counts both 'cancelled' and 'Cancelled' statuses
  
  2. Reasoning
    - Database has inconsistent capitalization in appointment status values
    - Function now properly counts all cancelled appointments regardless of case
*/

CREATE OR REPLACE FUNCTION get_doctor_cancelled_count(p_global_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_doctor_id uuid;
  v_cancelled_count integer;
BEGIN
  SELECT uda.doctor_id INTO v_doctor_id
  FROM user_doctor_access uda
  JOIN users u ON u.id = uda.user_id
  WHERE u.global_id = p_global_id
  LIMIT 1;

  IF v_doctor_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*)::integer INTO v_cancelled_count
  FROM appointments
  WHERE doctor_id = v_doctor_id
  AND LOWER(status) = 'cancelled';

  RETURN COALESCE(v_cancelled_count, 0);
END;
$$;
