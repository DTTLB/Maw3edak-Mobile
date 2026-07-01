import { createClient } from 'npm:@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RequestBody {
  patientId?: string;
  medicalId?: string;
  biometricEnabled: boolean;
  lockMethod: string | null;
}

Deno.serve(async (req: Request) => {
  console.log('=== UPDATE BIOMETRIC SETTINGS ===');

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

    const { patientId, medicalId, biometricEnabled, lockMethod }: RequestBody = await req.json();

    console.log('Request:', {
      patientId,
      medicalId,
      biometricEnabled,
      lockMethod,
    });

    if ((!patientId && !medicalId) || typeof biometricEnabled !== 'boolean') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: patientId or medicalId, and biometricEnabled',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // If medicalId is provided, get it; otherwise get it from patientId
    let targetMedicalId = medicalId;
    if (!targetMedicalId && patientId) {
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

      targetMedicalId = patientData.medical_id;
    }

    console.log('Updating biometric settings...');

    // If medical_id exists, update all accounts with the same medical_id
    // Otherwise, just update this specific patient
    const { data, error } = targetMedicalId
      ? await supabase
          .from('user_patients')
          .update({
            biometric_login_enabled: biometricEnabled,
            lock_method: lockMethod,
            updated_at: new Date().toISOString(),
          })
          .eq('medical_id', targetMedicalId)
          .select()
      : await supabase
          .from('user_patients')
          .update({
            biometric_login_enabled: biometricEnabled,
            lock_method: lockMethod,
            updated_at: new Date().toISOString(),
          })
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

    console.log('Successfully updated biometric settings');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Biometric authentication ${biometricEnabled ? 'enabled' : 'disabled'}`,
        data: data[0],
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
        error: error.message || 'Failed to update biometric settings',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});