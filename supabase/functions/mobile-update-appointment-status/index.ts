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
    console.log("=== UPDATE APPOINTMENT STATUS REQUEST ===");
    console.log("Request body:", JSON.stringify(body, null, 2));

    const { appointmentId, status, userId } = body;

    if (!appointmentId || !status) {
      console.error("Missing required parameters - appointmentId:", appointmentId, "status:", status);
      return new Response(
        JSON.stringify({ error: "Appointment ID and status are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!userId) {
      console.error("Missing userId parameter");
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user is a patient or doctor
    console.log("Step 1: Checking user type for userId:", userId);

    // Try patient first
    const { data: userPatient } = await supabase
      .from("user_patients")
      .select("medical_id")
      .eq("is_deleted", false)
      .eq("id", userId)
      .maybeSingle();

    // Try doctor if not a patient
    const { data: userData } = await supabase
      .from("users")
      .select("global_id")
      .eq("is_deleted", false)
      .eq("id", userId)
      .maybeSingle();

    const isDoctor = userData?.global_id?.startsWith("DR-");
    const isPatient = !!userPatient?.medical_id;

    console.log("User type check:", { isDoctor, isPatient });

    let appointment;
    let checkError;

    if (isPatient) {
      console.log("Step 2 (Patient): Found medical_id:", userPatient.medical_id);
      console.log("Step 3: Checking appointment access - appointmentId:", appointmentId, "medical_id:", userPatient.medical_id);

      const result = await supabase
        .from("appointments")
        .select(`
          id,
          patient_id,
          status,
          patients:patient_id!inner (
            medical_id
          )
        `)
        .eq("id", appointmentId)
        .eq("patients.medical_id", userPatient.medical_id)
        .maybeSingle();

      appointment = result.data;
      checkError = result.error;
    } else if (isDoctor) {
      console.log("Step 2 (Doctor): Checking doctor access via user_doctor_access");

      // Step 1: Get all user_ids with this global_id (one person may have multiple user IDs across companies)
      const { data: allUsers, error: allUsersError } = await supabase
        .from("users")
        .select("id")
        .eq("is_deleted", false)
        .eq("global_id", userData.global_id);

      console.log("All users with global_id:", { data: allUsers, error: allUsersError });

      const userIds = allUsers?.map(u => u.id) || [userId];

      // Step 2: Get all doctor access records for these user IDs
      const { data: doctorAccess, error: doctorAccessError } = await supabase
        .from("user_doctor_access")
        .select("doctor_id")
        .in("user_id", userIds);

      console.log("Doctor access query result:", { data: doctorAccess, error: doctorAccessError });

      const doctorIds = doctorAccess?.map(d => d.doctor_id) || [];

      console.log("Step 3: Checking appointment access - appointmentId:", appointmentId, "doctorIds:", doctorIds);

      if (doctorIds.length === 0) {
        console.error("No doctor IDs found for user:", userId);
        return new Response(
          JSON.stringify({
            error: "No doctor access found",
            details: "User has no associated doctors in user_doctor_access table",
            debugInfo: {
              userId,
              isDoctor,
            }
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const result = await supabase
        .from("appointments")
        .select("id, patient_id, status, doctor_id")
        .eq("id", appointmentId)
        .in("doctor_id", doctorIds)
        .maybeSingle();

      appointment = result.data;
      checkError = result.error;

      if (!appointment) {
        console.log("Appointment not found. Checking if appointment exists with different doctor_id");
        const { data: existingAppointment } = await supabase
          .from("appointments")
          .select("id, doctor_id")
          .eq("id", appointmentId)
          .maybeSingle();

        console.log("Existing appointment check:", existingAppointment);
      }
    } else {
      console.error("User is neither patient nor doctor");
      return new Response(
        JSON.stringify({
          error: "User not found or invalid user type",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Appointment check result:", {
      data: appointment,
      error: checkError,
    });

    if (checkError || !appointment) {
      console.error("Appointment check failed:", checkError);
      return new Response(
        JSON.stringify({
          error: "Appointment not found or access denied",
          details: checkError?.message,
          debugInfo: {
            appointmentId,
            userId,
            isDoctor,
            isPatient,
          }
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Step 4: Appointment found, current status:", appointment.status);
    console.log("Step 5: Updating appointment to new status:", status);

    const { data: updatedAppointment, error: updateError } = await supabase
      .from("appointments")
      .update({ status: status })
      .eq("id", appointmentId)
      .select()
      .single();

    console.log("Update result:", {
      data: updatedAppointment,
      error: updateError,
    });

    if (updateError) {
      console.error("Error updating appointment:", updateError);
      console.error("Update failed with error:", updateError.message);
      return new Response(
        JSON.stringify({
          error: "Failed to update appointment",
          details: updateError.message,
          debugInfo: {
            appointmentId,
            newStatus: status,
            oldStatus: appointment.status,
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Step 6: Appointment updated successfully!");
    console.log("Updated appointment:", JSON.stringify(updatedAppointment, null, 2));

    const { data: fullAppointment, error: fullAppointmentError } = await supabase
      .from("appointments")
      .select(`
        id,
        company_id,
        doctor_id,
        patient_id,
        appointment_date,
        patients:patient_id (
          first_name,
          last_name,
          medical_id
        )
      `)
      .eq("id", appointmentId)
      .single();

    if (!fullAppointmentError && fullAppointment && fullAppointment.patients) {
      const patientData = Array.isArray(fullAppointment.patients)
        ? fullAppointment.patients[0]
        : fullAppointment.patients;

      const notificationData = {
        company_id: fullAppointment.company_id,
        doctor_id: fullAppointment.doctor_id,
        patient_id: fullAppointment.patient_id,
        objective_id: fullAppointment.id,
        category: "appointment",
        message: `Appointment for patient ${patientData.first_name} ${patientData.last_name} has been ${status.toLowerCase()}`,
        read: false,
        status: status.toLowerCase()
      };

      const { error: notificationError } = await supabase
        .from("doctor_notifications")
        .insert([notificationData]);

      if (notificationError) {
        console.error("Error creating notification:", notificationError);
      } else {
        console.log("Notification created successfully for status change");
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Appointment ${status.toLowerCase()} successfully`,
        appointment: updatedAppointment,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-update-appointment-status:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
