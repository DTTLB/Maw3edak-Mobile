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

    const url = new URL(req.url);
    const questionId = url.searchParams.get('question_id');

    if (!questionId) {
      return new Response(
        JSON.stringify({ error: 'question_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get questionnaire_id before deleting
    const { data: question } = await supabase
      .from('questionnaire_questions')
      .select('questionnaire_id')
      .eq('id', questionId)
      .single();

    const { error: deleteError } = await supabase
      .from('questionnaire_questions')
      .delete()
      .eq('id', questionId);

    if (deleteError) {
      console.error('Error deleting question:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete question', details: deleteError.message }),
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
        message: 'Question deleted successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in mobile-delete-question:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
