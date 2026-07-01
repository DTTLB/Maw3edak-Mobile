import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ---------------------------------------------------------------------------
// Timezone helper: convert a wall-clock time in `timeZone` to a UTC instant.
// Self-contained (no date-fns-tz dependency) using Intl offset calculation.
// ---------------------------------------------------------------------------
function tzOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const m: Record<string, string> = {};
  for (const p of parts) m[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(m.year),
    Number(m.month) - 1,
    Number(m.day),
    Number(m.hour),
    Number(m.minute),
    Number(m.second),
  );
  return asUTC - date.getTime();
}

// "2026-06-24T08:00:00" interpreted as wall-time in `timeZone` -> UTC Date
function zonedTimeToUtc(localISO: string, timeZone: string): Date {
  const asIfUTC = new Date(localISO + "Z");
  const offset = tzOffsetMs(asIfUTC, timeZone);
  return new Date(asIfUTC.getTime() - offset);
}

// ---------------------------------------------------------------------------
// Parse the doctor's free-text prescription into a real schedule via Claude.
// Cache hit returns immediately; only the first load ever calls the API.
// ---------------------------------------------------------------------------
function fallbackSchedule(item: any, prescriptionDate: string) {
  return {
    timesPerDay: 0,
    reminderTimes: [],
    durationDays: 0,
    patientMessage: `${item.medicine_name}${item.dosage ? ": " + item.dosage : ""}` +
      `${item.frequency ? ", " + item.frequency : ""}` +
      `${item.duration ? ", " + item.duration : ""}`,
    startDate: new Date(prescriptionDate).toISOString().slice(0, 10),
    endDate: null,
  };
}

async function getSchedule(item: any, prescriptionDate: string, supabase: any) {
  if (item.parsed_schedule) return item.parsed_schedule; // cache hit

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  // No key configured yet -> show raw text, don't cache (parses once key is set).
  if (!apiKey) return fallbackSchedule(item, prescriptionDate);

  let parsed: any;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system:
          `You convert a doctor's free-text prescription into a schedule.
Return ONLY valid JSON, no markdown, with this exact shape:
{"timesPerDay": number, "reminderTimes": ["HH:MM", ...],
 "durationDays": number, "patientMessage": "short plain-language instructions"}
Use these default times:
1/day = 09:00
2/day = 09:00, 21:00
3/day = 08:00, 14:00, 20:00
4/day = 08:00, 13:00, 18:00, 23:00
If frequency is "as needed" / PRN, set timesPerDay = 0 and reminderTimes = [].
patientMessage example: "Take 2 tablets, 3 times a day (8am, 2pm, 8pm) for 7 days. Take with food."`,
        messages: [
          {
            role: "user",
            content: `Medicine: ${item.medicine_name}
Dosage: ${item.dosage}
Frequency: ${item.frequency}
Duration: ${item.duration}
Notes: ${item.notes ?? "none"}`,
          },
        ],
      }),
    });

    const data = await res.json();
    const raw = (data.content ?? [])
      .map((b: any) => b.text ?? "")
      .join("")
      .replace(/```json|```/g, "")
      .trim();
    parsed = JSON.parse(raw);
  } catch (_e) {
    // Never crash the screen — fall back to showing the raw text.
    return fallbackSchedule(item, prescriptionDate);
  }

  // Date math stays in code, never in the LLM.
  const start = new Date(prescriptionDate);
  const end = new Date(prescriptionDate);
  end.setDate(end.getDate() + (parsed.durationDays || 0));
  parsed.startDate = start.toISOString().slice(0, 10);
  parsed.endDate = end.toISOString().slice(0, 10);

  await supabase
    .from("prescription_items")
    .update({ parsed_schedule: parsed })
    .eq("id", item.id);

  return parsed;
}

