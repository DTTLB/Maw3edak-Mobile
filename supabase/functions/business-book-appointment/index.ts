import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// business-book-appointment
// -----------------------------------------------------------------------------
// NEW, dedicated booking endpoint for the RECEPTIONIST flow. Separate from the
// patient-facing mobile-book-appointment so the reception screens are fully
// self-contained.
//
// Steps:
//   1. Validate the receptionist (bookedByUserId) is actually assigned to the
//      requested doctor via user_doctor_access (server-side authorization).
//   2. Resolve the doctor's company, then the patient record for that company
//      by medical_id.
//   3. Guard against double-booking (active appointment already on that slot).
//   4. Insert the appointment: status 'pending', is_custom true,
//      end_time = appointment_time + 30 minutes.
// =============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SLOT_MINUTES = 30;

// "HH:MM[:SS]" -> "HH:MM" + n minutes.
const addMinutes = (time: string, mins: number): string => {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      return json({ success: false, error: "Server configuration error" }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const patientId = body.patientId || body.patient_id || null;
    const medicalId = body.medicalId || body.medical_id || null;
    const doctorId = body.doctorId || body.doctor_id;
    const clinicId = body.clinicId || body.clinic_id;
    const appointmentDate = body.appointmentDate || body.appointment_date;
    const appointmentTime = body.appointmentTime || body.appointment_time;
    const bookedByUserId = body.bookedByUserId || body.user_id || null;
    const serviceId = body.serviceId || body.service_id || null;
    const roomId = body.roomId || body.room_id || null;

    // The patient is identified by patient_id (preferred) OR medical_id. Some
    // patients have no medical_id, so booking must still work via patient_id.
    if ((!patientId && !medicalId) || !doctorId || !clinicId || !appointmentDate || !appointmentTime) {
      return json({ success: false, error: "Missing required parameters" }, 400);
    }

    // 1) Authorize: the receptionist must be assigned to this doctor.
    if (bookedByUserId) {
      const { data: access } = await supabase
        .from("user_doctor_access")
        .select("doctor_id")
        .eq("user_id", bookedByUserId)
        .eq("doctor_id", doctorId)
        .limit(1);
      if (!access || access.length === 0) {
        return json({ success: false, error: "Not authorized to book for this doctor" }, 403);
      }
    }

    // 2) Resolve doctor + company.
    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .select("id, company_id, first_name, last_name")
      .eq("is_deleted", false)
      .eq("id", doctorId)
      .single();

    if (doctorError || !doctor) {
      return json({ success: false, error: "Doctor not found", details: doctorError?.message }, 404);
    }

    // Resolve the patient record belonging to the doctor's company. Prefer the
    // explicit patient_id (works even when the patient has no medical_id);
    // otherwise fall back to medical_id.
    let patientQuery = supabase
      .from("patients")
      .select("id, first_name, last_name")
      .eq("is_deleted", false)
      .eq("company_id", doctor.company_id);
    patientQuery = patientId
      ? patientQuery.eq("id", patientId)
      : patientQuery.eq("medical_id", medicalId);

    const { data: patient, error: patientError } = await patientQuery.maybeSingle();

    if (patientError || !patient) {
      return json(
        { success: false, error: "Patient not found in this company", details: patientError?.message },
        404
      );
    }

    // 2b) Access validation — every selected entity must be linked to this
    // doctor (defence-in-depth; never trust the client). Patient, service and
    // room are validated strictly against their access tables. The clinic is
    // validated against doctor_clinic_access OR a recurring schedule for that
    // clinic, mirroring how the booking screen sources clinics.
    const UNAUTHORIZED =
      "Unauthorized access: selected item is not linked to this doctor or user.";

    const [patientAccess, clinicAccess, clinicSchedule, serviceAccess, roomAccess] =
      await Promise.all([
        supabase
          .from("patient_doctor_access")
          .select("patient_id")
          .eq("doctor_id", doctorId)
          .eq("patient_id", patient.id)
          .limit(1),
        supabase
          .from("doctor_clinic_access")
          .select("clinic_id")
          .eq("doctor_id", doctorId)
          .eq("clinic_id", clinicId)
          .limit(1),
        supabase
          .from("doctor_recurring_schedules")
          .select("clinic_id")
          .eq("doctor_id", doctorId)
          .eq("clinic_id", clinicId)
          .limit(1),
        serviceId
          ? supabase
              .from("doctor_service_access")
              .select("service_id")
              .eq("doctor_id", doctorId)
              .eq("service_id", serviceId)
              .limit(1)
          : Promise.resolve({ data: [{}] as any[] }),
        roomId
          ? supabase
              .from("doctor_room_access")
              .select("room_id")
              .eq("doctor_id", doctorId)
              .eq("room_id", roomId)
              .limit(1)
          : Promise.resolve({ data: [{}] as any[] }),
      ]);

    const clinicOk = (clinicAccess.data?.length || 0) > 0 || (clinicSchedule.data?.length || 0) > 0;
    if (
      !(patientAccess.data?.length) ||
      !clinicOk ||
      !(serviceAccess.data?.length) ||
      !(roomAccess.data?.length)
    ) {
      return json({ success: false, error: UNAUTHORIZED }, 403);
    }

    // 3) Double-booking guard for this doctor/clinic/date/time.
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
      return json(
        { success: false, error: "Failed to verify slot availability", details: existingSlotError.message },
        500
      );
    }

    if (existingSlot && existingSlot.length > 0) {
      const takenBySamePatient = existingSlot[0].patient_id === patient.id;
      return json(
        {
          success: false,
          error: takenBySamePatient
            ? "This patient already has an appointment at this time."
            : "This time slot has just been taken. Please choose another time.",
        },
        409
      );
    }

    // 4) Insert the appointment (pending, custom, 30-min window).
    const endTime = addMinutes(appointmentTime, SLOT_MINUTES);
    const appointmentData: Record<string, unknown> = {
      company_id: doctor.company_id,
      patient_id: patient.id,
      doctor_id: doctorId,
      clinic_id: clinicId,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      end_time: endTime,
      status: "pending",
      is_custom: true,
      duration: "30 minutes",
    };
    // Optional service / room (company-level). Only set when provided.
    if (serviceId) appointmentData.service_id = serviceId;
    if (roomId) appointmentData.room_id = roomId;

    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert([appointmentData])
      .select()
      .single();

    if (insertError) {
      console.error("Insert appointment error:", insertError.message);
      return json({ success: false, error: "Failed to create appointment", details: insertError.message }, 500);
    }

    // Notify the doctor (non-fatal).
    try {
      const patientName = `${patient.first_name} ${patient.last_name}`.trim();
      await supabase.from("doctor_notifications").insert([
        {
          company_id: doctor.company_id,
          doctor_id: doctorId,
          objective_id: appointment.id,
          category: "appointment",
          message_header: "New Appointment",
          message_body: `New appointment booked for patient ${patientName} on ${appointmentDate} at ${appointmentTime}`,
          read: false,
          completed: false,
        },
      ]);
    } catch (notifyErr) {
      console.error("doctor_notifications insert failed (non-fatal):", notifyErr);
    }

    return json({ success: true, message: "Appointment booked successfully!", appointment });
  } catch (error: any) {
    console.error("Error in business-book-appointment:", error);
    return json({ success: false, error: "Internal server error", details: error?.message || String(error) }, 500);
  }
});
