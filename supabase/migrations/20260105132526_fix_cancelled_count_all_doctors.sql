/*
  # Fix Cancelled Count - Count Across All Doctor IDs

  1. Changes
    - Update get_doctor_cancelled_count to count across ALL doctor_ids for a global_id
    - Previously only counted for first doctor_id (LIMIT 1)
  
  2. Reasoning
    - A doctor's global_id can be associated with multiple doctor_ids
    - Need to sum cancelled appointments across all associated doctor_ids
    - Uses IN clause instead of single doctor_id match
*/

CREATE OR REPLACE FUNCTION get_doctor_cancelled_count(p_global_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cancelled_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO v_cancelled_count
  FROM appointments a
  WHERE a.doctor_id IN (
    SELECT uda.doctor_id
    FROM user_doctor_access uda
    JOIN users u ON u.id = uda.user_id
    WHERE u.global_id = p_global_id
  )
  AND LOWER(a.status) = 'cancelled';

  RETURN COALESCE(v_cancelled_count, 0);
END;
$$;
