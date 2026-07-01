import { createClient } from 'npm:@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RequestBody {
  patientId: string;
  allowNotifications: boolean;
}

Deno.serve(async (req: Request) => {
  console.log('=== TOGGLE NOTIFICATIONS ===');

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

    const { patientId, allowNotifications }: RequestBody = await req.json();

    console.log('Request:', {
      patientId,
      allowNotifications,
    });

    if (!patientId || typeof allowNotifications !== 'boolean') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: patientId or allowNotifications',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // First get the patient to check if medical_id exists
    const { data: patientData, error: fetchError } = await supabase
      .from('user_patients')
      .select('medical_id')
      .eq('is_deleted', false)
      .eq('id', patientId)
      .maybeSingle();

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      throw fetchError;
    }

    if (!patientData) {
      console.error('Patient not found');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Patient not found',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Updating notification settings...');

    // If medical_id exists, update all accounts with the same medical_id
    // Otherwise, just update this specific patient
    const { data, error } = patientData.medical_id
      ? await supabase
          .from('user_patients')
          .update({ allow_notifications: allowNotifications })
          .eq('medical_id', patientData.medical_id)
          .select()
      : await supabase
          .from('user_patients')
          .update({ allow_notifications: allowNotifications })
          .eq('id', patientId)
          .select();

    if (error) {
      console.error('Update error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.error('No patient record found to update');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Patient record not found',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Successfully updated notification settings');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications ${allowNotifications ? 'enabled' : 'disabled'}`,
        updated_count: data.length,
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
        error: error.message || 'Failed to toggle notifications',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});