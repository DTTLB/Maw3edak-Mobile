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
    const doctorId = url.searchParams.get("doctor_id");
    const clinicId = url.searchParams.get("clinic_id");
    const status = url.searchParams.get("status");
    const dateFrom = url.searchParams.get("date_from");
    const dateTo = url.searchParams.get("date_to");
    const medicalId = url.searchParams.get("medical_id");

    if (!globalId) {
      return new Response(
        JSON.stringify({ error: "global_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Resolve user_ids from `global_id`, which may be a doctor global_id OR a
    // receptionist user_id (UUID). Scoped to the current company if provided.
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

    // Get accessible doctor IDs for these users
    const { data: doctorAccessList, error: accessError } = await supabase
      .from('user_doctor_access')
      .select('doctor_id')
      .in('user_id', userIds);

    if (accessError || !doctorAccessList || doctorAccessList.length === 0) {
      return new Response(
        JSON.stringify({ appointments: [], companies: [], doctors: [], clinics: [], statuses: [] }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const accessibleDoctorIds = doctorAccessList.map((access: any) => access.doctor_id);

    // Build query with filters
    let query = supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        end_date,
        end_time,
        duration,
        status,
        notes,
        is_custom,
        created_at,
        updated_at,
        company_id,
        patients:patient_id (
          id,
          first_name,
          last_name,
          phone,
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
        ),
        companies:company_id (
          id,
          name
        ),
        services:service_id (
          id,
          name,
          description,
          price,
          duration_minutes
        ),
        rooms:room_id (
          id,
          room_number,
          room_type,
          floor
        )
      `)
      .in('doctor_id', accessibleDoctorIds);

    // Apply filters
    if (companyId && companyId !== 'all') {
      query = query.eq('company_id', companyId);
    }
    if (doctorId && doctorId !== 'all') {
      query = query.eq('doctor_id', doctorId);
    }
    if (clinicId && clinicId !== 'all') {
      query = query.eq('clinic_id', clinicId);
    }
    if (status && status !== 'all') {
      query = query.ilike('status', status);
    }
    if (dateFrom) {
      query = query.gte('appointment_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('appointment_date', dateTo);
    }
    if (medicalId) {
      const { data: patientRows } = await supabase
        .from('patients')
        .select('id')
        .eq('is_deleted', false)
        .eq('medical_id', medicalId);
      const patientIds = (patientRows || []).map((p: any) => p.id);
      if (patientIds.length === 0) {
        return new Response(
          JSON.stringify({ appointments: [], filters: { companies: [], doctors: [], clinics: [], statuses: [] } }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      query = query.in('patient_id', patientIds);
    }

    query = query.order('appointment_date', { ascending: false })
                 .order('appointment_time', { ascending: false });

    const { data: appointments, error } = await query;

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

    // Get filter options from ALL appointments (not filtered by date)
    // This ensures filters show all available options regardless of current date selection
    const { data: allAppointments } = await supabase
      .from('appointments')
      .select(`
        company_id,
        doctor_id,
        clinic_id,
        status,
        companies:company_id (id, name),
        doctors:doctor_id (id, first_name, last_name),
        clinics:clinic_id (id, name)
      `)
      .in('doctor_id', accessibleDoctorIds);

    // Also get all accessible doctors even if they don't have appointments
    const { data: accessibleDoctors } = await supabase
      .from('doctors')
      .select('id, first_name, last_name')
      .eq('is_deleted', false)
      .in('id', accessibleDoctorIds);

    // Extract unique filter options
    const companiesMap = new Map();
    const doctorsMap = new Map();
    const clinicsMap = new Map();
    const statusesSet = new Set();

    // Add all accessible doctors to the filter (even without appointments)
    (accessibleDoctors || []).forEach((doctor: any) => {
      doctorsMap.set(doctor.id, {
        id: doctor.id,
        name: `Dr. ${doctor.first_name} ${doctor.last_name}`
      });
    });

    (allAppointments || []).forEach((apt: any) => {
      if (apt.companies) {
        companiesMap.set(apt.companies.id, apt.companies);
      }
      if (apt.doctors) {
        doctorsMap.set(apt.doctors.id, {
          id: apt.doctors.id,
          name: `Dr. ${apt.doctors.first_name} ${apt.doctors.last_name}`
        });
      }
      if (apt.clinics) {
        clinicsMap.set(apt.clinics.id, apt.clinics);
      }
      if (apt.status) {
        statusesSet.add(apt.status);
      }
    });

    const formattedAppointments = (appointments || []).map((apt: any) => {
      const timeStr = apt.appointment_time;
      let formattedTime = timeStr;

      if (timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        formattedTime = `${displayHour}:${minutes} ${ampm}`;
      }

      let formattedEndTime = apt.end_time;
      if (apt.end_time) {
        const [eh, em] = apt.end_time.split(':');
        const ehNum = parseInt(eh);
        const eampm = ehNum >= 12 ? 'PM' : 'AM';
        const edisplay = ehNum === 0 ? 12 : ehNum > 12 ? ehNum - 12 : ehNum;
        formattedEndTime = `${edisplay}:${em} ${eampm}`;
      }

      return {
        id: apt.id,
        patientName: `${apt.patients?.first_name || ''} ${apt.patients?.last_name || ''}`.trim() || 'Unknown Patient',
        patientPhone: apt.patients?.phone || '',
        medicalId: apt.patients?.medical_id || '',
        doctorName: apt.doctors ? `Dr. ${apt.doctors.first_name || ''} ${apt.doctors.last_name || ''}`.trim() : '',
        doctorId: apt.doctors?.id || '',
        clinicName: apt.clinics?.name || '',
        clinicId: apt.clinics?.id || '',
        companyName: apt.companies?.name || '',
        companyId: apt.companies?.id || '',
        status: apt.status,
        date: apt.appointment_date,
        time: formattedTime,
        endDate: apt.end_date || '',
        endTime: formattedEndTime || '',
        duration: apt.duration || '',
        notes: apt.notes || '',
        isCustom: apt.is_custom || false,
        createdAt: apt.created_at || '',
        serviceName: apt.services?.name || '',
        serviceDescription: apt.services?.description || '',
        servicePrice: apt.services?.price ?? null,
        serviceDuration: apt.services?.duration_minutes ?? null,
        roomNumber: apt.rooms?.room_number || '',
        roomType: apt.rooms?.room_type || '',
        roomFloor: apt.rooms?.floor ?? null,
      };
    });

    return new Response(
      JSON.stringify({
        appointments: formattedAppointments,
        filters: {
          companies: Array.from(companiesMap.values()),
          doctors: Array.from(doctorsMap.values()),
          clinics: Array.from(clinicsMap.values()),
          statuses: Array.from(statusesSet)
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in get-doctor-all-appointments:", error);
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
