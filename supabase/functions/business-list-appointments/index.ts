import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// business-list-appointments
// -----------------------------------------------------------------------------
// NEW, dedicated "My Appointments" feed for the RECEPTIONIST flow.
//
// Lists appointments across every doctor assigned to the receptionist
// (user_doctor_access, scoped to their company), joined with doctor, clinic and
// patient names. Optionally filtered to a single patient by medical_id. Ordered
// by date/time descending. The client splits these into Upcoming / Past.
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

const hhmm = (t: string | null | undefined): string => (t ? t.substring(0, 5) : "");

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
    let companyId: string | null = null;
    let medicalId: string | null = null;
    let patientId: string | null = null;
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      userId = body.user_id?.trim() || body.userId?.trim() || null;
      companyId = body.company_id?.trim() || body.companyId?.trim() || null;
      medicalId = body.medical_id?.trim() || body.medicalId?.trim() || null;
      patientId = body.patient_id?.trim() || body.patientId?.trim() || null;
    } else {
      const url = new URL(req.url);
      userId = url.searchParams.get("user_id");
      companyId = url.searchParams.get("company_id");
      medicalId = url.searchParams.get("medical_id");
      patientId = url.searchParams.get("patient_id");
    }

    if (!userId) {
      return json({ success: false, error: "user_id is required" }, 400);
    }

    // Doctors assigned to this receptionist.
    let accessQuery = supabase
      .from("user_doctor_access")
      .select("doctor_id")
      .eq("user_id", userId);
    if (companyId) accessQuery = accessQuery.eq("company_id", companyId);

    const { data: accessRows, error: accessError } = await accessQuery;
    if (accessError) {
      return json({ success: false, error: "Failed to resolve assigned doctors", details: accessError.message }, 500);
    }

    const doctorIds = [...new Set((accessRows || []).map((r: any) => r.doctor_id))];
    if (doctorIds.length === 0) {
      return json({ success: true, appointments: [] });
    }

    // Optionally narrow to one patient — by patient_id (preferred, works even
    // when the patient has no medical_id) or by medical_id within the company.
    let patientIds: string[] | null = null;
    if (patientId) {
      patientIds = [patientId];
    } else if (medicalId) {
      let pQuery = supabase
        .from("patients")
        .select("id")
        .eq("is_deleted", false)
        .eq("medical_id", medicalId);
      if (companyId) pQuery = pQuery.eq("company_id", companyId);
      const { data: pRows } = await pQuery;
      patientIds = (pRows || []).map((p: any) => p.id);
      if (patientIds.length === 0) {
        return json({ success: true, appointments: [] });
      }
    }

    let apptQuery = supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        appointment_time,
        end_time,
        status,
        notes,
        is_custom,
        created_at,
        doctor_id,
        clinic_id,
        patient_id,
        doctors:doctor_id ( first_name, last_name ),
        clinics:clinic_id ( name, address ),
        patients:patient_id ( first_name, last_name, medical_id )
      `)
      .in("doctor_id", doctorIds)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });

    if (patientIds) apptQuery = apptQuery.in("patient_id", patientIds);

    const { data: rows, error: apptError } = await apptQuery;
    if (apptError) {
      return json({ success: false, error: "Failed to fetch appointments", details: apptError.message }, 500);
    }

    const appointments = (rows || []).map((a: any) => ({
      id: a.id,
      date: a.appointment_date,
      time: hhmm(a.appointment_time),
      endTime: hhmm(a.end_time),
      status: (a.status || "").toLowerCase(),
      notes: a.notes || "",
      isCustom: a.is_custom === true,
      createdAt: a.created_at,
      doctorId: a.doctor_id,
      clinicId: a.clinic_id,
      patientId: a.patient_id,
      doctorName: a.doctors ? `Dr. ${a.doctors.first_name} ${a.doctors.last_name}`.trim() : "",
      clinicName: a.clinics?.name || "",
      clinicAddress: a.clinics?.address || "",
      patientName: a.patients ? `${a.patients.first_name} ${a.patients.last_name}`.trim() : "",
      medicalId: a.patients?.medical_id || "",
    }));

    return json({ success: true, appointments });
  } catch (error: any) {
    console.error("Error in business-list-appointments:", error);
    return json({ success: false, error: "Internal server error", details: error?.message || String(error) }, 500);
  }
});
