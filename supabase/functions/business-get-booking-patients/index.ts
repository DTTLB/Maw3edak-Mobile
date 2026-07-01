import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// business-get-booking-patients
// -----------------------------------------------------------------------------
// NEW, dedicated endpoint for the RECEPTIONIST booking flow. It is intentionally
// separate from the doctor/patient endpoints so the reception screens never
// depend on the existing booking functions.
//
// Returns the list of patients a receptionist may book for: every patient
// linked (via patient_doctor_access) to one of the doctors assigned to this
// receptionist (via user_doctor_access). Resolution is done server-side from
// the receptionist's own user_id (a UUID) — the client never supplies an
// arbitrary doctor/patient id.
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

// Patients who deleted their account are anonymized (not removed) when records
// must be retained. Such rows must never appear in the booking list.
const isAnonymized = (p: any): boolean => {
  const email = typeof p?.email === "string" ? p.email.toLowerCase() : "";
  const name = typeof p?.full_name === "string" ? p.full_name.trim().toLowerCase() : "";
  const phone = typeof p?.phone === "string" ? p.phone : "";
  return (
    email.endsWith("@deleted.invalid") ||
    name === "deleted user" ||
    phone.startsWith("deleted-")
  );
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

    // Accept params from POST body or query string (GET) for flexibility.
    let userId: string | null = null;
    let companyId: string | null = null;
    let doctorId: string | null = null;
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      userId = body.user_id?.trim() || body.userId?.trim() || null;
      companyId = body.company_id?.trim() || body.companyId?.trim() || null;
      doctorId = body.doctor_id?.trim() || body.doctorId?.trim() || null;
    } else {
      const url = new URL(req.url);
      userId = url.searchParams.get("user_id");
      companyId = url.searchParams.get("company_id");
      doctorId = url.searchParams.get("doctor_id");
    }

    if (!userId) {
      return json({ success: false, error: "user_id is required" }, 400);
    }

    // When a doctor is supplied, the patient list must be scoped to that doctor
    // (patient_doctor_access). First authorize: the doctor must be one assigned
    // to this receptionist (user_doctor_access).
    let doctorPatientIds: Set<string> | null = null;
    if (doctorId) {
      const { data: uda } = await supabase
        .from("user_doctor_access")
        .select("doctor_id")
        .eq("user_id", userId)
        .eq("doctor_id", doctorId)
        .limit(1);
      if (!uda || uda.length === 0) {
        return json(
          { success: false, error: "Unauthorized access: selected item is not linked to this doctor or user." },
          403
        );
      }
      const { data: pda } = await supabase
        .from("patient_doctor_access")
        .select("patient_id")
        .eq("doctor_id", doctorId);
      doctorPatientIds = new Set((pda || []).map((r: any) => r.patient_id));
      if (doctorPatientIds.size === 0) {
        return json({ success: true, patients: [] });
      }
    }

    // Resolve patients through the receptionist's assigned doctors. The
    // get_doctor_patients RPC already supports a receptionist user_id (p_user_id)
    // and applies the soft-delete filters server-side.
    const { data: patientsData, error: rpcError } = await supabase.rpc(
      "get_doctor_patients",
      { p_global_id: null, p_company_id: companyId || null, p_user_id: userId }
    );

    if (rpcError) {
      console.error("get_doctor_patients error:", rpcError.message);
      return json({ success: false, error: "Failed to fetch patients", details: rpcError.message }, 500);
    }

    // Keep only ACTIVE, non-deleted patients. The RPC handles soft-deletes but
    // not the `is_active` flag, so an inactive patient would otherwise appear in
    // the booking list. Resolve is_active/is_deleted for the returned ids and
    // drop anyone inactive or deleted (NULL is_active is treated as active).
    const patientIds = [
      ...new Set((patientsData || []).map((p: any) => p.patient_id).filter(Boolean)),
    ];
    const allowedIds = new Set<string>(patientIds);
    if (patientIds.length > 0) {
      const { data: statusRows } = await supabase
        .from("patients")
        .select("id, is_active, is_deleted")
        .in("id", patientIds);
      allowedIds.clear();
      for (const r of statusRows || []) {
        if (r.is_active !== false && r.is_deleted !== true) allowedIds.add(r.id);
      }
    }

    const patients = (patientsData || [])
      .filter(
        (p: any) =>
          allowedIds.has(p.patient_id) &&
          !isAnonymized(p) &&
          // When scoped to a doctor, keep only that doctor's patients.
          (!doctorPatientIds || doctorPatientIds.has(p.patient_id))
      )
      .map((p: any) => ({
        patient_id: p.patient_id,
        medical_id: p.medical_id,
        full_name: p.full_name,
        email: p.email,
        phone: p.phone,
        company_id: p.company_id,
        company_name: p.company_name,
        appointment_count: Number(p.appointment_count || 0),
        last_appointment_date: p.last_appointment_date,
      }));

    return json({ success: true, patients });
  } catch (error: any) {
    console.error("Error in business-get-booking-patients:", error);
    return json({ success: false, error: "Internal server error", details: error?.message || String(error) }, 500);
  }
});
