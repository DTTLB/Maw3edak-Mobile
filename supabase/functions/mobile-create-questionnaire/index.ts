import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { title, description, doctor_id, company_id, questions } = await req.json();

    if (!title || !doctor_id || !company_id) {
      return new Response(
        JSON.stringify({ error: 'title, doctor_id, and company_id are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create questionnaire
    const { data: questionnaire, error: questionnaireError } = await supabase
      .from('questionnaires')
      .insert({
        title,
        description: description || null,
        doctor_id,
        company_id,
        is_active: true,
      })
      .select()
      .single();

    if (questionnaireError) {
      console.error('Error creating questionnaire:', questionnaireError);
      return new Response(
        JSON.stringify({ error: 'Failed to create questionnaire', details: questionnaireError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Add questions if provided
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const questionInserts = questions.map((q: any, index: number) => ({
        questionnaire_id: questionnaire.id,
        question_text: q.question_text,
        field_type: q.field_type,
        options: q.options || null,
        is_required: q.is_required || false,
        order_index: q.order_index !== undefined ? q.order_index : index,
      }));

      const { error: questionsError } = await supabase
        .from('questionnaire_questions')
        .insert(questionInserts);

      if (questionsError) {
        console.error('Error creating questions:', questionsError);
        // Rollback questionnaire if questions fail
        await supabase.from('questionnaires').delete().eq('id', questionnaire.id);
        return new Response(
          JSON.stringify({ error: 'Failed to create questions', details: questionsError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Fetch the complete questionnaire with questions
    const { data: completeQuestionnaire, error: fetchError } = await supabase
      .from('questionnaires')
      .select(`
        *,
        questionnaire_questions (*)
      `)
      .eq('id', questionnaire.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete questionnaire:', fetchError);
    }

    return new Response(
      JSON.stringify({
        questionnaire: completeQuestionnaire || questionnaire,
        message: 'Questionnaire created successfully'
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in mobile-create-questionnaire:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
