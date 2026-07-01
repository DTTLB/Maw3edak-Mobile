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

    console.log("Toggle doctor notifications - Token received");

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

    const { allow_notifications } = await req.json();

    console.log("=== TOGGLE DOCTOR NOTIFICATIONS ===");
    console.log("User ID:", sessionData.user_id);
    console.log("Allow notifications:", allow_notifications);

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

    if (typeof allow_notifications !== 'boolean') {
      return new Response(
        JSON.stringify({ error: "allow_notifications must be a boolean" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Doctors: update ALL accounts sharing the global_id. Receptionists /
    // single-company staff have no global_id, so update just their own row.
    const { data: updateData, error: updateError } = await (
      currentUser.global_id
        ? supabase.from("users").update({ allow_notifications }).eq("global_id", currentUser.global_id)
        : supabase.from("users").update({ allow_notifications }).eq("id", sessionData.user_id)
    ).select("id, allow_notifications");

    console.log("Update result:", {
      success: !updateError,
      updatedCount: updateData?.length || 0,
      error: updateError
    });

    if (updateError) {
      console.error("Error updating notification settings:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to update notification settings",
          details: updateError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!updateData || updateData.length === 0) {
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
        message: `Notifications ${allow_notifications ? 'enabled' : 'disabled'}`,
        allow_notifications: updateData[0].allow_notifications,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-toggle-doctor-notifications:", error);
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