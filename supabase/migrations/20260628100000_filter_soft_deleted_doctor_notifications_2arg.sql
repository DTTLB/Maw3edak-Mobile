/*
  # Exclude soft-deleted doctors/users from get_doctor_notifications_via_access (2-arg)

  The mobile app calls get_doctor_notifications_via_access(p_global_id, p_company_id)
  (the 2-argument overload). A previous migration only added the is_deleted filter
  to the 1-argument overload, so the overload actually used by the app still
  returned notifications for soft-deleted doctor accounts.

  This recreates the 2-arg overload with is_deleted = FALSE filters on the joined
  doctors and users rows. Definition otherwise matches the live function.
*/

CREATE OR REPLACE FUNCTION public.get_doctor_notifications_via_access(
  p_global_id text,
  p_company_id uuid
)
RETURNS TABLE(
  id uuid,
  category text,
  message_header text,
  message_body text,
  read boolean,
  created_at timestamp with time zone,
  objective_id uuid,
  completed boolean,
  auth_status text,
  company_id uuid,
  company_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
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
  FROM public.doctor_notifications a
  INNER JOIN public.doctors b ON b.id = a.doctor_id
  INNER JOIN public.user_doctor_access d ON d.doctor_id = b.id
  INNER JOIN public.users c ON c.id = d.user_id
  LEFT JOIN public.companies e ON e.id = a.company_id
  WHERE c.global_id = p_global_id
    AND b.is_deleted = FALSE
    AND c.is_deleted = FALSE
    AND a.category != 'authorization'
    AND a.company_id = p_company_id
  ORDER BY a.created_at DESC;
END;
$function$;
