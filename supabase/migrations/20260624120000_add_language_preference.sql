-- Add language preference for patients and doctors (mirrors the darkmode pattern)
ALTER TABLE public.user_patients
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';

-- Keep values constrained to supported languages
ALTER TABLE public.user_patients
  DROP CONSTRAINT IF EXISTS user_patients_language_check;
ALTER TABLE public.user_patients
  ADD CONSTRAINT user_patients_language_check CHECK (language IN ('en', 'ar', 'fr'));

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_language_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_language_check CHECK (language IN ('en', 'ar', 'fr'));
