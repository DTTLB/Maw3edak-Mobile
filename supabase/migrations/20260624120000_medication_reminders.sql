/*
  # Automatic medication reminders (server-side FCM)

  1. prescription_items.parsed_schedule (jsonb)
     - Cache of the LLM-parsed schedule so we call Claude only ONCE per item.
     - Shape: { timesPerDay, reminderTimes: ["HH:MM"], durationDays,
                patientMessage, startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD"|null }

  2. reminder_queue
     - One row per (prescription_item, dose datetime in UTC). Built server-side from
       the parsed schedule using the patient's device timezone. The cron sender
       (`send-due-reminders`) compares only UTC instants — no per-minute tz math.
     - unique(prescription_item_id, send_at) makes queue building idempotent.

  3. device_tokens.timezone (text, optional)
     - Stored for record-keeping; the queue is built with the timezone the app
       passes to `mobile-get-patient-prescriptions`.

  4. medication_logs (phase 2 — adherence; not wired to the doctor portal yet)
*/

-- 1. Cache column ----------------------------------------------------------
alter table prescription_items
  add column if not exists parsed_schedule jsonb;

-- 2. Reminder queue --------------------------------------------------------
create table if not exists reminder_queue (
  id uuid primary key default gen_random_uuid(),
  prescription_item_id uuid references prescription_items(id) on delete cascade,
  patient_id uuid references patients(id) on delete cascade,
  send_at timestamptz not null,          -- exact UTC instant to push
  title text not null,
  body text not null,
  data jsonb,
  sent boolean not null default false,
  sent_at timestamptz,
  created_at timestamptz default now(),
  unique (prescription_item_id, send_at) -- idempotent queue building
);

create index if not exists idx_reminder_due
  on reminder_queue (send_at) where sent = false;

create index if not exists idx_reminder_queue_patient
  on reminder_queue (patient_id);

-- Server-only table: service role bypasses RLS. Enable RLS with no public
-- policies so it is not exposed via the anon/public API.
alter table reminder_queue enable row level security;

-- 3. Optional timezone column on device_tokens -----------------------------
alter table device_tokens
  add column if not exists timezone text;

-- 4. Phase 2 adherence logging --------------------------------------------
create table if not exists medication_logs (
  id uuid primary key default gen_random_uuid(),
  prescription_item_id uuid references prescription_items(id) on delete cascade,
  patient_id uuid references patients(id) on delete cascade,
  scheduled_for timestamptz not null,
  status text not null check (status in ('taken','skipped')),
  logged_at timestamptz default now()
);

create index if not exists idx_medication_logs_item
  on medication_logs (prescription_item_id);
