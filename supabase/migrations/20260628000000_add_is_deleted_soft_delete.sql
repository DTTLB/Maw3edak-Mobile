/*
  # Soft-delete support for account deletion

  Ensures the `is_deleted` flag exists on every table involved in the
  "Delete Account" flow so a deleted account/profile can be hidden from all
  normal queries without ever removing the underlying row or mutating any
  personal data (name, email, mobile, status, password, etc.).

  Account deletion sets `is_deleted = TRUE`:
    - Patient: `user_patients` + `patients`, matched by `medical_id`.
    - Doctor:  `users` + `doctors`, matched by `global_id`.

  Columns are added defensively (IF NOT EXISTS) because the base tables are
  managed by the web application's schema; this migration only guarantees the
  flag and its default are present and indexed for the mobile soft-delete logic.
*/

-- user_patients (patient login/account) --------------------------------------
ALTER TABLE IF EXISTS public.user_patients
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- patients (patient clinical profile) ----------------------------------------
ALTER TABLE IF EXISTS public.patients
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- users (doctor login/account) -----------------------------------------------
ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- doctors (doctor profile) ---------------------------------------------------
ALTER TABLE IF EXISTS public.doctors
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- Indexes so the `is_deleted = false` filter on every normal query stays cheap.
CREATE INDEX IF NOT EXISTS idx_user_patients_is_deleted
  ON public.user_patients (is_deleted);
CREATE INDEX IF NOT EXISTS idx_patients_is_deleted
  ON public.patients (is_deleted);
CREATE INDEX IF NOT EXISTS idx_users_is_deleted
  ON public.users (is_deleted);
CREATE INDEX IF NOT EXISTS idx_doctors_is_deleted
  ON public.doctors (is_deleted);
