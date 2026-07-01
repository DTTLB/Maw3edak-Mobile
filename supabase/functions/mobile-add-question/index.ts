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

    const {
      questionnaire_id,
      question_text,
      field_type,
      options,
      is_required,
      order_index
    } = await req.json();

    if (!questionnaire_id || !question_text || !field_type) {
      return new Response(
        JSON.stringify({ error: 'questionnaire_id, question_text, and field_type are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // If order_index not provided, get the max order_index and add 1
    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined) {
      const { data: maxQuestion } = await supabase
        .from('questionnaire_questions')
        .select('order_index')
        .eq('questionnaire_id', questionnaire_id)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

      finalOrderIndex = maxQuestion ? maxQuestion.order_index + 1 : 0;
    }

    const { data: question, error: insertError } = await supabase
      .from('questionnaire_questions')
      .insert({
        questionnaire_id,
        question_text,
        field_type,
        options: options || null,
        is_required: is_required || false,
        order_index: finalOrderIndex,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding question:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to add question', details: insertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update questionnaire updated_at
    await supabase
      .from('questionnaires')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', questionnaire_id);

    return new Response(
      JSON.stringify({
        question,
        message: 'Question added successfully'
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in mobile-add-question:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
