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

    const { data: sessionData, error: sessionError } = await supabase
      .from("user_patient_sessions")
      .select("patient_id, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (sessionError || !sessionData) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
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

    const { data: patientData } = await supabase
      .from("user_patients")
      .select("medical_id")
      .eq("is_deleted", false)
      .eq("id", sessionData.patient_id)
      .maybeSingle();

    console.log("=== MARK ALL NOTIFICATIONS AS READ ===");
    console.log("Patient ID:", sessionData.patient_id);
    console.log("Medical ID:", patientData?.medical_id);

    if (!patientData) {
      return new Response(
        JSON.stringify({ error: "Patient not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: unreadNotifications } = await supabase
      .from("patient_notifications")
      .select("id")
      .eq("medical_id", patientData.medical_id)
      .eq("read", false);

    console.log("Unread notifications count:", unreadNotifications?.length || 0);

    const { data: updateData, error: updateError } = await supabase
      .from("patient_notifications")
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq("medical_id", patientData.medical_id)
      .eq("read", false)
      .select();

    console.log("Update result:", { success: !updateError, updatedCount: updateData?.length || 0, error: updateError });

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
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-mark-all-notifications-read:", error);
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