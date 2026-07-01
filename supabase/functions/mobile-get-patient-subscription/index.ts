import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log("mobile-get-patient-subscription called");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // --- Authenticate the patient via their custom session token ------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        JSON.stringify({ error: "Invalid or expired token", details: sessionError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new Date(sessionData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Token has expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Resolve the patient's medical_id (subscriptions are keyed by it) ----
    const { data: patientData, error: patientError } = await supabase
      .from("user_patients")
      .select("medical_id")
      .eq("is_deleted", false)
      .eq("id", sessionData.patient_id)
      .maybeSingle();

    if (patientError || !patientData?.medical_id) {
      return new Response(
        JSON.stringify({ error: "Patient not found", details: patientError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Load subscriptions, newest expiry first ----------------------------
    const { data: subs, error: subsError } = await supabase
      .from("patient_subscriptions")
      .select("id, start_date, end_date, is_active, subscription_plan_id")
      .eq("medical_id", patientData.medical_id)
      .order("end_date", { ascending: false });

    if (subsError) {
      console.error("Subscription lookup error:", subsError.message);
      return new Response(
        JSON.stringify({ error: "Failed to load subscription", details: subsError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rows = subs || [];
    const now = Date.now();
    const isValid = (s: any) =>
      !!s.is_active && !!s.end_date && new Date(s.end_date).getTime() > now;

    // Prefer a currently-valid subscription; otherwise show the most recent so
    // an expired plan still surfaces in the UI.
    const chosen = rows.find(isValid) || rows[0] || null;

    if (!chosen) {
      return new Response(
        JSON.stringify({ success: true, subscription: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("name, description, price, type")
      .eq("id", chosen.subscription_plan_id)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          ...chosen,
          plan: plan || null,
          isActive: isValid(chosen),
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in mobile-get-patient-subscription:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
