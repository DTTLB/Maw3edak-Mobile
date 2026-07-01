/*
  # Fix get_doctor_notifications_via_access function - objective_id type

  1. Issue
    - objective_id is UUID, not INTEGER
    - Function was created with wrong data type

  2. Fix
    - Drop and recreate function with correct UUID data type for objective_id
*/

DROP FUNCTION IF EXISTS get_doctor_notifications_via_access(TEXT, UUID);

CREATE OR REPLACE FUNCTION get_doctor_notifications_via_access(
  p_global_id TEXT,
  p_company_id UUID
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
    AND a.company_id = p_company_id
    AND a.category != 'authorization'
  ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;