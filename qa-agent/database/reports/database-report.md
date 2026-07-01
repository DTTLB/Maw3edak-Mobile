# 🗄️ Database QA Report — Maw3edak Mobile

**Generated:** 06/13/2026, 07:30:01 PM  
**Database:** Supabase (PostgreSQL)  
**Scanned:** supabase/migrations  
**Tables Detected:** 12  
**Tables with RLS Enabled:** 13 / 12  

---

## Summary

| Severity | Count |
|---|---|
| 🔴 Critical | **0** |
| 🟠 High | **0** |
| 🟡 Medium | **124** |
| 🔵 Low | **5** |
| 📄 Files Affected | **68** |

### Table Inventory

| Table | RLS | Policies |
|---|---|---|
| `user_patient_sessions` | ✅ Enabled | ⚠️ no policies |
| `otp_verifications` | ✅ Enabled | ⚠️ no policies |
| `device_tokens` | ✅ Enabled | ⚠️ no policies |
| `doctor_schedules` | ✅ Enabled | ⚠️ no policies |
| `schedule_exceptions` | ✅ Enabled | ⚠️ no policies |
| `schedule_blocks` | ✅ Enabled | ⚠️ no policies |
| `patient_questions` | ✅ Enabled | ⚠️ no policies |
| `notifications` | ✅ Enabled | ⚠️ no policies |
| `patient_notifications` | ✅ Enabled | ⚠️ no policies |
| `notification_reads` | ✅ Enabled | ⚠️ no policies |
| `doctor_notifications` | ✅ Enabled | ⚠️ no policies |
| `patient_payment_methods` | ✅ Enabled | ⚠️ no policies |

---

## 🔴 Critical Issues

_No issues found._

---

## 🟠 High Issues

_No issues found._

---

## 🟡 Medium Issues

### M-001: Table `user_patient_sessions` has RLS enabled but no policies defined
- **File:** `supabase/migrations/20251125101643_create_user_patient_sessions_table.sql` (line 26)
- **Detail:** RLS is on but no CREATE POLICY found for "user_patient_sessions" — all access is denied by default
- **Fix:** Create at least one policy: `CREATE POLICY "users_own_rows" ON public.user_patient_sessions FOR SELECT USING (auth.uid() = user_id);`

### M-002: Table `otp_verifications` has RLS enabled but no policies defined
- **File:** `supabase/migrations/20251126061326_create_otp_storage.sql` (line 12)
- **Detail:** RLS is on but no CREATE POLICY found for "otp_verifications" — all access is denied by default
- **Fix:** Create at least one policy: `CREATE POLICY "users_own_rows" ON public.otp_verifications FOR SELECT USING (auth.uid() = user_id);`

### M-003: Table `doctor_schedules` has RLS enabled but no policies defined
- **File:** `supabase/migrations/20251130180204_create_scheduling_tables.sql` (line 28)
- **Detail:** RLS is on but no CREATE POLICY found for "doctor_schedules" — all access is denied by default
- **Fix:** Create at least one policy: `CREATE POLICY "users_own_rows" ON public.doctor_schedules FOR SELECT USING (auth.uid() = user_id);`

### M-004: Table `schedule_exceptions` has RLS enabled but no policies defined
- **File:** `supabase/migrations/20251130180204_create_scheduling_tables.sql` (line 42)
- **Detail:** RLS is on but no CREATE POLICY found for "schedule_exceptions" — all access is denied by default
- **Fix:** Create at least one policy: `CREATE POLICY "users_own_rows" ON public.schedule_exceptions FOR SELECT USING (auth.uid() = user_id);`

### M-005: Table `schedule_blocks` has RLS enabled but no policies defined
- **File:** `supabase/migrations/20251130180204_create_scheduling_tables.sql` (line 57)
- **Detail:** RLS is on but no CREATE POLICY found for "schedule_blocks" — all access is denied by default
- **Fix:** Create at least one policy: `CREATE POLICY "users_own_rows" ON public.schedule_blocks FOR SELECT USING (auth.uid() = user_id);`

