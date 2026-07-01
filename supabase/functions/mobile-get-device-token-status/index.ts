import { createClient } from 'npm:@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  console.log('=== GET DEVICE TOKEN STATUS ===');

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
    const fcmToken = url.searchParams.get('fcmToken');

    console.log('Query params:', {
      patientId,
      fcmToken: fcmToken?.substring(0, 30) + '...',
    });

    if (!patientId || !fcmToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters: patientId or fcmToken',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Fetching device token status...');
    const { data, error } = await supabase
      .from('device_tokens')
      .select('is_active')
      .eq('patient_id', patientId)
      .eq('fcm_token', fcmToken)
      .maybeSingle();

    if (error) {
      console.error('Query error:', error);
      throw error;
    }

    const isActive = data?.is_active ?? false;
    console.log('Device token status:', isActive);

    return new Response(
      JSON.stringify({
        success: true,
        is_active: isActive,
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
        error: error.message || 'Failed to get device token status',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});