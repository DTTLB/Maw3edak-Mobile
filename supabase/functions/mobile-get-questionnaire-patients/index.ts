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

    const url = new URL(req.url);
    const questionnaireId = url.searchParams.get("questionnaire_id");
    const doctorId = url.searchParams.get("doctor_id");
    const companyId = url.searchParams.get("company_id");

    if (!questionnaireId || !doctorId) {
      return new Response(
        JSON.stringify({ error: "Questionnaire ID and Doctor ID are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get patients who have completed assignments for this questionnaire from this doctor
    console.log("Fetching completed assignments for questionnaire:", questionnaireId);
    console.log("Doctor ID:", doctorId);
    console.log("Company ID:", companyId);

    let assignmentsQuery = supabase
      .from("patient_questionnaire_assignments")
      .select(`
        patient_id,
        completed_at,
        patients!inner (
          id,
          medical_id,
          full_name,
          phone,
          company_id
        )
      `)
      .eq("questionnaire_id", questionnaireId)
      .eq("doctor_id", doctorId)
      .eq("status", "completed");

    if (companyId) {
      assignmentsQuery = assignmentsQuery.eq("company_id", companyId);
    }

    const { data: assignments, error: assignmentsError } = await assignmentsQuery;

    console.log("Assignments fetched:", assignments?.length || 0);
    console.log("Assignments error:", assignmentsError);
    console.log("First assignment:", assignments?.[0]);

    if (assignmentsError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch patient assignments", details: assignmentsError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Format patient data uniquely
    const uniquePatients = new Map();

    (assignments || []).forEach(assignment => {
      const patient = assignment.patients;
      if (patient) {
        if (!uniquePatients.has(patient.id)) {
          uniquePatients.set(patient.id, {
            id: patient.id,
            medical_id: patient.medical_id,
            name: patient.full_name,
            phone: patient.phone,
            latest_completion: assignment.completed_at,
          });
        } else {
          // Update latest_completion if this assignment is newer
          const existing = uniquePatients.get(patient.id);
          if (assignment.completed_at && new Date(assignment.completed_at) > new Date(existing.latest_completion)) {
            existing.latest_completion = assignment.completed_at;
          }
        }
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        patients: Array.from(uniquePatients.values()),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-questionnaire-patients:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
