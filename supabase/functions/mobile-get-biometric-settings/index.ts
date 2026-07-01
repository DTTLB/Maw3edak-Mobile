import { createClient } from 'npm:@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  console.log('=== GET BIOMETRIC SETTINGS ===');

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
    const patientId = url.searchParams.get('patientId');

    console.log('Query params:', { patientId });

    if (!patientId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameter: patientId',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Fetching biometric settings...');
    const { data, error } = await supabase
      .from('user_patients')
      .select('biometric_login_enabled, lock_method')
      .eq('is_deleted', false)
      .eq('id', patientId)
      .maybeSingle();

    if (error) {
      console.error('Query error:', error);
      throw error;
    }

    const settings = {
      biometric_login_enabled: data?.biometric_login_enabled ?? false,
      lock_method: data?.lock_method ?? null,
    };

    console.log('Biometric settings:', settings);

    return new Response(
      JSON.stringify({
        success: true,
        ...settings,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to get biometric settings',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});