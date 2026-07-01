import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// business-get-patient-overview
// -----------------------------------------------------------------------------
// NEW, dedicated endpoint for the RECEPTIONIST patient-details screen. Returns
// the patient's clinical "extras" that sit alongside their profile/appointments:
//
//   • medical_records — allergies, emergency contacts, conditions, surgeries
//     (read-only; patients manage these from the patient mobile app). Keyed by
//     the patient's medical_id; empty lists when the patient has no medical_id.
//   • packages — the patient's PURCHASED packages (patient_packages) with each
//     bundled service's total / used / remaining session counts, computed from
//     package_services.sessions_count minus package_usage_log.used_sessions.
//
// Invoices are intentionally NOT returned here — the client reuses the existing
// business-get-statement endpoint (filtered by patient_id) for those.
//
// Authorization mirrors business-get-patient: the patient must be linked
// (patient_doctor_access) to a doctor the receptionist is assigned to
// (user_doctor_access). Otherwise 403.
//
// Request (POST body or GET query): { user_id, patient_id, company_id? }
// Response: { success, medical_records, packages }
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

const num = (v: unknown) => Number(v ?? 0) || 0;

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

    // ---- Authorize: receptionist's doctors ∩ patient's doctors must overlap --
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

    // Resolve the patient's medical_id (medical records are keyed off it).
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id, medical_id")
      .eq("is_deleted", false)
      .eq("id", patientId)
      .maybeSingle();

    if (patientError || !patient) {
      return json({ success: false, error: "Patient not found", details: patientError?.message }, 404);
    }

    const medicalId = patient.medical_id || null;

    // ---- Medical records (read-only) ----------------------------------------
    let allergies: any[] = [];
    let emergencyContacts: any[] = [];
    let conditions: any[] = [];
    let surgeries: any[] = [];

    if (medicalId) {
      const [allergiesRes, contactsRes, conditionsRes, surgeriesRes] = await Promise.all([
        supabase.from("allergies").select("*").eq("medical_id", medicalId).eq("is_active", true),
        supabase.from("emergency_contacts").select("*").eq("medical_id", medicalId).eq("is_active", true),
        supabase.from("conditions").select("*").eq("medical_id", medicalId).eq("is_active", true),
        supabase.from("surgeries").select("*").eq("medical_id", medicalId).eq("is_active", true),
      ]);
      allergies = allergiesRes.data || [];
      emergencyContacts = contactsRes.data || [];
      conditions = conditionsRes.data || [];
      surgeries = surgeriesRes.data || [];
    }

    // ---- Purchased packages with remaining sessions -------------------------
    const { data: patientPackages } = await supabase
      .from("patient_packages")
      .select(`
        id,
        buy_date,
        packages ( id, name, price )
      `)
      .eq("patient_id", patientId)
      .order("buy_date", { ascending: false });

    const packages = await Promise.all(
      (patientPackages || []).map(async (pp: any) => {
        const pkg = pp.packages || {};

        const { data: packageServices } = await supabase
          .from("package_services")
          .select(`
            sessions_count,
            service_id,
            services ( id, name )
          `)
          .eq("package_id", pkg.id);

        const services = await Promise.all(
          (packageServices || []).map(async (ps: any) => {
            const { data: usageData } = await supabase
              .from("package_usage_log")
              .select("used_sessions")
              .eq("patient_package_id", pp.id)
              .eq("service_id", ps.service_id);

            const usedSessions = (usageData || []).reduce(
              (sum: number, item: any) => sum + num(item.used_sessions),
              0
            );
            const totalSessions = num(ps.sessions_count);

            return {
              service_id: ps.services?.id || "",
              service_name: ps.services?.name || "",
              total_sessions: totalSessions,
              used_sessions: usedSessions,
              remaining_sessions: totalSessions - usedSessions,
            };
          })
        );

        const totalSessions = services.reduce((s: number, x: any) => s + x.total_sessions, 0);
        const remainingSessions = services.reduce((s: number, x: any) => s + x.remaining_sessions, 0);

        return {
          patient_package_id: pp.id,
          package_id: pkg.id || "",
          package_name: pkg.name || "",
          buy_date: pp.buy_date || null,
          price: num(pkg.price),
          services,
          total_sessions: totalSessions,
          remaining_sessions: remainingSessions,
        };
      })
    );

    return json({
      success: true,
      medical_records: {
        allergies,
        emergency_contacts: emergencyContacts,
        conditions,
        surgeries,
      },
      packages,
    });
  } catch (error: any) {
    console.error("Error in business-get-patient-overview:", error);
    return json({ success: false, error: "Internal server error", details: error?.message || String(error) }, 500);
  }
});
