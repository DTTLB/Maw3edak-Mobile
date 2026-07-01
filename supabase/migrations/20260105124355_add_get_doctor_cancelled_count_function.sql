/*
  # Add function to count cancelled appointments for doctor

  1. New Functions
    - `get_doctor_cancelled_count` - Counts all appointments with status 'cancelled' for a doctor
      - Takes global_id as parameter
      - Returns count of cancelled appointments
      
  2. Security
    - Function uses SECURITY DEFINER to access data with elevated privileges
    - Returns only aggregated count, not sensitive data
*/

CREATE OR REPLACE FUNCTION get_doctor_cancelled_count(p_global_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doctor_id uuid;
  v_cancelled_count integer;
BEGIN
  -- Get the doctor_id from user_doctor_access using global_id
  SELECT uda.doctor_id INTO v_doctor_id
  FROM user_doctor_access uda
  JOIN users u ON u.id = uda.user_id
  WHERE u.global_id = p_global_id
  LIMIT 1;

  -- If doctor not found, return 0
  IF v_doctor_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Count appointments with status 'cancelled'
  SELECT COUNT(*)::integer INTO v_cancelled_count
  FROM appointments
  WHERE doctor_id = v_doctor_id
    AND status = 'cancelled';

  RETURN COALESCE(v_cancelled_count, 0);
END;
$$;