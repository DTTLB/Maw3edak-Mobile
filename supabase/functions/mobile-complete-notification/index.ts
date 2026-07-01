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

    console.log("=== COMPLETE NOTIFICATION REQUEST ===");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("Token received (first 20 chars):", token.substring(0, 20));

    const { data: sessionData, error: sessionError } = await supabase
      .from("user_patient_sessions")
      .select("patient_id, expires_at")
      .eq("token", token)
      .maybeSingle();

    console.log("Session lookup result:", { found: !!sessionData, error: sessionError?.message });

    if (sessionError || !sessionData) {
      console.error("Invalid or expired token:", sessionError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token", details: sessionError?.message }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (new Date(sessionData.expires_at) < new Date()) {
      console.error("Token has expired");
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

    console.log("Patient lookup:", { found: !!patientData, medical_id: patientData?.medical_id });

    if (!patientData) {
      console.error("Patient not found");
      return new Response(
        JSON.stringify({ error: "Patient not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { notificationId, action } = await req.json();

    if (!notificationId) {
      console.error("Missing notification ID");
      return new Response(
        JSON.stringify({ error: "Notification ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Completing notification ${notificationId} with action: ${action}`);

    // Get the notification and check if it has an appointment linked
    const { data: notificationData } = await supabase
      .from("patient_notifications")
      .select("id, medical_id, objective_id, category")
      .eq("id", notificationId)
      .eq("medical_id", patientData.medical_id)
      .maybeSingle();

    if (!notificationData) {
      console.error("Notification not found or doesn't belong to this patient");
      return new Response(
        JSON.stringify({ error: "Notification not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Notification data:", notificationData);

    // Update the notification as completed
    const { data, error } = await supabase
      .from("patient_notifications")
      .update({ completed: true })
      .eq("id", notificationId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error updating notification:", error);
      return new Response(
        JSON.stringify({ error: "Failed to complete notification", details: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Notification updated successfully");

    // If this is an appointment notification with an objective_id, update the appointment status
    if (notificationData.category?.toLowerCase() === 'appointment' && notificationData.objective_id) {
      console.log(`Updating appointment ${notificationData.objective_id} status based on action: ${action}`);
      
      const newAppointmentStatus = action === 'confirmed' ? 'confirmed' : 'cancelled';
      console.log(`New appointment status will be: ${newAppointmentStatus}`);
      
      const { error: appointmentError } = await supabase
        .from("appointments")
        .update({ status: newAppointmentStatus })
        .eq("id", notificationData.objective_id);

      if (appointmentError) {
        console.error("Error updating appointment status:", appointmentError);
        // Don't fail the whole request, just log the error
      } else {
        console.log(`Successfully updated appointment ${notificationData.objective_id} status to ${newAppointmentStatus}`);
      }
    } else {
      console.log("Not an appointment notification or no objective_id, skipping appointment update");
    }

    console.log("Successfully completed notification");

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification ${action} successfully`,
        notification: data,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-complete-notification:", error);
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