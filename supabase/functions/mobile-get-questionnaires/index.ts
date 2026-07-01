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

    console.log("=== QUESTIONNAIRE FETCH START ===");
    console.log("Medical ID:", medicalId);

    if (!medicalId) {
      return new Response(
        JSON.stringify({ error: "Medical ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: patientRecords, error: patientError } = await supabase
      .from("patients")
      .select("id, company_id")
      .eq("is_deleted", false)
      .eq("medical_id", medicalId);

    console.log("Patient lookup result:", {
      found: patientRecords?.length || 0,
      error: patientError?.message,
      patientIds: patientRecords?.map(p => p.id)
    });

    if (patientError || !patientRecords || patientRecords.length === 0) {
      console.log("ERROR: Patient not found in patients table for medical_id:", medicalId);
      return new Response(
        JSON.stringify({ error: "Patient not found", medicalId }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const patientIds = patientRecords.map(p => p.id);
    const companyIds = patientRecords.map(p => p.company_id);

    const { data: assignments, error: assignmentsError } = await supabase
      .from("patient_questionnaire_assignments")
      .select(`
        questionnaire_id,
        status,
        assigned_at,
        questionnaires:questionnaire_id (
          id,
          title,
          description,
          created_at,
          doctors:doctor_id (
            id,
            first_name,
            last_name,
            full_name
          )
        )
      `)
      .in("patient_id", patientIds)
      .order("assigned_at", { ascending: false });

    console.log("Assignments query result:", {
      count: assignments?.length || 0,
      error: assignmentsError?.message,
      assignments: assignments
    });

    if (assignmentsError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch questionnaire assignments", details: assignmentsError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const formattedQuestionnaires = await Promise.all(
      (assignments || []).map(async (assignment) => {
        const q = assignment.questionnaires;
        if (!q) return null;

        const { data: questions } = await supabase
          .from("questionnaire_questions")
          .select("*")
          .eq("questionnaire_id", q.id)
          .order("order_index", { ascending: true });

        const { data: responses } = await supabase
          .from("patient_questionnaire_responses")
          .select("*")
          .eq("questionnaire_id", q.id)
          .in("patient_id", patientIds);

        const totalQuestions = questions?.length || 0;
        const answeredQuestions = new Set(
          responses?.map((r) => r.question_id) || []
        ).size;

        const status = assignment.status === 'completed' ? 'answered' : 'pending';

        return {
          id: q.id,
          title: q.title,
          description: q.description,
          doctor_name: q.doctors?.full_name || `${q.doctors?.first_name || ''} ${q.doctors?.last_name || ''}`.trim() || 'Unknown Doctor',
          created_at: q.created_at,
          status: status,
          total_questions: totalQuestions,
          answered_questions: answeredQuestions,
          questions: questions || [],
          responses: responses || [],
        };
      })
    );

    const filteredQuestionnaires = formattedQuestionnaires.filter(q => q !== null);

    return new Response(
      JSON.stringify({
        success: true,
        questionnaires: filteredQuestionnaires,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-questionnaires:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
