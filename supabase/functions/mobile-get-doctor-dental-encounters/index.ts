import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const globalId = url.searchParams.get("global_id");
    const doctorId = url.searchParams.get("doctor_id");
    const patientMedicalId = url.searchParams.get("patient_medical_id");
    const companyId = url.searchParams.get("company_id");
    const encounterId = url.searchParams.get("encounter_id");

    if (!globalId) {
      return new Response(
        JSON.stringify({ error: "Global ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!doctorId || !patientMedicalId) {
      return new Response(
        JSON.stringify({ error: "Doctor ID and Patient Medical ID are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Fetching dental encounters - Doctor:", doctorId, "Patient:", patientMedicalId);

    // Get patient records by medical_id
    let patientQuery = supabase
      .from("patients")
      .select("id, company_id, full_name")
      .eq("is_deleted", false)
      .eq("medical_id", patientMedicalId);

    if (companyId) {
      patientQuery = patientQuery.eq("company_id", companyId);
    }

    const { data: patientRecords, error: patientError } = await patientQuery;

    if (patientError) {
      console.error("Patient lookup error:", patientError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch patient records", details: patientError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!patientRecords || patientRecords.length === 0) {
      console.log("No patient records found for medical_id:", patientMedicalId);
      return new Response(
        JSON.stringify({
          success: true,
          encounters: [],
          total_encounters: 0
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const patientName = patientRecords[0]?.full_name || '';
    const patientIds = patientRecords.map(p => p.id);

    console.log(`Found ${patientRecords.length} patient records`);

    // If encounter_id is provided, return specific encounter with treatments
    if (encounterId) {
      const { data: encounter, error: encounterError } = await supabase
        .from("encounters")
        .select(`
          id,
          started_at,
          notes,
          doctor_id,
          doctors:doctor_id (
            id,
            first_name,
            last_name,
            full_name,
            image_url
          )
        `)
        .eq("id", encounterId)
        .in("patient_id", patientIds)
        .eq("doctor_id", doctorId)
        .maybeSingle();

      if (encounterError || !encounter) {
        console.error("Encounter lookup error:", encounterError);
        return new Response(
          JSON.stringify({ error: "Encounter not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get treatments (encounter items) for this encounter with tooth images
      const { data: treatments, error: treatmentsError } = await supabase
        .from("encounter_item")
        .select(`
          id,
          diagnosis,
          treatment,
          notes,
          status,
          created_at,
          updated_at,
          tooth_id,
          service_id,
          tooth_definitions:tooth_id (
            id,
            tooth_number,
            tooth_name,
            image_url,
            arch,
            position
          ),
          dental_services:service_id (
            id,
            service_name,
            description
          )
        `)
        .eq("encounter_id", encounterId)
        .order("created_at", { ascending: false });

      if (treatmentsError) {
        console.error("Error fetching treatments:", treatmentsError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch treatments", details: treatmentsError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Format treatments with tooth images
      const formattedTreatments = (treatments || []).map(t => ({
        id: t.id,
        tooth_number: t.tooth_definitions?.tooth_number || 0,
        tooth_name: t.tooth_definitions?.tooth_name || '',
        tooth_image: t.tooth_definitions?.image_url,
        tooth_arch: t.tooth_definitions?.arch || '',
        tooth_position: t.tooth_definitions?.position || '',
        service_name: t.dental_services?.service_name || '',
        service_description: t.dental_services?.description || '',
        diagnosis: t.diagnosis || '',
        treatment: t.treatment || '',
        notes: t.notes || '',
        status: t.status || 'planned',
        date: t.created_at,
        updated_at: t.updated_at,
      }));

      const doctorName = encounter.doctors?.full_name ||
                        `${encounter.doctors?.first_name || ''} ${encounter.doctors?.last_name || ''}`.trim() ||
                        'Unknown Doctor';

      return new Response(
        JSON.stringify({
          success: true,
          encounter: {
            id: encounter.id,
            date: encounter.started_at,
            notes: encounter.notes || '',
            doctor: {
              id: encounter.doctors?.id || '',
              name: doctorName,
              image: encounter.doctors?.image_url,
            },
          },
          treatments: formattedTreatments,
          total_treatments: formattedTreatments.length,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get doctor information from doctors table
    const { data: doctorProfile, error: doctorError } = await supabase
      .from("doctors")
      .select(`
        id,
        full_name,
        first_name,
        last_name,
        doctor_specializations(name)
      `)
      .eq("is_deleted", false)
      .eq("id", doctorId)
      .maybeSingle();

    if (doctorError || !doctorProfile) {
      console.error("Doctor lookup error:", doctorError);
      return new Response(
        JSON.stringify({ error: "Doctor not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const doctorName = doctorProfile.full_name ||
                      `${doctorProfile.first_name || ''} ${doctorProfile.last_name || ''}`.trim() ||
                      'Unknown Doctor';
    const doctorSpecialization = doctorProfile.doctor_specializations?.name || 'Dentist';

    // Fetch encounters for this doctor and patient
    const { data: encounters, error: encountersError } = await supabase
      .from("encounters")
      .select(`
        id,
        started_at,
        notes
      `)
      .in("patient_id", patientIds)
      .eq("doctor_id", doctorId)
      .order("started_at", { ascending: false });

    if (encountersError) {
      console.error("Error fetching encounters:", encountersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch encounters", details: encountersError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${encounters?.length || 0} encounters`);

    // Get encounter items (treatments) for each encounter
    const encountersWithDetails = await Promise.all(
      (encounters || []).map(async (encounter) => {
        // Get first encounter item for summary
        const { data: firstItem } = await supabase
          .from("encounter_item")
          .select("diagnosis, treatment, notes")
          .eq("encounter_id", encounter.id)
          .limit(1)
          .single();

        return {
          id: encounter.id,
          encounter_date: encounter.started_at,
          chief_complaint: firstItem?.diagnosis || 'Dental consultation',
          diagnosis: firstItem?.diagnosis || '',
          treatment_provided: firstItem?.treatment || '',
          notes: encounter.notes || firstItem?.notes || null,
          doctor_id: doctorId,
          doctor_name: doctorName,
          doctor_specialization: doctorSpecialization,
          patient_name: patientName,
          patient_medical_id: patientMedicalId,
          created_at: encounter.started_at,
        };
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        encounters: encountersWithDetails,
        total_encounters: encountersWithDetails.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-doctor-dental-encounters:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