### M-006: Table `patient_questions` has RLS enabled but no policies defined
- **File:** `supabase/migrations/20251205101301_create_patient_questions_table.sql` (line 22)
- **Detail:** RLS is on but no CREATE POLICY found for "patient_questions" — all access is denied by default
- **Fix:** Create at least one policy: `CREATE POLICY "users_own_rows" ON public.patient_questions FOR SELECT USING (auth.uid() = user_id);`

### M-007: Table `device_tokens` has RLS enabled but no policies defined
- **File:** `supabase/migrations/20251206130808_recreate_device_tokens_table.sql` (line 34)
- **Detail:** RLS is on but no CREATE POLICY found for "device_tokens" — all access is denied by default
- **Fix:** Create at least one policy: `CREATE POLICY "users_own_rows" ON public.device_tokens FOR SELECT USING (auth.uid() = user_id);`

### M-008: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251206165640_fix_device_tokens_foreign_key.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-009: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251206170108_add_order_notification_trigger.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-010: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251206170135_enable_pg_net_and_fix_notification_trigger.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-011: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251206170200_fix_notification_trigger_with_url.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-012: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251206170815_update_notification_trigger_with_medical_id.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-013: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251206170925_fix_notification_trigger_with_hardcoded_url.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-014: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251206171009_fix_notification_trigger_field_name.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-015: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251209103404_update_order_notification_with_names.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-016: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20251209103404_update_order_notification_with_names.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-017: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251209103445_fix_order_notification_doctor_name.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-018: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20251209103445_fix_order_notification_doctor_name.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-019: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251209111707_create_all_notification_triggers.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-020: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20251209111707_create_all_notification_triggers.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-021: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251209112821_add_unique_constraint_to_device_tokens.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-022: Status/type column has no CHECK constraint
- **File:** `supabase/migrations/20251209134000_create_notifications_table.sql` (line 26)
- **Detail:** type text DEFAULT 'general',
- **Fix:** Add CHECK: `status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled'))` or use a custom ENUM type.

### M-023: Table `notifications` has RLS enabled but no policies defined
- **File:** `supabase/migrations/20251209134000_create_notifications_table.sql` (line 21)
- **Detail:** RLS is on but no CREATE POLICY found for "notifications" — all access is denied by default
- **Fix:** Create at least one policy: `CREATE POLICY "users_own_rows" ON public.notifications FOR SELECT USING (auth.uid() = user_id);`

### M-024: Table `patient_notifications` has RLS enabled but no policies defined
- **File:** `supabase/migrations/20251210113948_create_patient_notifications_table.sql` (line 25)
- **Detail:** RLS is on but no CREATE POLICY found for "patient_notifications" — all access is denied by default
- **Fix:** Create at least one policy: `CREATE POLICY "users_own_rows" ON public.patient_notifications FOR SELECT USING (auth.uid() = user_id);`

### M-025: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251210132448_fix_patient_notifications_step_by_step.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-026: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251211164354_add_upsert_device_token_function.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-027: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251211164654_fix_upsert_device_token_search_path.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-028: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251211164922_fix_all_function_search_paths.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-029: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20251211164922_fix_all_function_search_paths.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-030: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251211165037_optimize_patient_notifications_rls_policies.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-031: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20251211165531_optimize_database_performance.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-032: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251211175411_create_appointment_notification_trigger.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-033: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20251211175411_create_appointment_notification_trigger.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-034: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251211175719_update_appointment_trigger_with_navigation_data.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-035: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20251211175719_update_appointment_trigger_with_navigation_data.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-036: Possible missing index on column `appointment_id`
- **File:** `supabase/migrations/20251211175719_update_appointment_trigger_with_navigation_data.sql` (line 1)
- **Detail:** Column "appointment_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_appointment_id ON public.tablename (appointment_id);`

