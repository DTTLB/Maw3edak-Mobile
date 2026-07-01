import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// business-get-patient
// -----------------------------------------------------------------------------
// Full patient profile for the RECEPTIONIST patient-details screen. Returns the
// patient's demographic data (DOB, gender, blood type, address, contact, ...).
//
// Authorization: the patient must be linked (patient_doctor_access) to a doctor
// the receptionist is assigned to (user_doctor_access). Otherwise 403.
//
// Request: { user_id, patient_id, company_id? }
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

    let userId: string | null = null;
    let patientId: string | null = null;
    let companyId: string | null = null;
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      userId = body.user_id?.trim() || body.userId?.trim() || null;
      patientId = body.patient_id?.trim() || body.patientId?.trim() || null;
      companyId = body.company_id?.trim() || body.companyId?.trim() || null;
    } else {
      const url = new URL(req.url);
      userId = url.searchParams.get("user_id");
      patientId = url.searchParams.get("patient_id");
      companyId = url.searchParams.get("company_id");
    }

    if (!userId || !patientId) {
      return json({ success: false, error: "user_id and patient_id are required" }, 400);
    }

    // Authorize: receptionist's doctors ∩ patient's doctors must be non-empty.
    let udaQuery = supabase
      .from("user_doctor_access")
      .select("doctor_id")
      .eq("user_id", userId);
    if (companyId) udaQuery = udaQuery.eq("company_id", companyId);
    const { data: uda } = await udaQuery;
    const userDoctorIds = new Set((uda || []).map((r: any) => r.doctor_id));

    if (userDoctorIds.size === 0) {
      return json({ success: false, error: "Unauthorized access: selected item is not linked to this doctor or user." }, 403);
    }

    const { data: pda } = await supabase
      .from("patient_doctor_access")
      .select("doctor_id")
      .eq("patient_id", patientId);
    const linked = (pda || []).some((r: any) => userDoctorIds.has(r.doctor_id));

    if (!linked) {
      return json({ success: false, error: "Unauthorized access: selected item is not linked to this doctor or user." }, 403);
    }

    // Fetch the full profile.
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select(
        "id, medical_id, first_name, last_name, full_name, email, phone, date_of_birth, gender, blood_type, address, image, medical_notes, medical_history, company_id, is_active"
      )
      .eq("is_deleted", false)
      .eq("id", patientId)
      .maybeSingle();

    if (patientError || !patient) {
      return json({ success: false, error: "Patient not found", details: patientError?.message }, 404);
    }

    // Resolve the company name (best-effort).
    let companyName = "";
    if (patient.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", patient.company_id)
        .maybeSingle();
      companyName = company?.name || "";
    }

    return json({
      success: true,
      patient: {
        patient_id: patient.id,
        medical_id: patient.medical_id || null,
        full_name: patient.full_name || `${patient.first_name || ""} ${patient.last_name || ""}`.trim(),
        first_name: patient.first_name || "",
        last_name: patient.last_name || "",
        email: patient.email || null,
        phone: patient.phone || null,
        date_of_birth: patient.date_of_birth || null,
        gender: patient.gender || null,
        blood_type: patient.blood_type || null,
        address: patient.address || null,
        image: patient.image || null,
        medical_notes: patient.medical_notes || null,
        medical_history: patient.medical_history || null,
        company_id: patient.company_id,
        company_name: companyName,
        is_active: patient.is_active !== false,
      },
    });
  } catch (error: any) {
    console.error("Error in business-get-patient:", error);
    return json({ success: false, error: "Internal server error", details: error?.message || String(error) }, 500);
  }
});
