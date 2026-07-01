import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPPORTED_LANGUAGES = ["en", "ar", "fr"];

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

    const { user_id, patient_id, language, user_type } = await req.json();

    if (!user_type || (user_type !== "doctor" && user_type !== "patient")) {
      return new Response(
        JSON.stringify({ error: "user_type must be 'doctor' or 'patient'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (typeof language !== "string" || !SUPPORTED_LANGUAGES.includes(language)) {
      return new Response(
        JSON.stringify({ error: "language must be one of: en, ar, fr" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (user_type === "doctor") {
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "user_id is required for doctors" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get the global_id for this doctor (regardless if they are primary or not)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("global_id")
        .eq("is_deleted", false)
        .eq("id", user_id)
        .maybeSingle();

      if (userError) {
        console.error("Error fetching user:", userError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch user", details: userError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!userData?.global_id) {
        return new Response(
          JSON.stringify({ error: "User not found or missing global_id" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Update ALL accounts with this global_id
      const { data: updateData, error: updateError } = await supabase
        .from("users")
        .update({ language })
        .eq("global_id", userData.global_id)
        .select("id");

      console.log("Updated language for", updateData?.length || 0, "doctor accounts");

      if (updateError) {
        console.error("Error updating language for doctor accounts:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update language", details: updateError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else if (user_type === "patient") {
      if (!patient_id) {
        return new Response(
          JSON.stringify({ error: "patient_id is required for patients" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get the medical_id for this patient
      const { data: patientData, error: patientError } = await supabase
        .from("user_patients")
        .select("medical_id")
        .eq("is_deleted", false)
        .eq("id", patient_id)
        .maybeSingle();

      if (patientError) {
        console.error("Error fetching patient:", patientError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch patient", details: patientError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!patientData?.medical_id) {
        return new Response(
          JSON.stringify({ error: "Patient not found or missing medical_id" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Update all accounts with the same medical_id
      const { error: updateError } = await supabase
        .from("user_patients")
        .update({ language })
        .eq("medical_id", patientData.medical_id);

      if (updateError) {
        console.error("Error updating patient language:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update language", details: updateError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, language }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-update-language:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
