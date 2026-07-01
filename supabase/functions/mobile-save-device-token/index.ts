import { createClient } from 'npm:@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RequestBody {
  patientId: string;
  medicalId: string;
  fcmToken: string;
  platform: string;
  deviceModel?: string;
  appVersion?: string;
}

Deno.serve(async (req: Request) => {
  console.log('=== SAVE DEVICE TOKEN FUNCTION ===');
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
    const { patientId, medicalId, fcmToken, platform, deviceModel, appVersion }: RequestBody = JSON.parse(body);

    console.log('Request data:', {
      patientId,
      medicalId,
      fcmToken: fcmToken?.substring(0, 40) + '...',
      platform,
      deviceModel,
      appVersion
    });

    if (!patientId || !medicalId || !fcmToken || !platform) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: patientId, medicalId, fcmToken, or platform',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const isExpoToken = fcmToken.startsWith('ExponentPushToken[');
    const deviceModelValue = deviceModel || 'Unknown';

    console.log('=== MULTI-DEVICE MODE: UPSERTING CURRENT DEVICE ===');
    console.log('Patient ID:', patientId);
    console.log('Medical ID:', medicalId);
    console.log('Token Type:', isExpoToken ? 'Expo Token' : 'FCM Token');
    console.log('Token Preview:', fcmToken?.substring(0, 40) + '...');
    console.log('Platform:', platform);
    console.log('Device Model:', deviceModelValue);

    console.log('=== UPSERT DEVICE TOKEN (NO DEACTIVATION) ===');

    const { data: upsertData, error: upsertError } = await supabase.rpc('upsert_device_token', {
      p_patient_id: patientId,
      p_medical_id: medicalId,
      p_fcm_token: fcmToken,
      p_platform: platform,
      p_device_model: deviceModelValue,
      p_app_version: appVersion || null,
    });

    if (upsertError) {
      console.error('❌ RPC function not found, falling back to manual upsert');

      const { data: existingToken } = await supabase
        .from('device_tokens')
        .select('id')
        .eq('patient_id', patientId)
        .eq('fcm_token', fcmToken)
        .maybeSingle();

      if (existingToken) {
        console.log('=== TOKEN EXISTS - UPDATING ===');
        const { data: updateData, error: updateError } = await supabase
          .from('device_tokens')
          .update({
            medical_id: medicalId,
            platform,
            device_model: deviceModelValue,
            app_version: appVersion,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingToken.id)
          .select();

        if (updateError) throw updateError;

        console.log('✅ Device token updated');
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Device token updated (multi-device mode).',
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
            patient_id: patientId,
            medical_id: medicalId,
            fcm_token: fcmToken,
            platform,
            device_model: deviceModelValue,
            app_version: appVersion,
            is_active: true,
          })
          .select();

        if (insertError) throw insertError;

        console.log('✅ Device token inserted');
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Device token saved (multi-device mode).',
            action: 'inserted',
            data: insertData,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    console.log('✅ Device token upserted via RPC');
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Device token saved (multi-device mode).',
        action: 'upserted',
        data: upsertData,
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