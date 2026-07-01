/*
  # Create function to fetch doctor notifications via user access

  1. Purpose
    - Fetch doctor notifications for non-authorization categories
    - Use proper joins through user_doctor_access table
    - Ensure users only see notifications for doctors they have access to

  2. Query Logic
    - Join doctor_notifications with doctors
    - Join with user_doctor_access to verify user has access to the doctor
    - Join with users to match by global_id
    - Filter by company_id for current company context
    - Exclude authorization category (handled separately)

  3. Returns
    - Same structure as doctor_notifications table
*/

CREATE OR REPLACE FUNCTION get_doctor_notifications_via_access(
  p_global_id TEXT,
  p_company_id INTEGER
)
RETURNS TABLE (
  id UUID,
  category TEXT,
  message_header TEXT,
  message_body TEXT,
  read BOOLEAN,
  created_at TIMESTAMPTZ,
  objective_id INTEGER,
  completed BOOLEAN,
  auth_status TEXT,
  company_id INTEGER
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