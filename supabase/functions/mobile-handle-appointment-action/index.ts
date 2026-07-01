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

    const authHeader = req.headers.get("Authorization");
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
    console.log("Handling appointment action - Token received");

    const { data: sessionData, error: sessionError } = await supabase
      .from("user_sessions")
      .select("user_id, expires_at")
      .eq("token", token)
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

    const { notificationId, action } = await req.json();

    console.log("=== HANDLE APPOINTMENT ACTION ===");
    console.log("Notification ID:", notificationId);
    console.log("Action:", action);
    console.log("User ID:", sessionData.user_id);

    if (!notificationId || !action) {
      return new Response(
        JSON.stringify({ error: "Notification ID and action are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action !== "confirm" && action !== "cancel") {
      return new Response(
        JSON.stringify({ error: "Action must be 'confirm' or 'cancel'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: notification, error: notificationError } = await supabase
      .from("doctor_notifications")
      .select("id, objective_id, category, status")
      .eq("id", notificationId)
      .maybeSingle();

    if (notificationError || !notification) {
      console.error("Notification not found:", notificationError);
      return new Response(
        JSON.stringify({ error: "Notification not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (notification.category.toLowerCase() !== "appointment") {
      return new Response(
        JSON.stringify({ error: "This action is only valid for appointment notifications" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!notification.objective_id) {
      return new Response(
        JSON.stringify({ error: "No appointment associated with this notification" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const notificationStatus = action === "confirm" ? "confirmed" : "cancelled";

    // Only update appointment status if cancelling
    if (action === "cancel") {
      console.log("Updating appointment:", notification.objective_id, "to status: cancelled");

      const { error: appointmentError } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", notification.objective_id);

      if (appointmentError) {
        console.error("Error updating appointment:", appointmentError);
        return new Response(
          JSON.stringify({
            error: "Failed to update appointment",
            details: appointmentError.message
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      console.log("Confirming appointment - no status change needed");
    }

    console.log("Updating notification status to:", notificationStatus);

    const { error: updateNotificationError } = await supabase
      .from("doctor_notifications")
      .update({
        status: notificationStatus,
        read: true
      })
      .eq("id", notificationId);

    if (updateNotificationError) {
      console.error("Error updating notification:", updateNotificationError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Appointment ${action === "confirm" ? "confirmed" : "cancelled"} successfully`,
        appointmentStatus: action === "cancel" ? "cancelled" : "unchanged",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-handle-appointment-action:", error);
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