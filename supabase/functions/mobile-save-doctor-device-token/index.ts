import { createClient } from 'npm:@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RequestBody {
  userId: string;
  fcmToken: string;
  platform: string;
  deviceModel?: string;
  appVersion?: string;
}

Deno.serve(async (req: Request) => {
  console.log('=== SAVE DOCTOR DEVICE TOKEN FUNCTION ===');
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
    const { userId, fcmToken, platform, deviceModel, appVersion }: RequestBody = JSON.parse(body);

    console.log('Request data:', {
      userId,
      fcmToken: fcmToken?.substring(0, 40) + '...',
      platform,
      deviceModel,
      appVersion
    });

    if (!userId || !fcmToken || !platform) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: userId, fcmToken, or platform',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const isExpoToken = fcmToken.startsWith('ExponentPushToken[');
    console.log('Token type:', isExpoToken ? 'Expo Push Token (Development)' : 'FCM Token (Production)');

    // Get global_id from users table
    console.log('=== FETCHING DOCTOR GLOBAL_ID ===');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('global_id')
      .eq('is_deleted', false)
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user:', userError);
      throw userError;
    }

    if (!userData) {
      console.error('User not found');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User not found',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const globalId = userData.global_id;
    console.log('Global ID:', globalId);

    if (!globalId) {
      console.error('User has no global_id');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User has no global_id - not authorized for mobile access',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const deviceModelValue = deviceModel || 'Unknown';

    console.log('=== SINGLE DEVICE MODE: DEACTIVATING OLD DEVICES ===');
    console.log('User ID:', userId);
    console.log('New FCM Token:', fcmToken?.substring(0, 40) + '...');

    // Deactivate all other devices for this doctor
    const { error: deactivateError } = await supabase
      .from('device_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .neq('fcm_token', fcmToken);

    if (deactivateError) {
      console.error('❌ Error deactivating old devices:', deactivateError);
    } else {
      console.log('✅ Old devices deactivated');
    }

    console.log('=== UPSERT DOCTOR DEVICE TOKEN ===');

    // Check if token already exists
    const { data: existingToken } = await supabase
      .from('device_tokens')
      .select('id')
      .eq('user_id', userId)
      .eq('fcm_token', fcmToken)
      .maybeSingle();

    if (existingToken) {
      console.log('=== TOKEN EXISTS - UPDATING ===');
      const { data: updateData, error: updateError } = await supabase
        .from('device_tokens')
        .update({
          global_id: globalId,
          platform,
          device_model: deviceModelValue,
          app_version: appVersion,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingToken.id)
        .select();

      if (updateError) throw updateError;

      console.log('✅ Doctor device token updated');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Device token updated. Other devices deactivated.',
          action: 'updated',
          data: updateData,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      console.log('=== NEW TOKEN - INSERTING ===');
      const { data: insertData, error: insertError } = await supabase
        .from('device_tokens')
        .insert({
          user_id: userId,
          global_id: globalId,
          fcm_token: fcmToken,
          platform,
          device_model: deviceModelValue,
          app_version: appVersion,
          is_active: true,
        })
        .select();

      if (insertError) throw insertError;

      console.log('✅ Doctor device token inserted');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Device token saved. Other devices deactivated.',
          action: 'inserted',
          data: insertData,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('=== CRITICAL ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to save device token',
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});