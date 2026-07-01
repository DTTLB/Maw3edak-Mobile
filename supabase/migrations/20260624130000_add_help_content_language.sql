-- Add language to help content so articles can be authored per language.
-- Existing rows default to English.
ALTER TABLE public.app_help_content
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';

ALTER TABLE public.app_help_content
  DROP CONSTRAINT IF EXISTS app_help_content_language_check;
ALTER TABLE public.app_help_content
  ADD CONSTRAINT app_help_content_language_check CHECK (language IN ('en', 'ar', 'fr'));
