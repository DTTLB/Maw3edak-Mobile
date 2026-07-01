import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { specializationId } = await req.json();

    const { data: specializations, error: specializationsError } = await supabase
      .from('doctor_specializations')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (specializationsError) {
      console.error('Error fetching specializations:', specializationsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch specializations', details: specializationsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let doctorsQuery = supabase
      .from('doctors')
      .select(`
        id,
        first_name,
        last_name,
        full_name,
        email,
        phone,
        whatsapp_number,
        allow_whatsapp_chat,
        image_url,
        specialization_id,
        doctor_specializations (
          id,
          name
        )
      `)
      .eq('is_deleted', false)
      .eq('is_active', true)
      .eq('show_on_landing_page', true)
      .order('full_name');

    if (specializationId && specializationId !== 'all') {
      doctorsQuery = doctorsQuery.eq('specialization_id', specializationId);
    }

    const { data: doctors, error: doctorsError } = await doctorsQuery;

    if (doctorsError) {
      console.error('Error fetching doctors:', doctorsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch doctors', details: doctorsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const doctorIds = (doctors || []).map((d: any) => d.id);

    let clinicsData = [];
    if (doctorIds.length > 0) {
      const { data: clinicAccess, error: clinicAccessError } = await supabase
        .from('doctor_clinic_access')
        .select(`
          doctor_id,
          clinics (
            id,
            name,
            address,
            phone,
            is_active
          )
        `)
        .in('doctor_id', doctorIds)
        .eq('clinics.is_active', true);

      if (clinicAccessError) {
        console.error('Error fetching clinic access:', clinicAccessError);
      } else {
        clinicsData = clinicAccess || [];
      }
    }

    const doctorsWithClinics = (doctors || []).map((doctor: any) => {
      const doctorClinics = clinicsData
        .filter((ca: any) => ca.doctor_id === doctor.id && ca.clinics !== null)
        .map((ca: any) => ca.clinics);

      return {
        id: doctor.id,
        name: doctor.full_name || `${doctor.first_name} ${doctor.last_name}`,
        first_name: doctor.first_name,
        last_name: doctor.last_name,
        email: doctor.email,
        phone: doctor.phone,
        whatsapp_number: doctor.whatsapp_number,
        allow_whatsapp_chat: doctor.allow_whatsapp_chat,
        image: doctor.image_url,
        specialization: doctor.doctor_specializations?.name || 'General',
        specialization_id: doctor.specialization_id,
        clinics: doctorClinics,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        specializations: specializations || [],
        doctors: doctorsWithClinics,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in mobile-get-all-doctors:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});