### M-037: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251212074404_fix_appointment_notifications_for_background.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-038: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20251212074404_fix_appointment_notifications_for_background.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-039: Possible missing index on column `appointment_id`
- **File:** `supabase/migrations/20251212074404_fix_appointment_notifications_for_background.sql` (line 1)
- **Detail:** Column "appointment_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_appointment_id ON public.tablename (appointment_id);`

### M-040: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251212074908_fix_appointment_notification_url.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-041: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20251212074908_fix_appointment_notification_url.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-042: Possible missing index on column `appointment_id`
- **File:** `supabase/migrations/20251212074908_fix_appointment_notification_url.sql` (line 1)
- **Detail:** Column "appointment_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_appointment_id ON public.tablename (appointment_id);`

### M-043: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251212092420_add_fcm_to_questionnaire_assignment.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-044: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20251212092420_add_fcm_to_questionnaire_assignment.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-045: Table `notification_reads` has RLS enabled but no policies defined
- **File:** `supabase/migrations/20251215180410_create_notification_reads_table.sql` (line 25)
- **Detail:** RLS is on but no CREATE POLICY found for "notification_reads" — all access is denied by default
- **Fix:** Create at least one policy: `CREATE POLICY "users_own_rows" ON public.notification_reads FOR SELECT USING (auth.uid() = user_id);`

### M-046: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251216104716_fix_upsert_device_token_ambiguous_column.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-047: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251216104741_fix_upsert_device_token_final.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-048: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251216110301_fix_upsert_device_token_conflict_clause.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-049: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20251217071437_fix_fcm_notification_delivery.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-050: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20251217071437_fix_fcm_notification_delivery.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-051: Possible missing index on column `appointment_id`
- **File:** `supabase/migrations/20251217071437_fix_fcm_notification_delivery.sql` (line 1)
- **Detail:** Column "appointment_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_appointment_id ON public.tablename (appointment_id);`

### M-052: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20251217131559_create_automatic_fcm_trigger_for_all_notifications.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-053: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20260105114339_create_doctor_dashboard_stats_functions.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-054: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260105114339_create_doctor_dashboard_stats_functions.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-055: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260105114339_create_doctor_dashboard_stats_functions.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-056: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260105124103_add_get_doctor_scheduled_count_function.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-057: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260105124103_add_get_doctor_scheduled_count_function.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-058: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260105124355_add_get_doctor_cancelled_count_function.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-059: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260105124355_add_get_doctor_cancelled_count_function.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-060: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260105132422_fix_cancelled_count_case_insensitive.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-061: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260105132422_fix_cancelled_count_case_insensitive.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-062: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260105132526_fix_cancelled_count_all_doctors.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-063: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260105132526_fix_cancelled_count_all_doctors.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-064: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260105132749_update_cancelled_count_for_today_only.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-065: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260105132749_update_cancelled_count_for_today_only.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-066: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20260105133145_create_get_doctor_patients_function.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-067: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260105133145_create_get_doctor_patients_function.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-068: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260105133145_create_get_doctor_patients_function.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-069: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20260112084526_make_patient_id_nullable_in_device_tokens.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-070: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260112084526_make_patient_id_nullable_in_device_tokens.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-071: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20260112093047_update_get_doctor_patients_function.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-072: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260112093047_update_get_doctor_patients_function.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-073: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260112093047_update_get_doctor_patients_function.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-074: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20260112114820_create_doctor_notifications_fcm_trigger.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-075: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260112114820_create_doctor_notifications_fcm_trigger.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-076: Status/type column has no CHECK constraint
- **File:** `supabase/migrations/20260113110200_create_doctor_notifications_table_structure.sql` (line 34)
- **Detail:** status text NOT NULL DEFAULT 'pending',
- **Fix:** Add CHECK: `status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled'))` or use a custom ENUM type.

