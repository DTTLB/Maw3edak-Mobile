import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Session-Token",
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const sessionToken = req.headers.get("X-Session-Token");
    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: "Missing session token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Get doctor settings - Token received");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate custom session token from user_sessions table
    const { data: sessionData, error: sessionError } = await supabase
      .from("user_sessions")
      .select("user_id, expires_at")
      .eq("token", sessionToken)
      .maybeSingle();

    if (sessionError || !sessionData) {
      console.error("Session validation error:", sessionError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired session" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if session is expired
    const expiresAt = new Date(sessionData.expires_at);
    if (expiresAt < new Date()) {
      console.error("Session expired");
      return new Response(
        JSON.stringify({ error: "Session expired" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("=== GET DOCTOR SETTINGS ===");
    console.log("User ID:", sessionData.user_id);

    // Get user's global_id first
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("global_id")
      .eq("is_deleted", false)
      .eq("id", sessionData.user_id)
      .maybeSingle();

    if (userError || !userData) {
      console.error("User not found:", userError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get settings. Multi-company doctors keep settings on their primary-company
    // row (consistency across companies). Receptionists / single-company staff
    // have NO global_id, so read settings straight from their own row.
    const settingsSelect = "id, allow_notifications, lock_method, biometric_login, darkmode, language";
    const settingsBase = supabase
      .from("users")
      .select(settingsSelect)
      .eq("is_deleted", false);

    const { data: settingsData, error: settingsError } = await (
      userData.global_id
        ? settingsBase.eq("global_id", userData.global_id).eq("is_primary_company", true)
        : settingsBase.eq("id", sessionData.user_id)
    ).maybeSingle();

    console.log("Settings result:", { success: !settingsError, data: settingsData, error: settingsError });

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch settings",
          details: settingsError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!settingsData) {
      return new Response(
        JSON.stringify({
          error: "User not found",
          details: "User settings not found"
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        settings: {
          allow_notifications: settingsData.allow_notifications ?? true,
          lock_method: settingsData.lock_method || 'none',
          biometric_login: settingsData.biometric_login ?? false,
          darkmode: settingsData.darkmode ?? false,
          language: settingsData.language ?? 'en',
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-doctor-settings:", error);
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