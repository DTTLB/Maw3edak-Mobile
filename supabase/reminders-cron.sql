-- ============================================================================
--  Schedule the medication-reminder sender to run every minute.
--  RUN THIS MANUALLY in the Supabase SQL editor AFTER you have:
--    1. Applied the migration 20260624120000_medication_reminders.sql
--    2. Deployed the `send-due-reminders` edge function
--    3. Set a CRON_SECRET (any long random string) in the function's secrets
-- ============================================================================

-- Enable the required extensions (no-op if already enabled).
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove any previous schedule with the same name before recreating.
select cron.unschedule('send-medication-reminders')
where exists (select 1 from cron.job where jobname = 'send-medication-reminders');

-- Fire the sender once a minute. Replace <CRON_SECRET> with the value you set
-- in the function secrets (used to reject unauthenticated callers).
select cron.schedule(
  'send-medication-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://ttyukcvqifqyfolxtwba.functions.supabase.co/send-due-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <CRON_SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To inspect:    select * from cron.job;
-- To stop:       select cron.unschedule('send-medication-reminders');
