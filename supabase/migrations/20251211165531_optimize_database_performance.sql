/*
  # Database Performance Optimizations
  
  ## Changes Made
  
  1. **Missing Indexes**
     - Add index on `patient_packages.package_id` (foreign key was missing index)
     - Add composite index on `patients(medical_id, company_id)` for faster cross-company lookups
  
  2. **Optimized Indexes for Common Query Patterns**
     - Add covering index on `patient_doctor_access` for the frequently-called doctor lookup function
     - Add index on `user_patient_sessions.expires_at` for session cleanup queries
     - Add partial index on `appointments` for active appointments
  
  3. **Database Maintenance**
     - Run ANALYZE to update table statistics for better query planning
  
  ## Performance Impact
  - Reduces query time for patient-doctor lookups (called 10,384 times)
  - Eliminates sequential scans on `patient_packages`
  - Speeds up cross-company patient lookups
  - Improves appointment scheduling queries
*/

-- Add missing index on patient_packages.package_id (foreign key)
CREATE INDEX IF NOT EXISTS idx_patient_packages_package_id 
ON patient_packages(package_id);

-- Add composite index for medical_id lookups across companies
-- This speeds up the common pattern of finding patients by medical_id
CREATE INDEX IF NOT EXISTS idx_patients_medical_id_company 
ON patients(medical_id, company_id) 
WHERE medical_id IS NOT NULL;

-- Add partial index for active appointments
CREATE INDEX IF NOT EXISTS idx_appointments_active_doctor 
ON appointments(appointment_date, doctor_id, appointment_time) 
WHERE status NOT IN ('cancelled', 'completed');

-- Add index on session expiration for cleanup queries
CREATE INDEX IF NOT EXISTS idx_user_patient_sessions_expires 
ON user_patient_sessions(expires_at);

-- Add covering index for patient_doctor_access queries
-- This supports the common query pattern: get doctors for multiple patients
CREATE INDEX IF NOT EXISTS idx_patient_doctor_access_covering 
ON patient_doctor_access(patient_id, doctor_id) 
INCLUDE (company_id, created_at);

-- Add index on invoice_headers for patient billing queries
CREATE INDEX IF NOT EXISTS idx_invoice_headers_patient_date 
ON invoice_headers(patient_id, invoice_date DESC) 
WHERE status NOT IN ('cancelled', 'void');

-- Add index on device_tokens for active devices by patient
CREATE INDEX IF NOT EXISTS idx_device_tokens_patient_active 
ON device_tokens(patient_id) 
WHERE is_active = true;

-- Add index for unread notification queries by medical_id
CREATE INDEX IF NOT EXISTS idx_patient_notifications_unread_medical 
ON patient_notifications(medical_id, created_at DESC) 
WHERE read = false;

-- Add composite index for patient packages by patient and company
CREATE INDEX IF NOT EXISTS idx_patient_packages_patient_company 
ON patient_packages(patient_id, company_id, buy_date DESC);

-- Add index for package services lookups
CREATE INDEX IF NOT EXISTS idx_package_services_package 
ON package_services(package_id, service_id);

-- Update statistics for query planner
ANALYZE user_patients;
ANALYZE patients;
ANALYZE patient_doctor_access;
ANALYZE appointments;
ANALYZE device_tokens;
ANALYZE patient_notifications;
ANALYZE patient_packages;
ANALYZE invoice_headers;
ANALYZE package_services;

-- Add comment to track optimization
COMMENT ON INDEX idx_patient_packages_package_id IS 'Performance: missing FK index on package_id';
COMMENT ON INDEX idx_patients_medical_id_company IS 'Performance: cross-company patient lookups by medical_id';
COMMENT ON INDEX idx_appointments_active_doctor IS 'Performance: active appointment queries';
COMMENT ON INDEX idx_patient_doctor_access_covering IS 'Performance: doctor access lookups with covering index';
