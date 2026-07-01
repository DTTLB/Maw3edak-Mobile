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

    const {
      questionnaire_id,
      doctor_id,
      patient_medical_ids,
      company_id,
    } = await req.json();

    if (!questionnaire_id || !doctor_id || !patient_medical_ids || patient_medical_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Unassigning questionnaire:', {
      questionnaire_id,
      doctor_id,
      patient_medical_ids,
      company_id,
    });

    // Get patient IDs from medical IDs (filtered by company_id to avoid duplicates)
    let query = supabase
      .from("patients")
      .select("id")
      .eq("is_deleted", false)
      .in("medical_id", patient_medical_ids);

    // Filter by company_id if provided
    if (company_id) {
      query = query.eq("company_id", company_id);
    }

    const { data: patients, error: patientsError } = await query;

    if (patientsError) {
      console.error("Error fetching patients:", patientsError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch patients",
          details: patientsError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!patients || patients.length === 0) {
      return new Response(
        JSON.stringify({ error: "No patients found with provided medical IDs" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const patientIds = patients.map((p) => p.id);

    // Delete assignments
    const { error: deleteError } = await supabase
      .from("patient_questionnaire_assignments")
      .delete()
      .eq("questionnaire_id", questionnaire_id)
      .eq("doctor_id", doctor_id)
      .in("patient_id", patientIds);

    if (deleteError) {
      console.error("Error deleting assignments:", deleteError);
      return new Response(
        JSON.stringify({
          error: "Failed to unassign questionnaire",
          details: deleteError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Assignments removed successfully for', patientIds.length, 'patients');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Questionnaire unassigned from ${patientIds.length} patient(s)`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in unassign-questionnaire:", error);
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
