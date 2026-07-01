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

    const body = await req.json();
    const { medicalId } = body;

    if (!medicalId) {
      return new Response(
        JSON.stringify({ error: "Medical ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Fetching patient records for medical_id:", medicalId);

    // Get ALL patient records across ALL companies using medical_id
    const { data: patientRecords, error: patientError } = await supabase
      .from("patients")
      .select("id, company_id")
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

    // Get doctors accessible to ALL these patient records across all companies
    const { data: doctorAccess, error: accessError } = await supabase
      .from("patient_doctor_access")
      .select(`
        doctor_id,
        patient_id,
        doctors:doctor_id (
          id,
          first_name,
          last_name,
          full_name,
          image_url,
          email,
          phone,
          specialization_id,
          doctor_specializations:specialization_id(name),
          companies(name)
        )
      `)
      .in("patient_id", patientIds);

    if (accessError) {
      console.error("Error fetching doctor access:", accessError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch doctors", details: accessError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract unique doctors with company info
    const uniqueDoctorsMap = new Map();
    
    (doctorAccess || []).forEach((access: any) => {
      const doctor = access.doctors;
      if (doctor && !uniqueDoctorsMap.has(doctor.id)) {
        uniqueDoctorsMap.set(doctor.id, {
          id: doctor.id,
          first_name: doctor.first_name,
          last_name: doctor.last_name,
          full_name: doctor.full_name || `${doctor.first_name} ${doctor.last_name}`,
          image_url: doctor.image_url,
          email: doctor.email,
          phone: doctor.phone,
          specialization: doctor.doctor_specializations?.name || 'N/A',
          company_name: doctor.companies?.name || 'N/A'
        });
      }
    });

    const doctors = Array.from(uniqueDoctorsMap.values());

    console.log(`Found ${doctors.length} unique doctors across all companies`);

    return new Response(
      JSON.stringify({
        success: true,
        doctors: doctors,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-patient-doctors:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
