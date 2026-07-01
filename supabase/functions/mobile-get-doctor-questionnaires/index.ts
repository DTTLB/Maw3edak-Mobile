import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface Question {
  id: string;
  questionnaire_id: string;
  question_text: string;
  field_type: string;
  options: any;
  is_required: boolean;
  order_index: number;
  created_at: string;
}

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
    const doctorId = url.searchParams.get('doctor_id');

    if (!doctorId) {
      return new Response(
        JSON.stringify({ error: 'doctor_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: questionnairesData, error: questionnairesError } = await supabase
      .from('questionnaires')
      .select(`
        id,
        title,
        description,
        doctor_id,
        created_at,
        updated_at,
        doctors!questionnaires_doctor_id_fkey(
          full_name,
          first_name,
          last_name
        )
      `)
      .eq('doctor_id', doctorId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (questionnairesError) {
      console.error('Error fetching questionnaires:', questionnairesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch questionnaires', details: questionnairesError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const questionnaires = [];

    for (const questionnaire of questionnairesData || []) {
      const { data: questions, error: questionsError } = await supabase
        .from('questionnaire_questions')
        .select('*')
        .eq('questionnaire_id', questionnaire.id)
        .order('order_index', { ascending: true });

      if (questionsError) {
        console.error('Error fetching questions for questionnaire:', questionnaire.id, questionsError);
        continue;
      }

      const doctorName = questionnaire.doctors?.full_name ||
                        `${questionnaire.doctors?.first_name || ''} ${questionnaire.doctors?.last_name || ''}`.trim() ||
                        'Unknown Doctor';

      questionnaires.push({
        id: questionnaire.id,
        title: questionnaire.title,
        description: questionnaire.description,
        doctor_id: questionnaire.doctor_id,
        doctor_name: doctorName,
        created_at: questionnaire.created_at,
        updated_at: questionnaire.updated_at,
        questions: questions || [],
      });
    }

    return new Response(
      JSON.stringify({ questionnaires }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in mobile-get-doctor-questionnaires:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
