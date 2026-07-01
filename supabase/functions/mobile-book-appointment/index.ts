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
    const { medicalId, doctorId, clinicId, appointmentDate, appointmentTime } = body;

    if (!medicalId || !doctorId || !clinicId || !appointmentDate || !appointmentTime) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Booking appointment for medical_id:", medicalId);

    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .select("id, company_id")
      .eq("is_deleted", false)
      .eq("id", doctorId)
      .single();

    if (doctorError || !doctor) {
      console.error("Doctor lookup error:", doctorError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Doctor not found",
          details: doctorError?.message
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("is_deleted", false)
      .eq("medical_id", medicalId)
      .eq("company_id", doctor.company_id)
      .single();

    if (patientError || !patient) {
      console.error("Patient lookup error:", patientError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Patient not found in this company",
          details: patientError?.message
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Found patient_id:", patient.id, "company_id:", doctor.company_id);

    // Guard against double-booking: make sure this doctor/clinic/date/time slot
    // is not already taken by an active (pending/scheduled/confirmed) appointment.
    // This also prevents the same patient from booking two appointments at the
    // same time. Cancelled appointments do not block the slot.
    const { data: existingSlot, error: existingSlotError } = await supabase
      .from("appointments")
      .select("id, patient_id")
      .eq("doctor_id", doctorId)
      .eq("clinic_id", clinicId)
      .eq("appointment_date", appointmentDate)
      .eq("appointment_time", appointmentTime)
      .in("status", ["pending", "scheduled", "confirmed"])
      .limit(1);

    if (existingSlotError) {
      console.error("Error checking existing appointments:", existingSlotError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to verify slot availability",
          details: existingSlotError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (existingSlot && existingSlot.length > 0) {
      const takenBySamePatient = existingSlot[0].patient_id === patient.id;
      console.warn(
        "Slot already taken:",
        appointmentDate,
        appointmentTime,
        "samePatient:",
        takenBySamePatient
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: takenBySamePatient
            ? "You already have an appointment at this time."
            : "This time slot has just been taken. Please choose another time.",
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const appointmentData = {
      company_id: doctor.company_id,
      patient_id: patient.id,
      doctor_id: doctorId,
      clinic_id: clinicId,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      status: "pending",
      duration: "30 minutes",
    };

    console.log("Attempting to create appointment with data:", appointmentData);

    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert([appointmentData])
      .select()
      .single();

    if (insertError) {
      console.error("Error creating appointment:", insertError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create appointment",
          details: insertError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Appointment created successfully:", appointment.id);

    const { data: patientDetails, error: patientDetailsError } = await supabase
      .from("patients")
      .select("first_name, last_name")
      .eq("is_deleted", false)
      .eq("id", patient.id)
      .single();

    if (patientDetailsError) {
      console.error("Error fetching patient details for notification:", patientDetailsError);
    }

    const { data: doctorDetails, error: doctorDetailsError } = await supabase
      .from("doctors")
      .select("first_name, last_name")
      .eq("is_deleted", false)
      .eq("id", doctorId)
      .single();

    // Create notification for doctor (always create notification regardless of patient details fetch)
    const patientName = (patientDetails?.first_name && patientDetails?.last_name)
      ? `${patientDetails.first_name} ${patientDetails.last_name}`
      : `Patient (ID: ${patient.id})`;

    const notificationData = {
      company_id: doctor.company_id,
      doctor_id: doctorId,
      objective_id: appointment.id,
      category: "appointment",
      message_header: "New Appointment",
      message_body: `New appointment booked for patient ${patientName} on ${appointmentDate}`,
      read: false,
      completed: false
    };

    console.log("Inserting doctor notification with data:", notificationData);

    const { data: insertedNotification, error: notificationError } = await supabase
      .from("doctor_notifications")
      .insert([notificationData])
      .select()
      .single();

    if (notificationError) {
      console.error("Error creating doctor notification:", notificationError);
    } else {
      console.log("Doctor notification created successfully:", insertedNotification.id);
    }

    // Send FCM notification directly to patient
    console.log("Sending FCM notification to patient:", medicalId);
    try {
      const doctorName = doctorDetails ? `Dr. ${doctorDetails.first_name} ${doctorDetails.last_name}` : "Your doctor";
      const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      const fcmResponse = await fetch(
        `${supabaseUrl}/functions/v1/send-push-notification`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            medicalId: medicalId,
            title: 'Appointment Confirmed',
            body: `Your appointment with ${doctorName} on ${formattedDate} at ${appointmentTime} has been confirmed.`,
            data: {
              type: 'new_appointment',
              appointment_id: appointment.id.toString(),
              screen: 'appointments',
            },
          }),
        }
      );

      const fcmResult = await fcmResponse.json();
      console.log('FCM notification result:', fcmResult);

      if (fcmResult.success) {
        console.log('✅ Patient FCM notification sent successfully');
      } else {
        console.warn('⚠️ Patient FCM notification failed:', fcmResult.error);
      }
    } catch (fcmError) {
      console.error('Error sending patient FCM notification:', fcmError);
      // Don't fail the appointment booking if FCM fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Appointment booked successfully!",
        appointment,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-book-appointment:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});