/*
  # Add company filter to doctor notifications function

  1. Changes
    - Update get_doctor_notifications_via_access to accept company_id parameter
    - Filter notifications by the current company_id
    - Only return notifications for the selected company
*/

DROP FUNCTION IF EXISTS get_doctor_notifications_via_access(TEXT);

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
  company_id UUID,
  company_name TEXT
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
    a.company_id,
    e.name as company_name
  FROM doctor_notifications a
  INNER JOIN doctors b ON b.id = a.doctor_id
  INNER JOIN user_doctor_access d ON d.doctor_id = b.id
  INNER JOIN users c ON c.id = d.user_id
  LEFT JOIN companies e ON e.id = a.company_id
  WHERE c.global_id = p_global_id
    AND a.category != 'authorization'
    AND a.company_id = p_company_id
  ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;