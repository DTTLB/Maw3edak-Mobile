/*
  # Drop old overloaded doctor dashboard stat functions

  ## Problem
  There are 3 overloaded versions of each function:
  1. Old: (p_doctor_id uuid) - original, no longer used
  2. Old: (p_global_id text, p_today text, p_tomorrow text, p_company_id uuid) - intermediate, no longer used
  3. Current: (p_global_id text, p_user_id uuid, p_today text, p_tomorrow text, p_company_id uuid) - the one in use

  The old versions cause ambiguity errors when the edge function calls with named params
  including p_user_id, causing PostgreSQL to fail resolving the correct overload.

  ## Fix
  Drop the two old overloads for all 4 functions, keeping only the latest 5-param version.
*/

DROP FUNCTION IF EXISTS get_doctor_today_schedule(p_doctor_id uuid);
DROP FUNCTION IF EXISTS get_doctor_today_schedule(p_global_id text, p_today text, p_tomorrow text, p_company_id uuid);

DROP FUNCTION IF EXISTS get_doctor_cancelled_count(p_doctor_id uuid);
DROP FUNCTION IF EXISTS get_doctor_cancelled_count(p_global_id text, p_today text, p_tomorrow text, p_company_id uuid);

DROP FUNCTION IF EXISTS get_doctor_completed_today(p_doctor_id uuid);
DROP FUNCTION IF EXISTS get_doctor_completed_today(p_global_id text, p_today text, p_tomorrow text, p_company_id uuid);

DROP FUNCTION IF EXISTS get_doctor_pending_today(p_doctor_id uuid);
DROP FUNCTION IF EXISTS get_doctor_pending_today(p_global_id text, p_today text, p_tomorrow text, p_company_id uuid);
