import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { isUuid } from "../_shared/resolve-access.ts";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // A patient/doctor who deleted their account is anonymized (not removed) when
    // clinical/financial records must be retained: name -> "Deleted User",
    // email -> deleted-<...>@deleted.invalid, phone -> deleted-<...>. Such rows
    // must never appear in a doctor's patient list.
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

    const url = new URL(req.url);
    const globalId = url.searchParams.get("global_id");
    const companyId = url.searchParams.get("company_id");
    const doctorId = url.searchParams.get("doctor_id");

    if (!globalId) {
      return new Response(
        JSON.stringify({ error: "global_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Doctor patients params:', { globalId, companyId, doctorId });

    let patients;

    if (doctorId) {
      // Filter patients by specific doctor through patient_doctor_access
      const { data: patientsData, error: patientsError } = await supabase
        .from("patient_doctor_access")
        .select(`
          patients!inner(
            id,
            medical_id,
            first_name,
            last_name
          )
        `)
        .eq("doctor_id", doctorId)
        // Exclude soft-deleted patients from the doctor's patient list.
        .eq("patients.is_deleted", false);

      if (patientsError) {
        console.error("Error fetching patients for doctor:", patientsError);
        return new Response(
          JSON.stringify({
            error: "Failed to fetch patients",
            details: patientsError.message
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      patients = (patientsData?.map((item: any) => ({
        medical_id: item.patients.medical_id,
        full_name: `${item.patients.first_name} ${item.patients.last_name}`,
      })) || []).filter((p: any) => !isAnonymized(p));
    } else {
      // Get all patients for doctors the user has access to. `global_id` may be
      // a doctor global_id OR a receptionist user_id (UUID) — route accordingly.
      const rpcArgs = isUuid(globalId)
        ? { p_global_id: null, p_company_id: companyId || null, p_user_id: globalId }
        : { p_global_id: globalId, p_company_id: companyId || null };

      const { data: patientsData, error: patientsError } = await supabase.rpc(
        "get_doctor_patients",
        rpcArgs
      );

      if (patientsError) {
        console.error("Error fetching doctor patients:", patientsError);
        return new Response(
          JSON.stringify({
            error: "Failed to fetch patients",
            details: patientsError.message
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      patients = (patientsData || []).filter((p: any) => !isAnonymized(p));
    }

    return new Response(
      JSON.stringify({ patients }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in get-doctor-patients:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error?.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});