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
    const { medicalId, global_id, company_id } = body;

    if (!medicalId) {
      return new Response(
        JSON.stringify({ error: "Medical ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Fetching doctor responses for:", { medicalId, global_id, company_id });

    // If company_id is provided, filter patient records by company
    let patientQuery = supabase
      .from("patients")
      .select("id, company_id")
      .eq("is_deleted", false)
      .eq("medical_id", medicalId);

    if (company_id) {
      patientQuery = patientQuery.eq("company_id", company_id);
    }

    const { data: patientRecords, error: patientError } = await patientQuery;

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

    const patientIds = patientRecords.map(p => p.id);

    const { data: questions, error: questionsError } = await supabase
      .from("patient_questions")
      .select(`
        id,
        question,
        response,
        status,
        created_at,
        answered_at,
        doctors:doctor_id (
          id,
          first_name,
          last_name,
          full_name
        )
      `)
      .in("patient_id", patientIds)
      .order("created_at", { ascending: false });

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch responses", details: questionsError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const formattedResponses = (questions || []).map(q => ({
      id: q.id,
      question: q.question,
      response: q.response || null,
      status: q.status || 'pending',
      doctor_name: q.doctors?.full_name || `${q.doctors?.first_name || ''} ${q.doctors?.last_name || ''}`.trim() || 'Unknown Doctor',
      created_at: q.created_at,
      answered_at: q.answered_at || null,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        responses: formattedResponses,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-doctor-responses:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
