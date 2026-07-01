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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    console.log("Update doctor security settings - Token received");

    const { data: sessionData, error: sessionError } = await supabase
      .from("user_sessions")
      .select("user_id, expires_at")
      .eq("token", sessionToken)
      .maybeSingle();

    console.log("Session lookup:", { found: !!sessionData, error: sessionError?.message });

    if (sessionError || !sessionData) {
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

    const { biometric_login, lock_method } = await req.json();

    console.log("=== UPDATE DOCTOR SECURITY SETTINGS ===");
    console.log("User ID:", sessionData.user_id);
    console.log("Biometric login:", biometric_login);
    console.log("Lock method:", lock_method);

    // Get current user to find their global_id
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("global_id")
      .eq("is_deleted", false)
      .eq("id", sessionData.user_id)
      .single();

    if (userError || !currentUser) {
      return new Response(
        JSON.stringify({
          error: "User not found",
          details: userError?.message
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Global ID:", currentUser.global_id);

    if (biometric_login !== undefined && typeof biometric_login !== 'boolean') {
      return new Response(
        JSON.stringify({ error: "biometric_login must be a boolean" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (lock_method !== undefined && !['none', 'pin', 'biometric'].includes(lock_method)) {
      return new Response(
        JSON.stringify({ error: "lock_method must be one of: none, pin, biometric" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const updateData: any = {};
    if (biometric_login !== undefined) {
      updateData.biometric_login = biometric_login;
    }
    if (lock_method !== undefined) {
      updateData.lock_method = lock_method;
    }

    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ error: "No settings to update" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Doctors: update ALL accounts sharing the global_id. Receptionists /
    // single-company staff have no global_id, so update just their own row.
    const { data: updatedData, error: updateError } = await (
      currentUser.global_id
        ? supabase.from("users").update(updateData).eq("global_id", currentUser.global_id)
        : supabase.from("users").update(updateData).eq("id", sessionData.user_id)
    ).select("id, biometric_login, lock_method");

    console.log("Update result:", {
      success: !updateError,
      updatedCount: updatedData?.length || 0,
      error: updateError
    });

    if (updateError) {
      console.error("Error updating security settings:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to update security settings",
          details: updateError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!updatedData || updatedData.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No accounts found",
          details: "Could not find any accounts for this global_id"
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
        message: "Security settings updated",
        settings: {
          biometric_login: updatedData[0].biometric_login,
          lock_method: updatedData[0].lock_method,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-update-doctor-security-settings:", error);
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