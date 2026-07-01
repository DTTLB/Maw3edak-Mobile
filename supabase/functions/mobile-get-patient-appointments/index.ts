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
    const { userId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: userPatient, error: userError } = await supabase
      .from("user_patients")
      .select("medical_id")
      .eq("is_deleted", false)
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      console.error("User patient lookup error:", userError);
      return new Response(
        JSON.stringify({ error: "Database error", details: userError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!userPatient || !userPatient.medical_id) {
      console.log("User has no medical_id, returning empty appointments");
      return new Response(
        JSON.stringify({
          success: true,
          appointments: [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Found medical_id:", userPatient.medical_id);

    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        appointment_time,
        end_date,
        end_time,
        status,
        notes,
        duration,
        doctor_id,
        service_id,
        clinic_id,
        room_id,
        patient_id,
        doctors:doctor_id (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        clinics:clinic_id (
          id,
          name,
          address,
          phone
        ),
        patients:patient_id!inner (
          medical_id
        )
      `)
      .eq("patients.medical_id", userPatient.medical_id)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch appointments", details: appointmentsError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${appointments?.length || 0} appointments for patient`);

    return new Response(
      JSON.stringify({
        success: true,
        appointments: appointments || [],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-patient-appointments:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});