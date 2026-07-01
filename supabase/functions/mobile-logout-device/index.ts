import { createClient } from 'npm:@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RequestBody {
  fcmToken: string;
}

Deno.serve(async (req: Request) => {
  console.log('=== LOGOUT DEVICE TOKEN FUNCTION ===');
  console.log('Method:', req.method);

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

    const body = await req.text();
    const { fcmToken }: RequestBody = JSON.parse(body);

    console.log('Request data:', {
      fcmToken: fcmToken?.substring(0, 40) + '...',
    });

    if (!fcmToken) {
      console.error('Missing FCM token');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required field: fcmToken',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('=== DEACTIVATING CURRENT DEVICE ONLY ===');
    console.log('FCM Token:', fcmToken?.substring(0, 40) + '...');

    const { error: deactivateError } = await supabase
      .from('device_tokens')
      .update({ is_active: false })
      .eq('fcm_token', fcmToken);

    if (deactivateError) {
      console.error('❌ Error deactivating device:', deactivateError);
      throw deactivateError;
    }

    console.log('✅ Device token deactivated successfully');
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Device logged out successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('=== CRITICAL ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to logout device',
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
