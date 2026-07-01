import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// business-cancel-appointment
// -----------------------------------------------------------------------------
// NEW endpoint for the RECEPTIONIST flow: cancel a still-pending appointment.
//
// Authorization: the appointment's doctor must be one assigned to the requesting
// receptionist (user_doctor_access). Only 'pending' appointments may be
// cancelled here (confirmed/completed are left to the doctor portal).
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

    if (!appointmentId) {
      return json({ success: false, error: "appointmentId is required" }, 400);
    }
    if (!userId) {
      return json({ success: false, error: "user_id is required" }, 400);
    }

    // Fetch the appointment to validate ownership + status.
    const { data: appt, error: apptError } = await supabase
      .from("appointments")
      .select("id, doctor_id, status")
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
      return json({ success: false, error: "Not authorized to cancel this appointment" }, 403);
    }

    const status = (appt.status || "").toLowerCase();
    if (status === "cancelled") {
      return json({ success: true, message: "Appointment already cancelled" });
    }
    if (status !== "pending") {
      return json({ success: false, error: "Only pending appointments can be cancelled here." }, 409);
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointmentId);

    if (updateError) {
      return json({ success: false, error: "Failed to cancel appointment", details: updateError.message }, 500);
    }

    return json({ success: true, message: "Appointment cancelled" });
  } catch (error: any) {
    console.error("Error in business-cancel-appointment:", error);
    return json({ success: false, error: "Internal server error", details: error?.message || String(error) }, 500);
  }
});
