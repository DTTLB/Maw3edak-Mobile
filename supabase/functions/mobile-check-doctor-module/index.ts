import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { medicalId } = body;

    if (!medicalId) {
      return new Response(
        JSON.stringify({ error: "Medical ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Checking doctor modules for medical_id:", medicalId);

    // 1. Get ALL patient records across ALL companies using medical_id
    const { data: patientRecords, error: patientError } = await supabase
      .from("patients")
      .select("id, company_id")
      .eq("is_deleted", false)
      .eq("medical_id", medicalId);

    if (patientError) {
      console.error("Patient lookup error:", patientError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch patient records", details: patientError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!patientRecords || patientRecords.length === 0) {
      console.log("No patient records found for medical_id:", medicalId);
      return new Response(
        JSON.stringify({ error: "Patient not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const patientIds = patientRecords.map((p) => p.id);

    // 2. Get the doctors that have access to this patient, and 3. their
    //    specialization -> module via doctor_specializations.
    const { data: doctorAccess, error: accessError } = await supabase
      .from("patient_doctor_access")
      .select(`
        doctor_id,
        patient_id,
        doctors:doctor_id (
          id,
          first_name,
          last_name,
          full_name,
          specialization_id,
          doctor_specializations:specialization_id(name, module)
        )
      `)
      .in("patient_id", patientIds);

    if (accessError) {
      console.error("Error fetching doctor access:", accessError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch doctors", details: accessError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build the per-doctor breakdown (deduplicated by doctor id)
    const uniqueDoctorsMap = new Map();

    (doctorAccess || []).forEach((access: any) => {
      const doctor = access.doctors;
      if (doctor && !uniqueDoctorsMap.has(doctor.id)) {
        uniqueDoctorsMap.set(doctor.id, {
          id: doctor.id,
          full_name: doctor.full_name || `${doctor.first_name || ""} ${doctor.last_name || ""}`.trim(),
          specialization: doctor.doctor_specializations?.name || null,
          module: doctor.doctor_specializations?.module || null,
        });
      }
    });

    const doctors = Array.from(uniqueDoctorsMap.values());

    // Distinct, non-null modules derived from the linked doctors' specializations.
    const specializationModules = new Set(
      doctors
        .map((d) => d.module)
        .filter((m): m is string => Boolean(m))
    );

    // Also include a module when the patient actually has records for it, even if
    // no linked doctor carries that specialization. Records can be created by a
    // doctor of a different specialization (e.g. a Dentist logging a nutrition
    // assessment), so specialization alone would otherwise hide a module that has
    // real data behind it. The final list is the union of both signals.
    const MODULE_TABLES: Record<string, string[]> = {
      nutrition: [
        "nutrition_assessment",
        "nutrition_goal",
        "body_measurement",
        "nutrition_follow_up",
        "patient_meal_plan",
        "nutrition_documents",
      ],
      eye: ["eye_tests", "eyeglass_prescriptions", "patient_eye_history"],
      dental: ["encounters"],
    };

    const hasRecords = async (table: string): Promise<boolean> => {
      try {
        const { count, error } = await supabase
          .from(table)
          .select("id", { count: "exact", head: true })
          .in("patient_id", patientIds);
        if (error) {
          console.warn(`Module data check failed for ${table}:`, error.message);
          return false;
        }
        return (count ?? 0) > 0;
      } catch (e) {
        console.warn(`Module data check threw for ${table}:`, e);
        return false;
      }
    };

    const dataModules = await Promise.all(
      Object.entries(MODULE_TABLES).map(async ([module, tables]) => {
        const results = await Promise.all(tables.map((t) => hasRecords(t)));
        return results.some(Boolean) ? module : null;
      })
    );

    const modules = Array.from(
      new Set([
        ...specializationModules,
        ...dataModules.filter((m): m is string => Boolean(m)),
      ])
    );

    console.log(
      `medical_id ${medicalId}: ${doctors.length} doctor(s), ` +
        `specialization modules: [${Array.from(specializationModules).join(", ")}], ` +
        `final modules (incl. data): [${modules.join(", ")}]`
    );

    return new Response(
      JSON.stringify({
        success: true,
        medicalId,
        modules,
        doctors,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-check-doctor-module:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
