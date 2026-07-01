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
    const doctorId = url.searchParams.get("doctor_id");
    const companyId = url.searchParams.get("company_id");

    if (!doctorId) {
      return new Response(
        JSON.stringify({ error: "Doctor ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get all questionnaires for this doctor
    let questionnairesQuery = supabase
      .from("questionnaires")
      .select("id, title")
      .eq("doctor_id", doctorId);

    if (companyId) {
      questionnairesQuery = questionnairesQuery.eq("company_id", companyId);
    }

    const { data: questionnaires, error: questionnairesError } = await questionnairesQuery;

    if (questionnairesError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch questionnaires", details: questionnairesError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!questionnaires || questionnaires.length === 0) {
      return new Response(
        JSON.stringify({ success: true, answers: [] }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const questionnaireIds = questionnaires.map(q => q.id);

    // Get all assignments and responses for these questionnaires
    let assignmentsQuery = supabase
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
      .in("questionnaire_id", questionnaireIds)
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    const { data: assignments, error: assignmentsError } = await assignmentsQuery;

    if (assignmentsError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch assignments", details: assignmentsError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get all responses for these assignments
    const assignmentIds = (assignments || []).map(a => a.id);

    if (assignmentIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, answers: [] }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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
        created_at,
        questions!inner (
          id,
          question_text,
          field_type,
          order_index
        )
      `)
      .in("questionnaire_id", questionnaireIds);

    if (responsesError) {
      console.error("Error fetching responses:", responsesError);
    }

    // Group responses by assignment
    const formattedAnswers = (assignments || []).map(assignment => {
      const patientResponses = (responses || []).filter(
        r => r.patient_id === assignment.patient_id && r.questionnaire_id === assignment.questionnaire_id
      );

      const formattedResponses = patientResponses
        .sort((a, b) => (a.questions?.order_index || 0) - (b.questions?.order_index || 0))
        .map(r => {
          let responseValue = null;

          if (r.response_text !== null) responseValue = r.response_text;
          else if (r.response_number !== null) responseValue = r.response_number;
          else if (r.response_date !== null) responseValue = r.response_date;
          else if (r.response_boolean !== null) responseValue = r.response_boolean ? 'Yes' : 'No';
          else if (r.response_file_url !== null) responseValue = r.response_file_url;

          return {
            question_id: r.question_id,
            question_text: r.questions?.question_text || '',
            field_type: r.questions?.field_type || 'text',
            response: responseValue,
          };
        });

      return {
        assignment_id: assignment.id,
        questionnaire_id: assignment.questionnaire_id,
        questionnaire_title: assignment.questionnaires?.title || '',
        patient_id: assignment.patient_id,
        patient_medical_id: assignment.patients?.medical_id || '',
        patient_name: assignment.patients?.full_name || '',
        patient_phone: assignment.patients?.phone || '',
        status: assignment.status,
        completed_at: assignment.completed_at,
        responses: formattedResponses,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        answers: formattedAnswers,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-patient-answers:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
