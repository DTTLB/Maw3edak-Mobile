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

    console.log("Marking doctor notification as read - Token received");

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

    const { notificationId } = await req.json();

    console.log("=== MARK DOCTOR NOTIFICATION AS READ ===");
    console.log("Notification ID:", notificationId);
    console.log("User ID:", sessionData.user_id);

    if (!notificationId) {
      return new Response(
        JSON.stringify({ error: "Notification ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user's company_id and global_id for verification
    const { data: userData } = await supabase
      .from("users")
      .select("company_id, global_id")
      .eq("is_deleted", false)
      .eq("id", sessionData.user_id)
      .maybeSingle();

    if (!userData || !userData.company_id) {
      return new Response(
        JSON.stringify({ error: "User not found or missing company" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("User company_id:", userData.company_id);
    console.log("User global_id:", userData.global_id);

    // Verify the notification belongs to this user by checking:
    // 1. If it's an authorization notification (matches global_id)
    // 2. Or if it's accessible via user_doctor_access

    // Check if it's an authorization notification
    const { data: authNotif } = await supabase
      .from("doctor_notifications")
      .select("id")
      .eq("id", notificationId)
      .eq("global_id", userData.global_id)
      .eq("category", "authorization")
      .eq("company_id", userData.company_id)
      .maybeSingle();

    let hasAccess = !!authNotif;

    // If not an auth notification, check via user_doctor_access
    if (!hasAccess) {
      const { data: otherNotifications } = await supabase.rpc(
        "get_doctor_notifications_via_access",
        {
          p_global_id: userData.global_id,
          p_company_id: userData.company_id,
        }
      );
      hasAccess = (otherNotifications || []).some((n: any) => n.id === notificationId);
    }

    if (!hasAccess) {
      return new Response(
        JSON.stringify({
          error: "Notification not found or access denied",
          success: false
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update notification by ID only (access already verified)
    const { data: updateData, error: updateError } = await supabase
      .from("doctor_notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .select();

    console.log("Update result:", { success: !updateError, data: updateData, error: updateError });

    if (updateError) {
      console.error("Error marking notification as read:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to mark notification as read",
          details: updateError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification marked as read",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-mark-doctor-notification-read:", error);
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