/*
  # Autovacuum and Cleanup Optimization
  
  ## Issue Identified
  Several tables have high dead row ratios (>50%):
  - user_patients: 89.47% dead rows
  - patient_notifications: 80.49% dead rows
  - doctor_orders: 78.05% dead rows
  - invoice_headers: 75.00% dead rows
  - appointments: 63.89% dead rows
  
  ## Changes Made
  1. Tune autovacuum settings for high-churn tables
  2. Clean up old expired sessions and OTP records
  3. Update table statistics
  
  ## Performance Impact
  - Reduces table bloat over time
  - Improves query performance
  - Better index performance
  - Automatic maintenance
*/

-- Update autovacuum settings for high-churn tables
-- More aggressive autovacuum for frequently updated tables
ALTER TABLE user_patient_sessions SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE patient_notifications SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE appointments SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE user_patients SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE doctor_orders SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE invoice_headers SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- Clean up old expired sessions (older than 30 days)
DELETE FROM user_patient_sessions
WHERE expires_at < (CURRENT_TIMESTAMP - interval '30 days');

-- Clean up old unverified OTP records (older than 7 days)
DELETE FROM otp_verification_patient
WHERE verified = false 
  AND expires_at < (CURRENT_TIMESTAMP - interval '7 days');

DELETE FROM mobile_otp_verification_patient
WHERE verified = false 
  AND expires_at < (CURRENT_TIMESTAMP - interval '7 days');

-- Update statistics on cleaned tables
ANALYZE user_patient_sessions;
ANALYZE otp_verification_patient;
ANALYZE mobile_otp_verification_patient;
ANALYZE user_patients;
ANALYZE patient_notifications;
ANALYZE appointments;
ANALYZE doctor_orders;
ANALYZE invoice_headers;

-- Add comments
COMMENT ON TABLE user_patient_sessions IS 'Performance: autovacuum tuned for high update frequency, old sessions cleaned regularly';
COMMENT ON TABLE patient_notifications IS 'Performance: autovacuum tuned for high update frequency';
COMMENT ON TABLE appointments IS 'Performance: autovacuum tuned for high update frequency';
COMMENT ON TABLE user_patients IS 'Performance: autovacuum tuned for high update frequency';
COMMENT ON TABLE doctor_orders IS 'Performance: autovacuum tuned for high update frequency';
COMMENT ON TABLE invoice_headers IS 'Performance: autovacuum tuned for high update frequency';
