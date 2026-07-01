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
    const { medicalId, questionnaireId, responses } = body;

    if (!medicalId || !questionnaireId || !responses || !Array.isArray(responses)) {
      return new Response(
        JSON.stringify({ error: "Medical ID, questionnaire ID, and responses array are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from("patient_questionnaire_assignments")
      .select(`
        patient_id,
        patients!inner(medical_id)
      `)
      .eq("questionnaire_id", questionnaireId)
      .eq("patients.medical_id", medicalId)
      .single();

    if (assignmentError || !assignment) {
      return new Response(
        JSON.stringify({ error: "Questionnaire assignment not found for this patient" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const patientId = assignment.patient_id;

    const { error: deleteError } = await supabase
      .from("patient_questionnaire_responses")
      .delete()
      .eq("questionnaire_id", questionnaireId)
      .eq("patient_id", patientId);

    if (deleteError) {
      console.error("Error deleting old responses:", deleteError);
    }

    const responseRecords = responses.map((r: any) => {
      const record: any = {
        questionnaire_id: questionnaireId,
        patient_id: patientId,
        question_id: r.questionId,
        response_text: null,
        response_number: null,
        response_date: null,
        response_boolean: null,
        response_file_url: null,
      };

      switch (r.fieldType) {
        case 'text':
        case 'textarea':
        case 'dropdown':
          record.response_text = r.value;
          break;
        case 'number':
          record.response_number = parseFloat(r.value);
          break;
        case 'date':
          record.response_date = r.value;
          break;
        case 'boolean':
          record.response_boolean = r.value === true || r.value === 'true';
          break;
        case 'file':
          record.response_file_url = r.value;
          break;
      }

      return record;
    });

    const { data: insertedResponses, error: insertError } = await supabase
      .from("patient_questionnaire_responses")
      .insert(responseRecords)
      .select();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: "Failed to submit responses", details: insertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: updateError } = await supabase
      .from("patient_questionnaire_assignments")
      .update({
        status: "completed",
        completed_at: new Date().toISOString()
      })
      .eq("questionnaire_id", questionnaireId)
      .eq("patient_id", patientId);

    if (updateError) {
      console.error("Error updating assignment status:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Responses submitted successfully",
        responses: insertedResponses,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-submit-questionnaire:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});