### M-077: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20260113110200_create_doctor_notifications_table_structure.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-078: Table `doctor_notifications` has RLS enabled but no policies defined
- **File:** `supabase/migrations/20260113110200_create_doctor_notifications_table_structure.sql` (line 25)
- **Detail:** RLS is on but no CREATE POLICY found for "doctor_notifications" — all access is denied by default
- **Fix:** Create at least one policy: `CREATE POLICY "users_own_rows" ON public.doctor_notifications FOR SELECT USING (auth.uid() = user_id);`

### M-079: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20260113112929_fix_doctor_notifications_fcm_trigger.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-080: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260113112929_fix_doctor_notifications_fcm_trigger.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-081: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20260119071500_add_user_id_to_device_tokens.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-082: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20260203071418_recreate_doctor_notifications_fcm_trigger.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-083: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260203071418_recreate_doctor_notifications_fcm_trigger.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-084: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260203115438_add_unique_constraint_doctor_device_tokens.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-085: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260203125509_fix_doctor_notifications_fcm_trigger_final.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-086: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20260203130715_add_usertype_to_patient_notifications.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-087: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260203130715_add_usertype_to_patient_notifications.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-088: Possible missing index on column `appointment_id`
- **File:** `supabase/migrations/20260203130715_add_usertype_to_patient_notifications.sql` (line 1)
- **Detail:** Column "appointment_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_appointment_id ON public.tablename (appointment_id);`

### M-089: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20260205063037_add_company_id_filter_to_doctor_dashboard_functions.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-090: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260205063037_add_company_id_filter_to_doctor_dashboard_functions.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-091: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260205063037_add_company_id_filter_to_doctor_dashboard_functions.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-092: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20260205063256_add_company_id_filter_to_get_doctor_patients.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-093: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260205063256_add_company_id_filter_to_get_doctor_patients.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-094: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260205063256_add_company_id_filter_to_get_doctor_patients.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-095: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20260205064350_fix_company_id_type_to_uuid_in_doctor_functions.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-096: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260205064350_fix_company_id_type_to_uuid_in_doctor_functions.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-097: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260205064350_fix_company_id_type_to_uuid_in_doctor_functions.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-098: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20260205064810_recreate_get_doctor_patients_with_full_details.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-099: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260205064810_recreate_get_doctor_patients_with_full_details.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-100: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260205064810_recreate_get_doctor_patients_with_full_details.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-101: Possible missing index on column `patient_id`
- **File:** `supabase/migrations/20260205064845_fix_get_doctor_patients_phone_column.sql` (line 1)
- **Detail:** Column "patient_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_patient_id ON public.tablename (patient_id);`

### M-102: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260205064845_fix_get_doctor_patients_phone_column.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-103: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260205064845_fix_get_doctor_patients_phone_column.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-104: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260205125436_fix_doctor_dashboard_pending_status_check.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-105: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260205125436_fix_doctor_dashboard_pending_status_check.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-106: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260205125503_clean_and_fix_all_doctor_dashboard_functions.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-107: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260205125503_clean_and_fix_all_doctor_dashboard_functions.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-108: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260206103742_create_get_doctor_notifications_via_access_function.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-109: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260206103742_create_get_doctor_notifications_via_access_function.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-110: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260206104103_fix_get_doctor_notifications_via_access_uuid.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-111: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260206104103_fix_get_doctor_notifications_via_access_uuid.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-112: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260206104129_fix_get_doctor_notifications_objective_id_uuid.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-113: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260206104129_fix_get_doctor_notifications_objective_id_uuid.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-114: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260206104648_fix_get_doctor_notifications_remove_company_filter.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-115: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260206104648_fix_get_doctor_notifications_remove_company_filter.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-116: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260206104850_add_company_details_to_doctor_notifications_function.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-117: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260206104850_add_company_details_to_doctor_notifications_function.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-118: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260206105314_add_company_filter_to_doctor_notifications_function.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-119: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260206105314_add_company_filter_to_doctor_notifications_function.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-120: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260216070409_add_user_id_support_to_doctor_dashboard_functions.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-121: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260216070409_add_user_id_support_to_doctor_dashboard_functions.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-122: Possible missing index on column `doctor_id`
- **File:** `supabase/migrations/20260216071133_create_role_based_dashboard_functions.sql` (line 1)
- **Detail:** Column "doctor_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_doctor_id ON public.tablename (doctor_id);`

