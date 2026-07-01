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

    console.log("Marking all doctor notifications as read - Token received");

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

    console.log("=== MARK ALL DOCTOR NOTIFICATIONS AS READ ===");
    console.log("User ID:", sessionData.user_id);

    const { data: userData } = await supabase
      .from("users")
      .select("id, global_id, company_id")
      .eq("is_deleted", false)
      .eq("id", sessionData.user_id)
      .maybeSingle();

    if (!userData || !userData.global_id || !userData.company_id) {
      return new Response(
        JSON.stringify({ error: "User not found or missing global_id/company_id" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Global ID:", userData.global_id, "Company ID:", userData.company_id);

    // Get all notification IDs that this user has access to
    // 1. Authorization notifications (by global_id)
    const { data: authNotifications } = await supabase
      .from("doctor_notifications")
      .select("id")
      .eq("global_id", userData.global_id)
      .eq("category", "authorization")
      .eq("company_id", userData.company_id)
      .eq("read", false);

    // 2. Other notifications (via user_doctor_access)
    const { data: otherNotifications } = await supabase.rpc(
      "get_doctor_notifications_via_access",
      {
        p_global_id: userData.global_id,
        p_company_id: userData.company_id,
      }
    );

    // Combine all notification IDs that are unread
    const authIds = (authNotifications || []).map(n => n.id);
    const otherIds = (otherNotifications || []).filter(n => !n.read).map(n => n.id);
    const allNotificationIds = [...authIds, ...otherIds];

    console.log("Notification IDs to mark as read:", allNotificationIds.length);

    if (allNotificationIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No notifications to mark as read",
          count: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Mark all these notifications as read
    const { data: updateData, error: updateError } = await supabase
      .from("doctor_notifications")
      .update({ read: true })
      .in("id", allNotificationIds)
      .select();

    console.log("Update result:", { success: !updateError, updatedCount: updateData?.length, error: updateError });

    if (updateError) {
      console.error("Error marking all notifications as read:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to mark all notifications as read",
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
        message: "All notifications marked as read",
        count: updateData?.length || 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-mark-all-doctor-notifications-read:", error);
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