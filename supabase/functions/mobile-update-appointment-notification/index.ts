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

    const body = await req.json();
    console.log("=== UPDATE APPOINTMENT NOTIFICATION ===");
    console.log("Request body:", JSON.stringify(body, null, 2));

    const { appointmentId, status } = body;

    if (!appointmentId) {
      console.error("Missing appointmentId parameter");
      return new Response(
        JSON.stringify({ error: "Appointment ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!status) {
      console.error("Missing status parameter");
      return new Response(
        JSON.stringify({ error: "Status is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (status !== "confirmed" && status !== "cancelled") {
      console.error("Invalid status:", status);
      return new Response(
        JSON.stringify({ error: "Status must be 'confirmed' or 'cancelled'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Step 1: Getting appointment details");
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select(`
        id,
        company_id,
        patient_id,
        doctor_id,
        patients!inner(name_en, name_ar)
      `)
      .eq("id", appointmentId)
      .maybeSingle();

    console.log("Appointment query result:", {
      data: appointment,
      error: appointmentError,
    });

    if (appointmentError || !appointment) {
      console.error("Appointment not found:", appointmentError);
      return new Response(
        JSON.stringify({
          error: "Appointment not found",
          details: appointmentError?.message,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Step 2: Creating notification for appointment ${status}`);

    const message = `Appointment for patient ${appointment.patients.name_en} has been ${status}`;

    const notification = {
      company_id: appointment.company_id,
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      objective_id: appointment.id,
      category: "appointment",
      status: status,
      message: message,
      read: false,
    };

    console.log("Inserting notification:", notification);

    const { data: insertedNotification, error: insertError } = await supabase
      .from("doctor_notifications")
      .insert(notification)
      .select()
      .single();

    console.log("Insert result:", {
      data: insertedNotification,
      error: insertError,
    });

    if (insertError) {
      console.error("Error inserting notification:", insertError);
      return new Response(
        JSON.stringify({
          error: "Failed to create notification",
          details: insertError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Step 3: Successfully created notification");

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification created successfully for ${status} appointment`,
        notification: insertedNotification,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-update-appointment-notification:", error);
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