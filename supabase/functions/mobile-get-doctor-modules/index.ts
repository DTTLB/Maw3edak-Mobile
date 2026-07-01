import { createClient } from "npm:@supabase/supabase-js@2.58.0";
import { resolveAccessUserIds } from "../_shared/resolve-access.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const globalId = url.searchParams.get("global_id");
    const companyId = url.searchParams.get("company_id");

    if (!globalId) {
      return new Response(
        JSON.stringify({ error: "Missing global_id parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Resolve user_ids from `global_id` (doctor global_id OR receptionist
    // user_id UUID), optionally scoped to company.
    const { userIds } = await resolveAccessUserIds(supabase, globalId, companyId);

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Company scope for the per-doctor breakdown below.
    const { data: scopeUsers } = await supabase
      .from("users")
      .select("company_id")
      .in("id", userIds);
    const companyIds = (scopeUsers || []).map((u: any) => u.company_id);

    // Get the doctors this user has access to, with their specialization module
    const { data: doctorAccess, error: accessError } = await supabase
      .from("user_doctor_access")
      .select(`
        doctors:doctor_id (
          id,
          company_id,
          full_name,
          specialization_id,
          doctor_specializations:specialization_id (name, module)
        )
      `)
      .in("user_id", userIds);

    if (accessError) {
      console.error("Doctor access lookup error:", accessError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch accessible doctors" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Per-doctor breakdown (deduplicated by doctor id, scoped to the user's companies)
    const uniqueDoctorsMap = new Map();

    (doctorAccess || []).forEach((item: any) => {
      const doctor = item.doctors;
      if (
        doctor &&
        companyIds.includes(doctor.company_id) &&
        !uniqueDoctorsMap.has(doctor.id)
      ) {
        uniqueDoctorsMap.set(doctor.id, {
          id: doctor.id,
          full_name: doctor.full_name,
          specialization: doctor.doctor_specializations?.name || null,
          module: doctor.doctor_specializations?.module || null,
        });
      }
    });

    const doctors = Array.from(uniqueDoctorsMap.values());

    // Distinct, non-null modules derived from the doctors' specializations.
    const specializationModules = new Set(
      doctors
        .map((d) => d.module)
        .filter((m): m is string => Boolean(m))
    );

    // Also include a module when this doctor has actually created records for it,
    // even if their specialization doesn't carry that module. A doctor can author
    // data outside their listed specialization (e.g. a Dentist creating a nutrition
    // assessment), and specialization alone would otherwise hide a module they own.
    // The final list is the union of both signals. Each table is keyed by the
    // doctor column it uses (mostly doctor_id; nutrition_goal uses
    // created_by_doctor_id).
    const doctorIds = doctors.map((d) => d.id);
    const MODULE_TABLES: Record<string, [string, string][]> = {
      nutrition: [
        ["nutrition_assessment", "doctor_id"],
        ["nutrition_goal", "created_by_doctor_id"],
        ["body_measurement", "doctor_id"],
        ["nutrition_follow_up", "doctor_id"],
        ["patient_meal_plan", "doctor_id"],
        ["nutrition_documents", "doctor_id"],
      ],
      eye: [["eye_tests", "doctor_id"]],
      dental: [["encounters", "doctor_id"]],
    };

    const hasRecords = async (table: string, column: string): Promise<boolean> => {
      if (doctorIds.length === 0) return false;
      try {
        const { count, error } = await supabase
          .from(table)
          .select("id", { count: "exact", head: true })
          .in(column, doctorIds);
        if (error) {
          console.warn(`Module data check failed for ${table}.${column}:`, error.message);
          return false;
        }
        return (count ?? 0) > 0;
      } catch (e) {
        console.warn(`Module data check threw for ${table}.${column}:`, e);
        return false;
      }
    };

    const dataModules = await Promise.all(
      Object.entries(MODULE_TABLES).map(async ([module, tables]) => {
        const results = await Promise.all(tables.map(([t, c]) => hasRecords(t, c)));
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
      `global_id ${globalId}: ${doctors.length} doctor(s), ` +
        `specialization modules: [${Array.from(specializationModules).join(", ")}], ` +
        `final modules (incl. data): [${modules.join(", ")}]`
    );

    return new Response(
      JSON.stringify({
        success: true,
        modules,
        doctors,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