### M-123: Possible missing index on column `user_id`
- **File:** `supabase/migrations/20260216071133_create_role_based_dashboard_functions.sql` (line 1)
- **Detail:** Column "user_id" referenced in migration but no index for it found in this file
- **Fix:** Add: `CREATE INDEX IF NOT EXISTS idx_tablename_user_id ON public.tablename (user_id);`

### M-124: Table `patient_payment_methods` has RLS enabled but no policies defined
- **File:** `supabase/migrations/20260218123755_create_patient_payment_methods_table.sql` (line 24)
- **Detail:** RLS is on but no CREATE POLICY found for "patient_payment_methods" — all access is denied by default
- **Fix:** Create at least one policy: `CREATE POLICY "users_own_rows" ON public.patient_payment_methods FOR SELECT USING (auth.uid() = user_id);`

---

## 🔵 Low Issues

### L-001: Table missing updated_at timestamp
- **File:** `supabase/migrations/20251126061326_create_otp_storage.sql` (line 1)
- **Detail:** No updated_at column found
- **Fix:** Add `updated_at TIMESTAMPTZ DEFAULT NOW()` and a trigger: `CREATE TRIGGER set_updated_at BEFORE UPDATE ON table EXECUTE FUNCTION moddatetime(updated_at);`.

### L-002: Table missing updated_at timestamp
- **File:** `supabase/migrations/20251205101301_create_patient_questions_table.sql` (line 1)
- **Detail:** No updated_at column found
- **Fix:** Add `updated_at TIMESTAMPTZ DEFAULT NOW()` and a trigger: `CREATE TRIGGER set_updated_at BEFORE UPDATE ON table EXECUTE FUNCTION moddatetime(updated_at);`.

### L-003: Table missing updated_at timestamp
- **File:** `supabase/migrations/20251209134000_create_notifications_table.sql` (line 1)
- **Detail:** No updated_at column found
- **Fix:** Add `updated_at TIMESTAMPTZ DEFAULT NOW()` and a trigger: `CREATE TRIGGER set_updated_at BEFORE UPDATE ON table EXECUTE FUNCTION moddatetime(updated_at);`.

### L-004: Table missing updated_at timestamp
- **File:** `supabase/migrations/20251215180410_create_notification_reads_table.sql` (line 1)
- **Detail:** No updated_at column found
- **Fix:** Add `updated_at TIMESTAMPTZ DEFAULT NOW()` and a trigger: `CREATE TRIGGER set_updated_at BEFORE UPDATE ON table EXECUTE FUNCTION moddatetime(updated_at);`.

### L-005: Table missing updated_at timestamp
- **File:** `supabase/migrations/20260218123755_create_patient_payment_methods_table.sql` (line 1)
- **Detail:** No updated_at column found
- **Fix:** Add `updated_at TIMESTAMPTZ DEFAULT NOW()` and a trigger: `CREATE TRIGGER set_updated_at BEFORE UPDATE ON table EXECUTE FUNCTION moddatetime(updated_at);`.

---

## Suggested Fixes

1. **Enable RLS on all tables** — Every public table needs `ALTER TABLE public.<name> ENABLE ROW LEVEL SECURITY;`.
2. **Define RLS policies** — At minimum: SELECT policy for owners, INSERT policy with auth.uid() check.
3. **Index foreign key columns** — Add `CREATE INDEX IF NOT EXISTS` for every `*_id` column used in queries.
4. **CHECK constraints** — Replace unconstrained TEXT status columns with `CHECK (status IN (...))`.
5. **Timestamps** — Add `created_at` and `updated_at` to every table for audit and sorting.

