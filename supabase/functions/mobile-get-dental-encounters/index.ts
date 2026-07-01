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

    // For PATIENT requests - get data from request body
    const { medicalId, encounterId } = await req.json();

    if (!medicalId) {
      return new Response(
        JSON.stringify({ error: "Medical ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Fetching dental encounters for patient with medical_id:", medicalId);

    // Get ALL patient records across ALL companies using medical_id
    const { data: patientRecords, error: patientError } = await supabase
      .from("patients")
      .select("id, company_id, full_name")
      .eq("is_deleted", false)
      .eq("medical_id", medicalId);

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
      console.log("No patient records found for medical_id:", medicalId);
      return new Response(
        JSON.stringify({ error: "Patient not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${patientRecords.length} patient records across companies`);

    // Get all patient IDs
    const patientIds = patientRecords.map(p => p.id);

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
            image_url
          )
        `)
        .eq("id", encounterId)
        .in("patient_id", patientIds)
        .single();

      if (encounterError || !encounter) {
        return new Response(
          JSON.stringify({ error: "Encounter not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get treatments (encounter items) for this encounter
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

      // Format treatments
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

      return new Response(
        JSON.stringify({
          success: true,
          encounter: {
            id: encounter.id,
            date: encounter.started_at,
            notes: encounter.notes || '',
            doctor: {
              id: encounter.doctors?.id || '',
              name: `${encounter.doctors?.first_name || ''} ${encounter.doctors?.last_name || ''}`.trim(),
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

    // Return list of encounters for this patient across all doctors
    const { data: encounters, error: encountersError } = await supabase
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
          image_url
        )
      `)
      .in("patient_id", patientIds)
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

    // Get treatments count for each encounter
    const encountersWithTreatments = await Promise.all(
      (encounters || []).map(async (encounter) => {
        const { count } = await supabase
          .from("encounter_item")
          .select("*", { count: 'exact', head: true })
          .eq("encounter_id", encounter.id);

        return {
          id: encounter.id,
          date: encounter.started_at,
          notes: encounter.notes || '',
          doctor: {
            id: encounter.doctors?.id || '',
            name: `${encounter.doctors?.first_name || ''} ${encounter.doctors?.last_name || ''}`.trim(),
            image: encounter.doctors?.image_url,
          },
          treatments_count: count || 0,
        };
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        encounters: encountersWithTreatments,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-dental-encounters:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
