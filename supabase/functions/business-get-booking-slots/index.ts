import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// business-get-booking-slots
// -----------------------------------------------------------------------------
// NEW, dedicated slot generator for the RECEPTIONIST booking flow.
//
// For a doctor + clinic + date it returns every 30-minute slot in the working
// window, each flagged `available`. Unavailable slots are still returned (the UI
// greys them out) so the grid stays stable.
//
// Algorithm (per spec):
//   1. day_of_week = date's weekday (0=Sun .. 6=Sat).
//   2. Fetch recurring schedule (that weekday/clinic, active), exceptions (that
//      date), blocks (that date), and existing appointments (that date/clinic,
//      status in pending/scheduled/confirmed) — in parallel.
//   3. A 'day_off' exception => no slots.
//   4. A 'custom_hours' exception overrides the recurring start/end; otherwise
//      use the recurring schedule's start/end.
//   5. Walk start->end in 30-min steps; a slot is unavailable if it overlaps any
//      block or any existing appointment.
//
// Exceptions/blocks may be clinic-scoped (clinic_id set) or apply to all clinics
// (clinic_id NULL); both are honoured.
// =============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SLOT_MINUTES = 30;
// When a doctor has no recurring schedule and no custom-hours exception for the
// date, we still let receptionists book a *custom* appointment. With no working
// window to honour, we expose the FULL 24-hour day (00:00–24:00) so any time is
// selectable. `fallback: true` lets the UI label these as custom times.
const DEFAULT_START = "00:00";
const DEFAULT_END = "24:00";

// "HH:MM[:SS]" -> minutes since midnight.
const toMinutes = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
// minutes -> "HH:MM"
const toHHMM = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      return json({ success: false, error: "Server configuration error" }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const doctorId = body.doctorId || body.doctor_id;
    const clinicId = body.clinicId || body.clinic_id;
    const date = body.date; // YYYY-MM-DD

    if (!doctorId || !clinicId || !date) {
      return json({ success: false, error: "Missing required parameters" }, 400);
    }

    // The edge runtime is UTC; parsing "YYYY-MM-DD" yields UTC midnight, so
    // getUTCDay() is the deterministic weekday for that calendar date.
    const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();

    // Gate: doctor must exist and be live. We intentionally do NOT require
    // `booking_online` here — this is a staff (receptionist) flow, authorized
    // upstream via user_doctor_access, not patient self-booking.
    const { data: doctor } = await supabase
      .from("doctors")
      .select("id")
      .eq("is_deleted", false)
      .eq("id", doctorId)
      .maybeSingle();

    if (!doctor) {
      return json({ success: false, error: "Doctor not found" }, 404);
    }

    // Fetch everything we need for this date in parallel.
    const [scheduleRes, exceptionsRes, blocksRes, appointmentsRes] = await Promise.all([
      // `is_active`/`is_day_off` may be NULL on legacy rows, so filter in JS
      // rather than with `.eq(...)` which would drop those rows.
      supabase
        .from("doctor_recurring_schedules")
        .select("start_time, end_time, appointment_duration, is_day_off, is_active")
        .eq("doctor_id", doctorId)
        .eq("clinic_id", clinicId)
        .eq("day_of_week", dayOfWeek),
      supabase
        .from("doctor_schedule_exceptions")
        .select("exception_type, start_time, end_time, clinic_id")
        .eq("doctor_id", doctorId)
        .eq("exception_date", date),
      supabase
        .from("doctor_schedule_blocks")
        .select("start_time, end_time, clinic_id")
        .eq("doctor_id", doctorId)
        .eq("block_date", date),
      supabase
        .from("appointments")
        .select("appointment_time, end_time")
        .eq("doctor_id", doctorId)
        .eq("clinic_id", clinicId)
        .eq("appointment_date", date)
        .in("status", ["pending", "scheduled", "confirmed"]),
    ]);

    // Exceptions / blocks apply when they target this clinic OR all clinics (NULL).
    const exceptions = (exceptionsRes.data || []).filter(
      (e: any) => e.clinic_id == null || e.clinic_id === clinicId
    );
    const blocks = (blocksRes.data || []).filter(
      (b: any) => b.clinic_id == null || b.clinic_id === clinicId
    );
    const appointments = appointmentsRes.data || [];

    // A day-off style exception means no availability at all.
    const dayOff = exceptions.find((e: any) =>
      ["day_off", "vacation", "sick_leave"].includes(e.exception_type)
    );
    if (dayOff) {
      return json({ success: true, slots: [], availableSlots: [] });
    }

    // custom_hours exception overrides the recurring window; else use recurring.
    const customHours = exceptions.find(
      (e: any) => e.exception_type === "custom_hours" && e.start_time && e.end_time
    );

    // First usable recurring row for this day/clinic (active, not a day off).
    const schedule = (scheduleRes.data || []).find(
      (s: any) => s.is_active !== false && s.is_day_off !== true && s.start_time && s.end_time
    );

    let startTime: string | undefined;
    let endTime: string | undefined;
    let duration = SLOT_MINUTES;
    let fallback = false;

    if (customHours) {
      startTime = customHours.start_time;
      endTime = customHours.end_time;
    } else if (schedule) {
      startTime = schedule.start_time;
      endTime = schedule.end_time;
      duration = schedule.appointment_duration || SLOT_MINUTES;
    }

    if (!startTime || !endTime) {
      // No schedule/custom-hours for this date — fall back to a default window so
      // a custom appointment can still be booked. `fallback: true` lets the UI
      // label these as custom times.
      startTime = DEFAULT_START;
      endTime = DEFAULT_END;
      duration = SLOT_MINUTES;
      fallback = true;
    }

    const startMin = toMinutes(startTime);
    const endMin = toMinutes(endTime);

    // Pre-compute occupied [start, end) ranges from blocks and appointments.
    const blockRanges = blocks
      .filter((b: any) => b.start_time && b.end_time)
      .map((b: any) => [toMinutes(b.start_time), toMinutes(b.end_time)] as [number, number]);

    const apptRanges = appointments.map((a: any) => {
      const s = toMinutes(a.appointment_time);
      const e = a.end_time ? toMinutes(a.end_time) : s + SLOT_MINUTES;
      return [s, e] as [number, number];
    });

    const overlaps = (slotStart: number, slotEnd: number, ranges: [number, number][]) =>
      ranges.some(([s, e]) => slotStart < e && slotEnd > s);

    const slots: { time: string; available: boolean }[] = [];
    for (let m = startMin; m + duration <= endMin; m += duration) {
      const slotEnd = m + duration;
      const blocked = overlaps(m, slotEnd, blockRanges);
      const booked = overlaps(m, slotEnd, apptRanges);
      slots.push({ time: toHHMM(m), available: !blocked && !booked });
    }

    const availableSlots = slots.filter((s) => s.available).map((s) => s.time);

    return json({ success: true, slots, availableSlots, fallback });
  } catch (error: any) {
    console.error("Error in business-get-booking-slots:", error);
    return json({ success: false, error: "Internal server error", details: error?.message || String(error) }, 500);
  }
});