// ---------------------------------------------------------------------------
// Build the reminder queue (UTC dose rows) for one item. Idempotent.
// ---------------------------------------------------------------------------
async function buildReminderQueue(
  supabase: any,
  item: any,
  patientId: string,
  timezone: string,
) {
  const s = item.parsed_schedule;
  if (!s || !s.reminderTimes?.length || !s.startDate || !s.endDate) return; // PRN / unparsed
  if (s.remindersStatus === "paused" || s.remindersStatus === "off") return; // patient turned them off

  const start = new Date(s.startDate + "T00:00:00Z");
  const end = new Date(s.endDate + "T00:00:00Z");
  const now = new Date();
  const rows: any[] = [];

  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const dayStr = d.toISOString().slice(0, 10);
    for (const t of s.reminderTimes) {
      const sendAt = zonedTimeToUtc(`${dayStr}T${t}:00`, timezone);
      if (sendAt <= now) continue; // skip doses already past
      rows.push({
        prescription_item_id: item.id,
        patient_id: patientId,
        send_at: sendAt.toISOString(),
        title: `Time for ${item.medicine_name}`,
        body: `${item.dosage ?? ""}${item.notes ? " · " + item.notes : ""}`.trim() ||
          item.medicine_name,
        data: { type: "medication_reminder", itemId: item.id },
      });
    }
  }

  if (rows.length) {
    await supabase
      .from("reminder_queue")
      .upsert(rows, {
        onConflict: "prescription_item_id,send_at",
        ignoreDuplicates: true,
      });
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { medicalId, doctorId, timezone } = body;

    if (!medicalId) {
      return new Response(JSON.stringify({ error: "Medical ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // All patient records across all companies for this medical_id.
    const { data: patientRecords, error: patientError } = await supabase
      .from("patients")
      .select("id, company_id")
      .eq("is_deleted", false)
      .eq("medical_id", medicalId);

    if (patientError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch patient records", details: patientError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!patientRecords || patientRecords.length === 0) {
      return new Response(JSON.stringify({ error: "Patient not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const patientIds = patientRecords.map((p) => p.id);

    // Prescription headers + doctor.
    let query = supabase
      .from("patient_prescriptions")
      .select(`
        id,
        prescription_date,
        notes,
        doctor_id,
        patient_id,
        doctors:doctor_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .in("patient_id", patientIds)
      .order("prescription_date", { ascending: false });

    if (doctorId) query = query.eq("doctor_id", doctorId);

    const { data: prescriptions, error: prescriptionsError } = await query;
    if (prescriptionsError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch prescriptions", details: prescriptionsError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const prescriptionIds = (prescriptions ?? []).map((p) => p.id);

    // Single query for ALL items (collapses the previous N+1), grouped in code.
    let itemsByPrescription: Record<string, any[]> = {};
    if (prescriptionIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from("prescription_items")
        .select(`
          id,
          patient_prescription_id,
          medicine_name,
          dosage,
          frequency,
          duration,
          notes,
          parsed_schedule,
          prescription_definition_id,
          prescription_definitions:prescription_definition_id (
            description
          )
        `)
        .in("patient_prescription_id", prescriptionIds);

      if (itemsError) {
        console.error("Error fetching prescription items:", itemsError);
      } else {
        for (const it of items ?? []) {
          (itemsByPrescription[it.patient_prescription_id] ||= []).push(it);
        }
      }
    }

    // Parse schedules (cached) and attach to each item.
    const prescriptionsWithItems = await Promise.all(
      (prescriptions ?? []).map(async (prescription) => {
        const items = itemsByPrescription[prescription.id] ?? [];
        for (const item of items) {
          item.parsed_schedule = await getSchedule(
            item,
            prescription.prescription_date,
            supabase,
          );
        }
        return { ...prescription, items };
      }),
    );

    // Build the reminder queue (UTC) when the app supplied a timezone.
    if (timezone) {
      for (const prescription of prescriptionsWithItems) {
        for (const item of prescription.items) {
          await buildReminderQueue(
            supabase,
            item,
            prescription.patient_id,
            timezone,
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, prescriptions: prescriptionsWithItems }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in mobile-get-patient-prescriptions:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
