/*
  # Update get_doctor_patients function
  
  1. Changes
    - Modified function to return all patients based on patient_doctor_access
    - No longer requires appointments to exist
    - Returns patients linked to doctor through patient_doctor_access table
  
  2. Function Details
    - Joins patients with patient_doctor_access, user_doctor_access, and users
    - Filters by global_id instead of requiring appointments
    - Returns patient details grouped by medical_id
*/

-- Drop the old function
DROP FUNCTION IF EXISTS get_doctor_patients(text);

-- Create the new function
CREATE OR REPLACE FUNCTION get_doctor_patients(p_global_id text)
RETURNS TABLE(
  patient_id uuid,
  medical_id text,
  full_name text,
  email text,
  phone text,
  company_id uuid,
  company_name text,
  appointment_count bigint,
  last_appointment_date date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    a.id as patient_id,
    a.medical_id,
    a.full_name,
    a.email,
    a.phone,
    a.company_id,
    c.name as company_name,
    COUNT(apt.id) as appointment_count,
    MAX(apt.appointment_date) as last_appointment_date
  FROM patients a
  INNER JOIN patient_doctor_access b ON b.patient_id = a.id
  INNER JOIN user_doctor_access uda ON uda.doctor_id = b.doctor_id
  INNER JOIN users d ON d.id = uda.user_id
  LEFT JOIN companies c ON c.id = a.company_id
  LEFT JOIN appointments apt ON apt.patient_id = a.id AND apt.doctor_id = b.doctor_id
  WHERE d.global_id = p_global_id
  GROUP BY a.id, a.medical_id, a.full_name, a.email, a.phone, a.company_id, c.name
  ORDER BY a.full_name ASC;
END;
$$;