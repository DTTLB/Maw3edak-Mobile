import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// business-get-booking-doctors
// -----------------------------------------------------------------------------
// NEW, dedicated endpoint for the RECEPTIONIST booking flow.
//
// Returns the doctors a receptionist may book with, each with the clinics that
// doctor is assigned to (doctor_clinic_access), falling back to clinics where the
// doctor has a recurring schedule. We do NOT surface every clinic in the company
// — only the ones this doctor actually has access to. Doctors are resolved from
// the receptionist's user_id via user_doctor_access (scoped to their company),
// then filtered to those that are active.
//
// Shape mirrors the existing booking doctor list so the UI can render the same
// kind of cards: { id, first_name, last_name, image_url, specialization,
// company_id, clinics: [{ id, name, address }] }.
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
    let companyId: string | null = null;
    let patientId: string | null = null;
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      userId = body.user_id?.trim() || body.userId?.trim() || null;
      companyId = body.company_id?.trim() || body.companyId?.trim() || null;
      patientId = body.patient_id?.trim() || body.patientId?.trim() || null;
    } else {
      const url = new URL(req.url);
      userId = url.searchParams.get("user_id");
      companyId = url.searchParams.get("company_id");
      patientId = url.searchParams.get("patient_id");
    }

    if (!userId) {
      return json({ success: false, error: "user_id is required" }, 400);
    }

    // 1) Doctors assigned to this receptionist (scoped to their company).
    let accessQuery = supabase
      .from("user_doctor_access")
      .select("doctor_id, company_id")
      .eq("user_id", userId);
    if (companyId) accessQuery = accessQuery.eq("company_id", companyId);

    const { data: accessRows, error: accessError } = await accessQuery;
    if (accessError) {
      console.error("user_doctor_access error:", accessError.message);
      return json({ success: false, error: "Failed to resolve assigned doctors" }, 500);
    }

    let assignedDoctorIds = [...new Set((accessRows || []).map((r: any) => r.doctor_id))];

    // 1b) When a patient is chosen, restrict to the doctors THAT PATIENT has
    // access to (patient_doctor_access) — a patient is only booked with their
    // own doctors, intersected with the receptionist's assigned doctors.
    if (patientId) {
      const { data: patientDoctorRows } = await supabase
        .from("patient_doctor_access")
        .select("doctor_id")
        .eq("patient_id", patientId);
      const patientDoctorIds = new Set((patientDoctorRows || []).map((r: any) => r.doctor_id));
      assignedDoctorIds = assignedDoctorIds.filter((id) => patientDoctorIds.has(id));
    }

    if (assignedDoctorIds.length === 0) {
      return json({ success: true, doctors: [] });
    }

    // 2) Keep only doctors that are active, live, and accept online booking.
    const { data: doctorsData, error: doctorsError } = await supabase
      .from("doctors")
      .select(`
        id,
        first_name,
        last_name,
        image_url,
        booking_online,
        is_active,
        company_id,
        doctor_specializations(name)
      `)
      // NOTE: no `booking_online` filter here. That flag gates PATIENT
      // self-booking; a receptionist is trusted staff and may book for any
      // assigned doctor regardless of the public online-booking toggle.
      .eq("is_deleted", false)
      .in("id", assignedDoctorIds);

    if (doctorsError) {
      console.error("doctors lookup error:", doctorsError.message);
      return json({ success: false, error: "Failed to fetch doctors", details: doctorsError.message }, 500);
    }

    const doctors: any[] = [];
    for (const doctor of doctorsData || []) {
      // Active flag may be null for legacy rows; treat null as active.
      if (doctor.is_active === false) continue;

      const clinicMap = new Map<string, { id: string; name: string; address: string }>();

      // 3a) The clinics this doctor is explicitly assigned to (doctor_clinic_access).
      // This is the authoritative set — a doctor only works at the clinics they
      // have access to, NOT every clinic in the company.
      const { data: clinicAccess } = await supabase
        .from("doctor_clinic_access")
        .select("clinic_id, clinics(id, name, address)")
        .eq("doctor_id", doctor.id);

      for (const row of clinicAccess || []) {
        if (row.clinics && !clinicMap.has(row.clinic_id)) {
          clinicMap.set(row.clinic_id, {
            id: row.clinics.id,
            name: row.clinics.name,
            address: row.clinics.address || "",
          });
        }
      }

      // 3b) Fallback: no explicit clinic-access rows — derive clinics from the
      // doctor's recurring schedules (also doctor-scoped, and still bookable).
      // `is_active` may be NULL on legacy rows, so filter in JS (NULL = active).
      if (clinicMap.size === 0) {
        const { data: scheduledClinics } = await supabase
          .from("doctor_recurring_schedules")
          .select("clinic_id, is_active, clinics(id, name, address)")
          .eq("doctor_id", doctor.id);

        for (const row of scheduledClinics || []) {
          if (row.is_active === false) continue;
          if (row.clinics && !clinicMap.has(row.clinic_id)) {
            clinicMap.set(row.clinic_id, {
              id: row.clinics.id,
              name: row.clinics.name,
              address: row.clinics.address || "",
            });
          }
        }
      }

      // Always include the doctor (even with no clinics at all).
      doctors.push({
        id: doctor.id,
        first_name: doctor.first_name,
        last_name: doctor.last_name,
        image_url: doctor.image_url,
        specialization: doctor.doctor_specializations?.name || "General",
        company_id: doctor.company_id,
        clinics: Array.from(clinicMap.values()),
      });
    }

    return json({ success: true, doctors });
  } catch (error: any) {
    console.error("Error in business-get-booking-doctors:", error);
    return json({ success: false, error: "Internal server error", details: error?.message || String(error) }, 500);
  }
});
