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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const { data: sessionData, error: sessionError } = await supabase
      .from("user_patient_sessions")
      .select("patient_id, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (sessionError || !sessionData) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (new Date(sessionData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Token has expired" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: patientData, error: fetchError } = await supabase
      .from("user_patients")
      .select("id, profile_image, first_name, last_name, email, medical_id, phone, date_of_birth, gender, blood_type, address")
      .eq("is_deleted", false)
      .eq("id", sessionData.patient_id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching patient profile:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch patient profile", details: fetchError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!patientData) {
      return new Response(
        JSON.stringify({ error: "Patient profile not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: patientData.id,
          profile_image_url: patientData.profile_image,
          first_name: patientData.first_name,
          last_name: patientData.last_name,
          email: patientData.email,
          medical_id: patientData.medical_id,
          phone: patientData.phone,
          date_of_birth: patientData.date_of_birth,
          gender: patientData.gender,
          blood_type: patientData.blood_type,
          address: patientData.address,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile_load_user_profile_image:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
