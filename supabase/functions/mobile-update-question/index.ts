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
      question_id,
      question_text,
      field_type,
      options,
      is_required,
      order_index
    } = await req.json();

    if (!question_id) {
      return new Response(
        JSON.stringify({ error: 'question_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const updateData: any = {};
    if (question_text !== undefined) updateData.question_text = question_text;
    if (field_type !== undefined) updateData.field_type = field_type;
    if (options !== undefined) updateData.options = options;
    if (is_required !== undefined) updateData.is_required = is_required;
    if (order_index !== undefined) updateData.order_index = order_index;

    const { data: question, error: updateError } = await supabase
      .from('questionnaire_questions')
      .update(updateData)
      .eq('id', question_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating question:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update question', details: updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update questionnaire updated_at
    if (question) {
      await supabase
        .from('questionnaires')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', question.questionnaire_id);
    }

    return new Response(
      JSON.stringify({
        question,
        message: 'Question updated successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in mobile-update-question:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
