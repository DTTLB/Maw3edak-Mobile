import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { resolveAccessUserIds } from "../_shared/resolve-access.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const globalId = url.searchParams.get("global_id");
    const companyId = url.searchParams.get("company_id");

    if (!globalId) {
      return new Response(
        JSON.stringify({ error: "global_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Today appointments params:', { globalId, companyId });

    // Step 1: Resolve user_ids from `global_id` (doctor global_id OR receptionist
    // user_id UUID), scoped to company if provided.
    const { userIds } = await resolveAccessUserIds(supabase, globalId, companyId);

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Get all doctor access records for these user IDs
    const { data: doctorAccessList, error: accessError } = await supabase
      .from('user_doctor_access')
      .select('doctor_id')
      .in('user_id', userIds);

    if (accessError || !doctorAccessList || doctorAccessList.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No doctor access found' }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const accessibleDoctorIds = doctorAccessList.map((access: any) => access.doctor_id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        notes,
        patients:patient_id (
          id,
          first_name,
          last_name,
          phone,
          date_of_birth,
          medical_id
        ),
        doctors:doctor_id (
          id,
          first_name,
          last_name
        ),
        clinics:clinic_id (
          id,
          name
        )
      `)
      .eq('appointment_date', todayStr)
      .ilike('status', 'scheduled')
      .in('doctor_id', accessibleDoctorIds)
      .order('appointment_time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch appointments', details: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const formattedAppointments = await Promise.all((appointments || []).map(async (apt: any) => {
      const timeStr = apt.appointment_time;
      let formattedTime = timeStr;

      if (timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        formattedTime = `${displayHour}:${minutes} ${ampm}`;
      }

      // Calculate age from date_of_birth
      let patientAge = null;
      if (apt.patients?.date_of_birth) {
        const birthDate = new Date(apt.patients.date_of_birth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        patientAge = age;
      }

      // Get profile image from user_patients table
      let profileImage = null;
      if (apt.patients?.medical_id) {
        const { data: userPatient } = await supabase
          .from('user_patients')
          .select('profile_image')
          .eq('is_deleted', false)
          .eq('medical_id', apt.patients.medical_id)
          .maybeSingle();

        if (userPatient?.profile_image) {
          const { data: publicUrlData } = supabase.storage
            .from('patient-profiles')
            .getPublicUrl(userPatient.profile_image);

          profileImage = publicUrlData.publicUrl + '?t=' + new Date().getTime();
        }
      }

      return {
        id: apt.id,
        patientName: `${apt.patients?.first_name || ''} ${apt.patients?.last_name || ''}`.trim() || 'Unknown Patient',
        patientPhone: apt.patients?.phone || '',
        patientAge: patientAge,
        profileImage: profileImage,
        doctorName: apt.doctors ? `Dr. ${apt.doctors.first_name || ''} ${apt.doctors.last_name || ''}`.trim() : '',
        clinicName: apt.clinics?.name || '',
        type: apt.status.charAt(0).toUpperCase() + apt.status.slice(1),
        time: formattedTime,
        notes: apt.notes || '',
      };
    }));

    return new Response(
      JSON.stringify({ appointments: formattedAppointments }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in get-doctor-today-appointments:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error?.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