---

## 📄 Affected Files (68)

- `supabase/migrations/20251125101643_create_user_patient_sessions_table.sql`
- `supabase/migrations/20251126061326_create_otp_storage.sql`
- `supabase/migrations/20251130180204_create_scheduling_tables.sql`
- `supabase/migrations/20251205101301_create_patient_questions_table.sql`
- `supabase/migrations/20251206130808_recreate_device_tokens_table.sql`
- `supabase/migrations/20251206165640_fix_device_tokens_foreign_key.sql`
- `supabase/migrations/20251206170108_add_order_notification_trigger.sql`
- `supabase/migrations/20251206170135_enable_pg_net_and_fix_notification_trigger.sql`
- `supabase/migrations/20251206170200_fix_notification_trigger_with_url.sql`
- `supabase/migrations/20251206170815_update_notification_trigger_with_medical_id.sql`
- `supabase/migrations/20251206170925_fix_notification_trigger_with_hardcoded_url.sql`
- `supabase/migrations/20251206171009_fix_notification_trigger_field_name.sql`
- `supabase/migrations/20251209103404_update_order_notification_with_names.sql`
- `supabase/migrations/20251209103445_fix_order_notification_doctor_name.sql`
- `supabase/migrations/20251209111707_create_all_notification_triggers.sql`
- `supabase/migrations/20251209112821_add_unique_constraint_to_device_tokens.sql`
- `supabase/migrations/20251209134000_create_notifications_table.sql`
- `supabase/migrations/20251210113948_create_patient_notifications_table.sql`
- `supabase/migrations/20251210132448_fix_patient_notifications_step_by_step.sql`
- `supabase/migrations/20251211164354_add_upsert_device_token_function.sql`
- `supabase/migrations/20251211164654_fix_upsert_device_token_search_path.sql`
- `supabase/migrations/20251211164922_fix_all_function_search_paths.sql`
- `supabase/migrations/20251211165037_optimize_patient_notifications_rls_policies.sql`
- `supabase/migrations/20251211165531_optimize_database_performance.sql`
- `supabase/migrations/20251211175411_create_appointment_notification_trigger.sql`
- `supabase/migrations/20251211175719_update_appointment_trigger_with_navigation_data.sql`
- `supabase/migrations/20251212074404_fix_appointment_notifications_for_background.sql`
- `supabase/migrations/20251212074908_fix_appointment_notification_url.sql`
- `supabase/migrations/20251212092420_add_fcm_to_questionnaire_assignment.sql`
- `supabase/migrations/20251215180410_create_notification_reads_table.sql`
- `supabase/migrations/20251216104716_fix_upsert_device_token_ambiguous_column.sql`
- `supabase/migrations/20251216104741_fix_upsert_device_token_final.sql`
- `supabase/migrations/20251216110301_fix_upsert_device_token_conflict_clause.sql`
- `supabase/migrations/20251217071437_fix_fcm_notification_delivery.sql`
- `supabase/migrations/20251217131559_create_automatic_fcm_trigger_for_all_notifications.sql`
- `supabase/migrations/20260105114339_create_doctor_dashboard_stats_functions.sql`
- `supabase/migrations/20260105124103_add_get_doctor_scheduled_count_function.sql`
- `supabase/migrations/20260105124355_add_get_doctor_cancelled_count_function.sql`
- `supabase/migrations/20260105132422_fix_cancelled_count_case_insensitive.sql`
- `supabase/migrations/20260105132526_fix_cancelled_count_all_doctors.sql`
- `supabase/migrations/20260105132749_update_cancelled_count_for_today_only.sql`
- `supabase/migrations/20260105133145_create_get_doctor_patients_function.sql`
- `supabase/migrations/20260112084526_make_patient_id_nullable_in_device_tokens.sql`
- `supabase/migrations/20260112093047_update_get_doctor_patients_function.sql`
- `supabase/migrations/20260112114820_create_doctor_notifications_fcm_trigger.sql`
- `supabase/migrations/20260113110200_create_doctor_notifications_table_structure.sql`
- `supabase/migrations/20260113112929_fix_doctor_notifications_fcm_trigger.sql`
- `supabase/migrations/20260119071500_add_user_id_to_device_tokens.sql`
- `supabase/migrations/20260203071418_recreate_doctor_notifications_fcm_trigger.sql`
- `supabase/migrations/20260203115438_add_unique_constraint_doctor_device_tokens.sql`
- `supabase/migrations/20260203125509_fix_doctor_notifications_fcm_trigger_final.sql`
- `supabase/migrations/20260203130715_add_usertype_to_patient_notifications.sql`
- `supabase/migrations/20260205063037_add_company_id_filter_to_doctor_dashboard_functions.sql`
- `supabase/migrations/20260205063256_add_company_id_filter_to_get_doctor_patients.sql`
- `supabase/migrations/20260205064350_fix_company_id_type_to_uuid_in_doctor_functions.sql`
- `supabase/migrations/20260205064810_recreate_get_doctor_patients_with_full_details.sql`
- `supabase/migrations/20260205064845_fix_get_doctor_patients_phone_column.sql`
- `supabase/migrations/20260205125436_fix_doctor_dashboard_pending_status_check.sql`
- `supabase/migrations/20260205125503_clean_and_fix_all_doctor_dashboard_functions.sql`
- `supabase/migrations/20260206103742_create_get_doctor_notifications_via_access_function.sql`
- `supabase/migrations/20260206104103_fix_get_doctor_notifications_via_access_uuid.sql`
- `supabase/migrations/20260206104129_fix_get_doctor_notifications_objective_id_uuid.sql`
- `supabase/migrations/20260206104648_fix_get_doctor_notifications_remove_company_filter.sql`
- `supabase/migrations/20260206104850_add_company_details_to_doctor_notifications_function.sql`
- `supabase/migrations/20260206105314_add_company_filter_to_doctor_notifications_function.sql`
- `supabase/migrations/20260216070409_add_user_id_support_to_doctor_dashboard_functions.sql`
- `supabase/migrations/20260216071133_create_role_based_dashboard_functions.sql`
- `supabase/migrations/20260218123755_create_patient_payment_methods_table.sql`

