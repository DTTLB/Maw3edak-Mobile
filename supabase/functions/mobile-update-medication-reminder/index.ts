import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// --- timezone helpers (wall-clock in tz -> UTC instant) --------------------
function tzOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const m: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) m[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(m.year), Number(m.month) - 1, Number(m.day),
    Number(m.hour), Number(m.minute), Number(m.second),
  );
  return asUTC - date.getTime();
}
function zonedTimeToUtc(localISO: string, timeZone: string): Date {
  const asIfUTC = new Date(localISO + "Z");
  return new Date(asIfUTC.getTime() - tzOffsetMs(asIfUTC, timeZone));
}

// Extract a day count from free text like "7 days" / "2 weeks" / "1 month".
function parseDurationDays(text?: string | null): number {
  if (!text) return 30;
  const m = String(text).match(/(\d+)\s*(day|week|month|year)/i);
  if (!m) {
    const n = String(text).match(/(\d+)/);
    return n ? Number(n[1]) : 30;
  }
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  if (unit.startsWith("week")) return n * 7;
  if (unit.startsWith("month")) return n * 30;
  if (unit.startsWith("year")) return n * 365;
  return n;
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

async function buildReminderQueue(
  supabase: any, item: any, schedule: any, patientId: string, timezone: string,
) {
  if (!schedule?.reminderTimes?.length || !schedule.startDate || !schedule.endDate) return;
  const start = new Date(schedule.startDate + "T00:00:00Z");
  const end = new Date(schedule.endDate + "T00:00:00Z");
  const now = new Date();
  const rows: any[] = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const dayStr = d.toISOString().slice(0, 10);
    for (const t of schedule.reminderTimes) {
      const sendAt = zonedTimeToUtc(`${dayStr}T${t}:00`, timezone);
      if (sendAt <= now) continue;
      rows.push({
        prescription_item_id: item.id,
        patient_id: patientId,
        send_at: sendAt.toISOString(),
        title: `Time for ${item.medicine_name}`,
        body: `${item.dosage ?? ""}${item.notes ? " · " + item.notes : ""}`.trim() || item.medicine_name,
        data: { type: "medication_reminder", itemId: item.id },
      });
    }
  }
  if (rows.length) {
    await supabase.from("reminder_queue").upsert(rows, {
      onConflict: "prescription_item_id,send_at",
      ignoreDuplicates: true,
    });
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const json = (b: any, status = 200) =>
    new Response(JSON.stringify(b), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { medicalId, itemId, action, reminderTimes, startDate, endDate, timezone } = await req.json();
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

    if (!medicalId || !itemId || !action) {
      return json({ success: false, error: "medicalId, itemId and action are required" }, 400);
    }
    const VALID = ["edit", "pause", "resume", "enable", "delete"];
    if (!VALID.includes(action)) {
      return json({ success: false, error: `action must be one of ${VALID.join(", ")}` }, 400);
    }

    // Load the item and its prescription (with the owning patient's medical_id).
    const { data: item } = await supabase
      .from("prescription_items")
      .select("id, medicine_name, dosage, notes, duration, parsed_schedule, patient_prescription_id")
      .eq("id", itemId)
      .maybeSingle();
    if (!item) return json({ success: false, error: "Prescription item not found" }, 404);

    const { data: presc } = await supabase
      .from("patient_prescriptions")
      .select("id, patient_id, prescription_date, patients:patient_id ( medical_id )")
      .eq("id", item.patient_prescription_id)
      .maybeSingle();
    if (!presc) return json({ success: false, error: "Prescription not found" }, 404);

    // Ownership check: the item's patient must carry this medical_id.
    const ownerMedicalId = (presc as any).patients?.medical_id;
    if (ownerMedicalId !== medicalId) {
      return json({ success: false, error: "Not authorized for this prescription" }, 403);
    }

    // Base schedule (create one if the LLM never parsed this item yet).
    const prescDate = new Date(presc.prescription_date).toISOString().slice(0, 10);
    let s: any = item.parsed_schedule ?? {
      timesPerDay: 0,
      reminderTimes: [],
      durationDays: parseDurationDays(item.duration),
      patientMessage: `${item.medicine_name}${item.dosage ? ": " + item.dosage : ""}`,
    };
    if (!s.startDate) s.startDate = prescDate;
    if (!s.endDate) {
      const end = new Date(presc.prescription_date);
      end.setDate(end.getDate() + (s.durationDays || parseDurationDays(item.duration)));
      s.endDate = end.toISOString().slice(0, 10);
    }

    // Always clear FUTURE unsent rows for this item first, then rebuild if active.
    await supabase
      .from("reminder_queue")
      .delete()
      .eq("prescription_item_id", item.id)
      .eq("sent", false)
      .gt("send_at", new Date().toISOString());

    if (action === "edit") {
      const times: string[] = Array.isArray(reminderTimes) ? reminderTimes : [];
      const clean = Array.from(new Set(times.filter((t) => TIME_RE.test(t)))).sort();
      if (times.length && clean.length !== times.length) {
        return json({ success: false, error: "Times must be HH:MM (24-hour)" }, 400);
      }
      // Optional custom date range.
      if (startDate) {
        if (!DATE_RE.test(startDate)) return json({ success: false, error: "startDate must be YYYY-MM-DD" }, 400);
        s.startDate = startDate;
      }
      if (endDate) {
        if (!DATE_RE.test(endDate)) return json({ success: false, error: "endDate must be YYYY-MM-DD" }, 400);
        s.endDate = endDate;
      }
      if (new Date(s.endDate + "T00:00:00Z") < new Date(s.startDate + "T00:00:00Z")) {
        return json({ success: false, error: "End date must be on or after the start date" }, 400);
      }
      s.durationDays = Math.round(
        (new Date(s.endDate + "T00:00:00Z").getTime() - new Date(s.startDate + "T00:00:00Z").getTime()) / 86400000,
      );

      s.reminderTimes = clean;
      s.timesPerDay = clean.length;
      s.remindersStatus = clean.length ? "active" : "off";
      s.edited = true;
    } else if (action === "pause") {
      s.remindersStatus = "paused";
    } else if (action === "resume" || action === "enable") {
      s.remindersStatus = "active";
    } else if (action === "delete") {
      s.remindersStatus = "off";
    }

    await supabase
      .from("prescription_items")
      .update({ parsed_schedule: s })
      .eq("id", item.id);

    if (s.remindersStatus === "active" && s.reminderTimes?.length && timezone) {
      await buildReminderQueue(supabase, item, s, presc.patient_id, timezone);
    }

    return json({ success: true, parsed_schedule: s });
  } catch (error) {
    console.error("Error in mobile-update-medication-reminder:", error);
    return json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      500,
    );
  }
});
