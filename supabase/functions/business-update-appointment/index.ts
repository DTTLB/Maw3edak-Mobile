import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// business-update-appointment
// -----------------------------------------------------------------------------
// NEW endpoint for the RECEPTIONIST flow: reschedule an existing appointment to
// a new date / time (used by the Doctor Calendar edit modal).
//
// Authorization: the appointment's doctor must be one assigned to the requesting
// receptionist (user_doctor_access). Cancelled / completed appointments cannot
// be edited. The new slot is double-booking checked (excluding the appointment
// itself), and end_time is recomputed preserving the original duration.
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

// "HH:MM[:SS]" -> minutes since midnight.
const toMinutes = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
// "HH:MM[:SS]" -> "HH:MM" + n minutes (wraps at 24h).
const addMinutes = (time: string, mins: number): string => {
  const total = toMinutes(time) + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
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
    const appointmentId = body.appointmentId || body.appointment_id;
    const userId = body.user_id || body.userId || body.bookedByUserId || null;
    const newDate = body.appointmentDate || body.appointment_date;
    const newTime = body.appointmentTime || body.appointment_time;

    if (!appointmentId) {
      return json({ success: false, error: "appointmentId is required" }, 400);
    }
    if (!userId) {
      return json({ success: false, error: "user_id is required" }, 400);
    }
    if (!newDate || !newTime) {
      return json({ success: false, error: "appointmentDate and appointmentTime are required" }, 400);
    }

    // Fetch the appointment (ownership, status, current window).
    const { data: appt, error: apptError } = await supabase
      .from("appointments")
      .select("id, doctor_id, clinic_id, status, appointment_time, end_time")
      .eq("id", appointmentId)
      .single();

    if (apptError || !appt) {
      return json({ success: false, error: "Appointment not found", details: apptError?.message }, 404);
    }

    // The requesting receptionist must be assigned to this appointment's doctor.
    const { data: access } = await supabase
      .from("user_doctor_access")
      .select("doctor_id")
      .eq("user_id", userId)
      .eq("doctor_id", appt.doctor_id)
      .limit(1);

    if (!access || access.length === 0) {
      return json({ success: false, error: "Not authorized to edit this appointment" }, 403);
    }

    const status = (appt.status || "").toLowerCase();
    if (status === "cancelled" || status === "completed") {
      return json({ success: false, error: "Cancelled or completed appointments cannot be edited." }, 409);
    }

    // Double-booking guard for the target slot (excluding this appointment).
    const { data: clash, error: clashError } = await supabase
      .from("appointments")
      .select("id")
      .eq("doctor_id", appt.doctor_id)
      .eq("clinic_id", appt.clinic_id)
      .eq("appointment_date", newDate)
      .eq("appointment_time", newTime)
      .in("status", ["pending", "scheduled", "confirmed"])
      .neq("id", appointmentId)
      .limit(1);

    if (clashError) {
      return json({ success: false, error: "Failed to verify slot availability", details: clashError.message }, 500);
    }
    if (clash && clash.length > 0) {
      return json({ success: false, error: "This time slot is already taken. Please choose another time." }, 409);
    }

    // Preserve the original duration where possible, else default to 30 min.
    let durationMins = SLOT_MINUTES;
    if (appt.appointment_time && appt.end_time) {
      const delta = toMinutes(appt.end_time) - toMinutes(appt.appointment_time);
      if (delta > 0) durationMins = delta;
    }
    const endTime = addMinutes(newTime, durationMins);

    const { data: updated, error: updateError } = await supabase
      .from("appointments")
      .update({ appointment_date: newDate, appointment_time: newTime, end_time: endTime })
      .eq("id", appointmentId)
      .select()
      .single();

    if (updateError) {
      return json({ success: false, error: "Failed to update appointment", details: updateError.message }, 500);
    }

    return json({ success: true, message: "Appointment updated", appointment: updated });
  } catch (error: any) {
    console.error("Error in business-update-appointment:", error);
    return json({ success: false, error: "Internal server error", details: error?.message || String(error) }, 500);
  }
});
