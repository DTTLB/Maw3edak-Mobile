import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Returns whether the patient-facing AI assistant should be shown, based on
// user_patients.ai_assistant. Uses the service role to bypass RLS, since
// patients authenticate with a custom session token (not Supabase Auth) and
// therefore cannot read user_patients directly with the anon key.
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const patientId = url.searchParams.get("patientId");

    if (!patientId) {
      return new Response(
        JSON.stringify({ error: "patientId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabase
      .from("user_patients")
      .select("ai_assistant")
      .eq("is_deleted", false)
      .eq("id", patientId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching ai_assistant:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch AI feature", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default to OFF: a missing patient keeps the AI feature hidden.
    return new Response(
      JSON.stringify({ success: true, ai_assistant: data?.ai_assistant === true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in mobile-get-ai-feature:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
