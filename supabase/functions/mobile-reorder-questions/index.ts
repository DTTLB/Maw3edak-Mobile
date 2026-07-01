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

    const { questionnaire_id, questions } = await req.json();

    if (!questionnaire_id || !questions || !Array.isArray(questions)) {
      return new Response(
        JSON.stringify({ error: 'questionnaire_id and questions array are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update each question's order_index
    const updatePromises = questions.map((q: any, index: number) => {
      return supabase
        .from('questionnaire_questions')
        .update({ order_index: index })
        .eq('id', q.id)
        .eq('questionnaire_id', questionnaire_id);
    });

    const results = await Promise.all(updatePromises);

    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Errors reordering questions:', errors);
      return new Response(
        JSON.stringify({ error: 'Failed to reorder some questions', details: errors }),
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
        message: 'Questions reordered successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in mobile-reorder-questions:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