---

## ✅ Database Test Cases

- [ ] TC-001: RLS policies prevent patient from reading another patient's records
- [ ] TC-002: RLS policies allow doctor to read their own patient list only
- [ ] TC-003: Unauthenticated access to all protected tables is denied
- [ ] TC-004: Appointment slot is marked unavailable after booking
- [ ] TC-005: CASCADE deletes work correctly (deleting patient removes appointments)
- [ ] TC-006: Indexes on patient_id and doctor_id improve query performance
- [ ] TC-007: Foreign key constraint prevents orphaned appointment records
- [ ] TC-008: created_at timestamps auto-populate on every INSERT
- [ ] TC-009: Status columns reject values outside the CHECK constraint
- [ ] TC-010: All migrations run in order without errors on a fresh Supabase project
- [ ] TC-011: UUID primary keys generated correctly via gen_random_uuid()
- [ ] TC-012: Notification table handles concurrent inserts without deadlock
- [ ] TC-013: Storage bucket policies restrict access to authenticated users
- [ ] TC-014: Doctor cannot read or modify another doctor's patient records
- [ ] TC-015: Migrations are idempotent where IF NOT EXISTS is used

---

## Final Status

**🟢 PASS — No critical or high schema issues found**

> Report generated by Database QA Agent.  
> Last run: 06/13/2026, 07:30:01 PM
