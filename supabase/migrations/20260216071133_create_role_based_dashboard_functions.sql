/*
  # Create Role-Based Dashboard Functions

  1. New Functions
    - Admin functions: Direct company_id access (no user_doctor_access required)
      - get_admin_today_schedule
      - get_admin_completed_today
      - get_admin_pending_today
      - get_admin_cancelled_count
    
    - Doctor/Receptionist functions: Use user_doctor_access table
      - get_staff_today_schedule
      - get_staff_completed_today
      - get_staff_pending_today
      - get_staff_cancelled_count

  2. Purpose
    - Admin: Full access to all doctors in their company
    - Doctor/Receptionist: Access only to assigned doctors via user_doctor_access
*/

-- ============================================
-- ADMIN FUNCTIONS (Direct company_id access)
-- ============================================

-- Admin: Get today's schedule count
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
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Admin: Get completed appointments today
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
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND a.status = 'completed';
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Admin: Get pending appointments today
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
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND a.status IN ('pending', 'scheduled', 'confirmed');
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Admin: Get cancelled appointments today
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
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND LOWER(a.status) = 'cancelled';
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- ============================================
-- STAFF FUNCTIONS (Via user_doctor_access)
-- ============================================

-- Staff: Get today's schedule count
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
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Staff: Get completed appointments today
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
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND a.status = 'completed';
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Staff: Get pending appointments today
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
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND a.status IN ('pending', 'scheduled', 'confirmed');
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Staff: Get cancelled appointments today
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
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND LOWER(a.status) = 'cancelled';
  
  RETURN COALESCE(v_count, 0);
END;
$$;
