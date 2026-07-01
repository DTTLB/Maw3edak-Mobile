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
    const userType = url.searchParams.get("user_type");

    console.log("Getting primary settings for:", { globalId, userType });

    // For doctors, get settings from users table with is_primary_company = true
    if (userType === "doctor") {
      if (!globalId) {
        return new Response(
          JSON.stringify({ error: "Global ID is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: primaryUser, error: userError } = await supabase
        .from("users")
        .select("biometric_login, lock_method, allow_notifications, darkmode")
        .eq("is_deleted", false)
        .eq("global_id", globalId)
        .eq("is_primary_company", true)
        .eq("is_active", true)
        .maybeSingle();

      if (userError) {
        console.error("Error fetching primary user settings:", userError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch settings", details: userError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!primaryUser) {
        return new Response(
          JSON.stringify({ error: "Primary company not found for this user" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          biometric_login_enabled: primaryUser.biometric_login ?? false,
          lock_method: primaryUser.lock_method ?? null,
          allow_notifications: primaryUser.allow_notifications ?? true,
          darkmode: primaryUser.darkmode ?? false,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // For patients, get settings from user_patients table (no primary company concept for patients)
    const medicalId = url.searchParams.get("medical_id");
    if (!medicalId) {
      return new Response(
        JSON.stringify({ error: "Medical ID is required for patients" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // A medical_id can map to MULTIPLE user_patients rows (one per company), and
    // mobile-update-darkmode/etc. write the same value to all of them. Using
    // .maybeSingle() here would throw on >1 row and 500, so we fetch the first
    // row instead — all rows carry the same settings value.
    const { data: patientRows, error: patientError } = await supabase
      .from("user_patients")
      .select("biometric_login_enabled, lock_method, allow_notifications, darkmode")
      .eq("is_deleted", false)
      .eq("medical_id", medicalId)
      .limit(1);

    if (patientError) {
      console.error("Error fetching patient settings:", patientError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch settings", details: patientError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const patient = patientRows?.[0];

    if (!patient) {
      return new Response(
        JSON.stringify({ error: "Patient not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        biometric_login_enabled: patient.biometric_login_enabled ?? false,
        lock_method: patient.lock_method ?? null,
        allow_notifications: patient.allow_notifications ?? true,
        darkmode: patient.darkmode ?? false,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-primary-settings:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
