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
      assigned_by_user_id,
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

    console.log('Assigning questionnaire:', {
      questionnaire_id,
      doctor_id,
      patient_medical_ids,
      company_id,
    });

    // Get patient IDs from medical IDs (filtered by company_id to avoid duplicates)
    let query = supabase
      .from("patients")
      .select("id, medical_id")
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

    // Check for existing assignments for these patients and this questionnaire
    const patientIds = patients.map(p => p.id);
    const { data: existingAssignments } = await supabase
      .from("patient_questionnaire_assignments")
      .select("patient_id")
      .eq("questionnaire_id", questionnaire_id)
      .in("patient_id", patientIds)
      .in("status", ["pending", "in_progress"]);

    const existingPatientIds = new Set(existingAssignments?.map(a => a.patient_id) || []);

    // Filter out patients who already have this questionnaire assigned
    const patientsToAssign = patients.filter(p => !existingPatientIds.has(p.id));

    if (patientsToAssign.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "All selected patients already have this questionnaire assigned",
          assignments: [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create assignments for each patient (only new ones)
    const assignments = patientsToAssign.map((patient) => ({
      company_id: company_id,
      patient_id: patient.id,
      questionnaire_id: questionnaire_id,
      doctor_id: doctor_id,
      assigned_by_user_id: assigned_by_user_id,
      medical_id: patient.medical_id,
      status: 'pending',
    }));

    const { data: assignmentData, error: assignmentError } = await supabase
      .from("patient_questionnaire_assignments")
      .insert(assignments)
      .select();

    if (assignmentError) {
      console.error("Error creating assignments:", assignmentError);
      return new Response(
        JSON.stringify({
          error: "Failed to assign questionnaire",
          details: assignmentError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Assignments created successfully:', assignmentData?.length);

    return new Response(
      JSON.stringify({
        success: true,
        assignments: assignmentData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in assign-questionnaire:", error);
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
