/*
  # Create function to get doctor's patients with company info

  1. New Functions
    - `get_doctor_patients` - Gets all unique patients for a doctor
      - Takes global_id as parameter
      - Returns patients with company info and appointment count
      - Groups by patient to avoid duplicates
      
  2. Returns
    - patient_id: UUID of the patient
    - medical_id: Patient's medical ID
    - full_name: Patient's full name
    - email: Patient's email
    - phone: Patient's phone
    - company_id: Company UUID
    - company_name: Company name
    - appointment_count: Total appointments with this doctor
    - last_appointment_date: Most recent appointment date
    
  3. Security
    - Function uses SECURITY DEFINER to access data with elevated privileges
    - Returns only patients associated with the doctor
*/

CREATE OR REPLACE FUNCTION get_doctor_patients(p_global_id text)
RETURNS TABLE (
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
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id as patient_id,
    p.medical_id,
    p.full_name,
    p.email,
    p.phone,
    p.company_id,
    c.name as company_name,
    COUNT(a.id) as appointment_count,
    MAX(a.appointment_date) as last_appointment_date
  FROM patients p
  INNER JOIN appointments a ON a.patient_id = p.id
  INNER JOIN user_doctor_access uda ON uda.doctor_id = a.doctor_id
  INNER JOIN users u ON u.id = uda.user_id
  LEFT JOIN companies c ON c.id = p.company_id
  WHERE u.global_id = p_global_id
  GROUP BY p.id, p.medical_id, p.full_name, p.email, p.phone, p.company_id, c.name
  ORDER BY MAX(a.appointment_date) DESC;
END;
$$;
