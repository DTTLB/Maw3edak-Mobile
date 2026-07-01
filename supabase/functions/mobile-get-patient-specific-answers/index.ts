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
    const patientId = url.searchParams.get("patient_id");
    const doctorId = url.searchParams.get("doctor_id");
    const companyId = url.searchParams.get("company_id");

    if (!questionnaireId || !patientId || !doctorId) {
      return new Response(
        JSON.stringify({ error: "Questionnaire ID, Patient ID, and Doctor ID are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the specific assignment
    let assignmentQuery = supabase
      .from("patient_questionnaire_assignments")
      .select(`
        id,
        questionnaire_id,
        patient_id,
        status,
        assigned_at,
        completed_at,
        patients!inner (
          id,
          medical_id,
          full_name,
          phone
        ),
        questionnaires!inner (
          id,
          title
        )
      `)
      .eq("questionnaire_id", questionnaireId)
      .eq("patient_id", patientId)
      .eq("doctor_id", doctorId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1);

    if (companyId) {
      assignmentQuery = assignmentQuery.eq("company_id", companyId);
    }

    const { data: assignments, error: assignmentError } = await assignmentQuery;

    if (assignmentError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch assignment", details: assignmentError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!assignments || assignments.length === 0) {
      return new Response(
        JSON.stringify({ success: true, answers: [] }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const assignment = assignments[0];

    // Get all questions for this questionnaire
    const { data: questions, error: questionsError } = await supabase
      .from("questionnaire_questions")
      .select("*")
      .eq("questionnaire_id", questionnaireId)
      .order("order_index", { ascending: true });

    if (questionsError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch questions", details: questionsError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get responses for this patient
    const { data: responses, error: responsesError } = await supabase
      .from("patient_questionnaire_responses")
      .select(`
        id,
        patient_id,
        questionnaire_id,
        question_id,
        response_text,
        response_number,
        response_date,
        response_boolean,
        response_file_url,
        created_at
      `)
      .eq("questionnaire_id", questionnaireId)
      .eq("patient_id", patientId);

    if (responsesError) {
      console.error("Error fetching responses:", responsesError);
    }

    const answer = {
      assignment_id: assignment.id,
      questionnaire_id: assignment.questionnaire_id,
      questionnaire_title: assignment.questionnaires?.title || '',
      patient_id: assignment.patient_id,
      patient_medical_id: assignment.patients?.medical_id || '',
      patient_name: assignment.patients?.full_name || '',
      patient_phone: assignment.patients?.phone || '',
      status: assignment.status,
      completed_at: assignment.completed_at,
      total_questions: questions?.length || 0,
      answered_questions: new Set(responses?.map(r => r.question_id) || []).size,
      questions: questions || [],
      responses: responses || [],
    };

    return new Response(
      JSON.stringify({
        success: true,
        answer: answer,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-patient-specific-answers:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
