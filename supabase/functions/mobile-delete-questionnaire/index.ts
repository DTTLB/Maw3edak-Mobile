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
    const questionnaireId = url.searchParams.get('questionnaire_id');

    if (!questionnaireId) {
      return new Response(
        JSON.stringify({ error: 'questionnaire_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Delete questions first (cascade should handle this, but being explicit)
    const { error: questionsError } = await supabase
      .from('questionnaire_questions')
      .delete()
      .eq('questionnaire_id', questionnaireId);

    if (questionsError) {
      console.error('Error deleting questions:', questionsError);
    }

    // Delete questionnaire
    const { error: deleteError } = await supabase
      .from('questionnaires')
      .delete()
      .eq('id', questionnaireId);

    if (deleteError) {
      console.error('Error deleting questionnaire:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete questionnaire', details: deleteError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: 'Questionnaire deleted successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in mobile-delete-questionnaire:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
