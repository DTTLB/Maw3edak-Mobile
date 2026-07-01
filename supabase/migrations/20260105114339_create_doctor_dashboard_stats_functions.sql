/*
  # Create Doctor Dashboard Stats Functions

  1. Functions
    - `get_doctor_today_schedule` - Get count of today's appointments for a doctor by global_id
    - `get_doctor_total_patients` - Get total unique patients for a doctor by global_id
    - `get_doctor_completed_today` - Get count of completed appointments today for a doctor
    - `get_doctor_pending_today` - Get count of pending appointments today for a doctor

  2. Notes
    - All functions use global_id to identify the doctor
    - Functions join appointments with doctors through user_doctor_access
    - Date filtering uses appointment_date field
*/

-- Function to get today's schedule count
CREATE OR REPLACE FUNCTION get_doctor_today_schedule(
  p_global_id TEXT,
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
  INNER JOIN doctors b ON a.doctor_id = b.id
  INNER JOIN user_doctor_access c ON c.doctor_id = b.id
  INNER JOIN users d ON d.id = c.user_id
  WHERE d.global_id = p_global_id
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Function to get total unique patients count
CREATE OR REPLACE FUNCTION get_doctor_total_patients(
  p_global_id TEXT
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
  WHERE d.global_id = p_global_id;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Function to get completed appointments today
CREATE OR REPLACE FUNCTION get_doctor_completed_today(
  p_global_id TEXT,
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
  INNER JOIN doctors b ON a.doctor_id = b.id
  INNER JOIN user_doctor_access c ON c.doctor_id = b.id
  INNER JOIN users d ON d.id = c.user_id
  WHERE d.global_id = p_global_id
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND a.status = 'completed';
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Function to get pending appointments today
CREATE OR REPLACE FUNCTION get_doctor_pending_today(
  p_global_id TEXT,
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
  INNER JOIN doctors b ON a.doctor_id = b.id
  INNER JOIN user_doctor_access c ON c.doctor_id = b.id
  INNER JOIN users d ON d.id = c.user_id
  WHERE d.global_id = p_global_id
    AND a.appointment_date >= p_today::DATE
    AND a.appointment_date < p_tomorrow::DATE
    AND a.status IN ('pending', 'scheduled', 'confirmed');
  
  RETURN COALESCE(v_count, 0);
END;
$$;