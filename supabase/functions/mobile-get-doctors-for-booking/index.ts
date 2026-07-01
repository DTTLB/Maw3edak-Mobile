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

    const { medicalId } = await req.json().catch(() => ({ medicalId: null }));

    // medicalId is OPTIONAL. When provided we scope the doctors to the patient's
    // own assigned doctors (patient self-booking). When absent (e.g. a
    // receptionist/staff booking screen with no patient context), we return ALL
    // bookable doctors instead of nothing.
    let companyIds: string[] | null = null;   // null = no company restriction
    let doctorIds: string[] | null = null;    // null = all doctors

    if (medicalId) {
      const { data: patientRecords } = await supabase
        .from('patients')
        .select('id, company_id')
        .eq('is_deleted', false)
        .eq('medical_id', medicalId);

      if (!patientRecords || patientRecords.length === 0) {
        return new Response(
          JSON.stringify({ success: true, doctors: [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const patientIds = patientRecords.map((p: any) => p.id);
      companyIds = [...new Set(patientRecords.map((p: any) => p.company_id))];

      const { data: doctorAccessData } = await supabase
        .from('patient_doctor_access')
        .select('doctor_id')
        .in('patient_id', patientIds);

      if (!doctorAccessData || doctorAccessData.length === 0) {
        return new Response(
          JSON.stringify({ success: true, doctors: [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      doctorIds = [...new Set(doctorAccessData.map((d: any) => d.doctor_id))];
    }

    // Doctors that have at least one active recurring schedule (otherwise there
    // are no bookable slots). Scoped to the patient's doctors when applicable.
    let schedulesQuery = supabase
      .from('doctor_recurring_schedules')
      .select('doctor_id')
      .eq('is_active', true);
    if (doctorIds) schedulesQuery = schedulesQuery.in('doctor_id', doctorIds);

    const { data: doctorsWithSchedules } = await schedulesQuery;

    if (!doctorsWithSchedules || doctorsWithSchedules.length === 0) {
      return new Response(
        JSON.stringify({ success: true, doctors: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const doctorIdsWithSchedules = [...new Set(doctorsWithSchedules.map((d: any) => d.doctor_id))];

    let doctorsQuery = supabase
      .from('doctors')
      .select(`
        id,
        first_name,
        last_name,
        image_url,
        booking_online,
        is_active,
        company_id,
        doctor_specializations(name)
      `)
      .eq('is_deleted', false)
      .in('id', doctorIdsWithSchedules)
      .eq('booking_online', true);
    if (companyIds) doctorsQuery = doctorsQuery.in('company_id', companyIds);

    const { data: doctorsData } = await doctorsQuery;

    const uniqueDoctors = new Map();

    for (const doctor of doctorsData || []) {
      if (!uniqueDoctors.has(doctor.id)) {
        // Get clinics where the doctor has active recurring schedules
        const { data: scheduledClinicsData } = await supabase
          .from('doctor_recurring_schedules')
          .select('clinic_id, clinics(id, name, address)')
          .eq('doctor_id', doctor.id)
          .eq('is_active', true);

        // Get unique clinics
        const clinicMap = new Map();
        for (const schedule of scheduledClinicsData || []) {
          if (schedule.clinics && !clinicMap.has(schedule.clinic_id)) {
            clinicMap.set(schedule.clinic_id, {
              id: schedule.clinics.id,
              name: schedule.clinics.name,
              address: schedule.clinics.address || '',
            });
          }
        }

        const clinics = Array.from(clinicMap.values());

        // Only add doctor if they have at least one clinic with schedules
        if (clinics.length > 0) {
          uniqueDoctors.set(doctor.id, {
            id: doctor.id,
            first_name: doctor.first_name,
            last_name: doctor.last_name,
            image_url: doctor.image_url,
            specialization: doctor.doctor_specializations?.name || 'General',
            clinics: clinics,
          });
        }
      }
    }

    const doctors = Array.from(uniqueDoctors.values());

    return new Response(
      JSON.stringify({ success: true, doctors }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});