/*
  # Soft-delete (is_deleted) filters for dashboard count + notification RPCs

  The `is_deleted` column and the `get_doctor_patients` filter are handled by the
  earlier migrations:
    - 20260628000000_add_is_deleted_soft_delete.sql            (columns + indexes)
    - 20260628000001_filter_soft_deleted_in_get_doctor_patients.sql

  This migration covers the remaining SECURITY DEFINER RPCs that join the
  doctors / users identity tables, so soft-deleted doctors / users are excluded
  from every dashboard count and the doctor notifications list:
    - get_admin_today_schedule / _completed_today / _pending_today / _cancelled_count
    - get_staff_today_schedule / _completed_today / _pending_today / _cancelled_count
    - get_doctor_today_schedule / _completed_today / _pending_today / _cancelled_count
    - get_doctor_notifications_via_access

  All functions are recreated with the SAME signatures as their latest
  definitions, adding only `is_deleted = FALSE` on the doctors / users joins.
*/

-- ============================================================================
-- 1. ADMIN dashboard counts (direct company_id access; join doctors only)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_admin_today_schedule(
  p_user_id UUID,
  p_company_id UUID,
  p_today TEXT,
  p_tomorrow TEXT
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
  INNER JOIN doctors d ON a.doctor_id = d.id
  WHERE d.company_id = p_company_id
    AND d.is_deleted = FALSE
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE;

  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION get_admin_completed_today(
  p_user_id UUID,
  p_company_id UUID,
  p_today TEXT,
  p_tomorrow TEXT
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
  INNER JOIN doctors d ON a.doctor_id = d.id
  WHERE d.company_id = p_company_id
    AND d.is_deleted = FALSE
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND a.status = 'completed';

  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION get_admin_pending_today(
  p_user_id UUID,
  p_company_id UUID,
  p_today TEXT,
  p_tomorrow TEXT
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
  INNER JOIN doctors d ON a.doctor_id = d.id
  WHERE d.company_id = p_company_id
    AND d.is_deleted = FALSE
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND a.status IN ('pending', 'scheduled', 'confirmed');

  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION get_admin_cancelled_count(
  p_user_id UUID,
  p_company_id UUID,
  p_today TEXT,
  p_tomorrow TEXT
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
  INNER JOIN doctors d ON a.doctor_id = d.id
  WHERE d.company_id = p_company_id
    AND d.is_deleted = FALSE
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND LOWER(a.status) = 'cancelled';

  RETURN COALESCE(v_count, 0);
END;
$$;

-- ============================================================================
-- 2. STAFF dashboard counts (via user_doctor_access; join doctors only)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_staff_today_schedule(
  p_user_id UUID,
  p_company_id UUID,
  p_today TEXT,
  p_tomorrow TEXT
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
  INNER JOIN doctors d ON a.doctor_id = d.id
  INNER JOIN user_doctor_access uda ON uda.doctor_id = d.id
  WHERE uda.user_id = p_user_id
    AND uda.company_id = p_company_id
    AND d.is_deleted = FALSE
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE;

  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION get_staff_completed_today(
  p_user_id UUID,
  p_company_id UUID,
  p_today TEXT,
  p_tomorrow TEXT
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
  INNER JOIN doctors d ON a.doctor_id = d.id
  INNER JOIN user_doctor_access uda ON uda.doctor_id = d.id
  WHERE uda.user_id = p_user_id
    AND uda.company_id = p_company_id
    AND d.is_deleted = FALSE
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND a.status = 'completed';

  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION get_staff_pending_today(
  p_user_id UUID,
  p_company_id UUID,
  p_today TEXT,
  p_tomorrow TEXT
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
  INNER JOIN doctors d ON a.doctor_id = d.id
  INNER JOIN user_doctor_access uda ON uda.doctor_id = d.id
  WHERE uda.user_id = p_user_id
    AND uda.company_id = p_company_id
    AND d.is_deleted = FALSE
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND a.status IN ('pending', 'scheduled', 'confirmed');

  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION get_staff_cancelled_count(
  p_user_id UUID,
  p_company_id UUID,
  p_today TEXT,
  p_tomorrow TEXT
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
  INNER JOIN doctors d ON a.doctor_id = d.id
  INNER JOIN user_doctor_access uda ON uda.doctor_id = d.id
  WHERE uda.user_id = p_user_id
    AND uda.company_id = p_company_id
    AND d.is_deleted = FALSE
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND LOWER(a.status) = 'cancelled';

  RETURN COALESCE(v_count, 0);
END;
$$;

-- ============================================================================
-- 3. DOCTOR dashboard counts (global_id OR user_id; join doctors + users)
-- ============================================================================
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
    AND b.is_deleted = FALSE
    AND d.is_deleted = FALSE
    AND (p_company_id IS NULL OR d.company_id = p_company_id)
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE;

  RETURN COALESCE(v_count, 0);
END;
$$;

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
    AND b.is_deleted = FALSE
    AND d.is_deleted = FALSE
    AND (p_company_id IS NULL OR d.company_id = p_company_id)
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND a.status = 'completed';

  RETURN COALESCE(v_count, 0);
END;
$$;

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
    AND b.is_deleted = FALSE
    AND d.is_deleted = FALSE
    AND (p_company_id IS NULL OR d.company_id = p_company_id)
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND a.status IN ('pending', 'scheduled', 'confirmed');

  RETURN COALESCE(v_count, 0);
END;
$$;

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
    AND b.is_deleted = FALSE
    AND d.is_deleted = FALSE
    AND (p_company_id IS NULL OR d.company_id = p_company_id)
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND LOWER(a.status) = 'cancelled';

  RETURN COALESCE(v_count, 0);
END;
$$;

-- ============================================================================
-- 4. Doctor notifications via access (join doctors + users)
-- ============================================================================
DROP FUNCTION IF EXISTS get_doctor_notifications_via_access(TEXT);

CREATE OR REPLACE FUNCTION get_doctor_notifications_via_access(
  p_global_id TEXT
)
RETURNS TABLE (
  id UUID,
  category TEXT,
  message_header TEXT,
  message_body TEXT,
  read BOOLEAN,
  created_at TIMESTAMPTZ,
  objective_id UUID,
  completed BOOLEAN,
  auth_status TEXT,
  company_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.category,
    a.message_header,
    a.message_body,
    a.read,
    a.created_at,
    a.objective_id,
    a.completed,
    a.auth_status,
    a.company_id
  FROM doctor_notifications a
  INNER JOIN doctors b ON b.id = a.doctor_id
  INNER JOIN user_doctor_access d ON d.doctor_id = b.id
  INNER JOIN users c ON c.id = d.user_id
  WHERE c.global_id = p_global_id
    AND b.is_deleted = FALSE
    AND c.is_deleted = FALSE
    AND a.category != 'authorization'
  ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
