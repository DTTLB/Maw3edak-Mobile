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
    console.log("mobile-get-patient-medical-data called");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    console.log("Authorization header present:", !!authHeader);

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
    console.log("Token extracted, length:", token.length);

    const { data: sessionData, error: sessionError } = await supabase
      .from("user_patient_sessions")
      .select("patient_id, expires_at")
      .eq("token", token)
      .maybeSingle();

    console.log("Session lookup result:", { found: !!sessionData, error: sessionError });

    if (sessionError || !sessionData) {
      console.error("Session error:", sessionError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token", details: sessionError?.message }),
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

    const { data: patientData, error: patientError } = await supabase
      .from("user_patients")
      .select("medical_id")
      .eq("is_deleted", false)
      .eq("id", sessionData.patient_id)
      .maybeSingle();

    console.log("Patient lookup result:", { found: !!patientData, error: patientError });

    if (patientError || !patientData) {
      console.error("Patient error:", patientError);
      return new Response(
        JSON.stringify({ error: "Patient not found", details: patientError?.message }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const medicalId = patientData.medical_id;

    if (!medicalId) {
      console.log("Patient has no medical_id, returning empty lists");
      return new Response(
        JSON.stringify({
          success: true,
          allergies: [],
          emergency_contacts: [],
          conditions: [],
          surgeries: [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const [allergiesRes, emergencyContactsRes, conditionsRes, surgeriesRes] = await Promise.all([
      supabase.from("allergies").select("*").eq("medical_id", medicalId).eq("is_active", true),
      supabase.from("emergency_contacts").select("*").eq("medical_id", medicalId).eq("is_active", true),
      supabase.from("conditions").select("*").eq("medical_id", medicalId).eq("is_active", true),
      supabase.from("surgeries").select("*").eq("medical_id", medicalId).eq("is_active", true),
    ]);

    if (allergiesRes.error || emergencyContactsRes.error || conditionsRes.error || surgeriesRes.error) {
      console.error("Error fetching medical data:", {
        allergies: allergiesRes.error,
        emergency_contacts: emergencyContactsRes.error,
        conditions: conditionsRes.error,
        surgeries: surgeriesRes.error,
      });
      return new Response(
        JSON.stringify({
          error: "Failed to fetch medical data",
          details:
            allergiesRes.error?.message ||
            emergencyContactsRes.error?.message ||
            conditionsRes.error?.message ||
            surgeriesRes.error?.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Successfully fetched patient medical data");

    return new Response(
      JSON.stringify({
        success: true,
        allergies: allergiesRes.data ?? [],
        emergency_contacts: emergencyContactsRes.data ?? [],
        conditions: conditionsRes.data ?? [],
        surgeries: surgeriesRes.data ?? [],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-patient-medical-data:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
