import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  console.log("=== Update Patient Profile Request Started ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("Initializing Supabase client...");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
    });

    console.log("Checking authorization header...");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("ERROR: Missing authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("Token received (length):", token.length);

    console.log("Looking up session...");
    const { data: sessionData, error: sessionError } = await supabase
      .from("user_patient_sessions")
      .select("patient_id, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (sessionError || !sessionData) {
      console.log("ERROR: Invalid session", sessionError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Session found for patient ID:", sessionData.patient_id);

    if (new Date(sessionData.expires_at) < new Date()) {
      console.log("ERROR: Token expired");
      return new Response(
        JSON.stringify({ success: false, error: "Token has expired" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Parsing request body...");
    const body = await req.json();
    console.log("Body received:", JSON.stringify(body, null, 2));
    const {
      medicalId,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      bloodType,
      address,
      profileImage,
    } = body;

    const updateData: any = {};
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth !== undefined) updateData.date_of_birth = dateOfBirth === '' ? null : dateOfBirth;
    if (gender !== undefined) updateData.gender = gender;
    if (bloodType !== undefined) updateData.blood_type = bloodType;
    if (address !== undefined) updateData.address = address;
    if (profileImage !== undefined) updateData.profile_image = profileImage;

    if (Object.keys(updateData).length === 0) {
      console.log("ERROR: No fields to update");
      return new Response(
        JSON.stringify({ success: false, error: "No fields to update" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    updateData.updated_at = new Date().toISOString();

    console.log("Updating user_patients table...");
    console.log("Patient ID:", sessionData.patient_id);
    console.log("Update data:", JSON.stringify(updateData, null, 2));

    const { data: patientData, error: updateError } = await supabase
      .from("user_patients")
      .update(updateData)
      .eq("id", sessionData.patient_id)
      .select()
      .single();

    console.log("Update result:", { patientData, updateError });

    if (updateError) {
      console.error("=== UPDATE ERROR ===");
      console.error("Error updating patient profile:", updateError);
      console.error("Update error details:", JSON.stringify(updateError, null, 2));
      console.error("Patient ID:", sessionData.patient_id);
      console.error("Update data:", JSON.stringify(updateData, null, 2));
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to update patient profile",
          details: updateError.message || "Unknown error",
          code: updateError.code || "UNKNOWN",
          hint: updateError.hint || "No hint available"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("user_patients table updated successfully");

    const patientTableUpdateData: any = {};
    if (firstName !== undefined) patientTableUpdateData.first_name = firstName;
    if (lastName !== undefined) patientTableUpdateData.last_name = lastName;
    if (email !== undefined) patientTableUpdateData.email = email;
    if (phone !== undefined) patientTableUpdateData.phone = phone;
    if (dateOfBirth !== undefined) patientTableUpdateData.date_of_birth = dateOfBirth === '' ? null : dateOfBirth;
    if (gender !== undefined) patientTableUpdateData.gender = gender;
    if (bloodType !== undefined) patientTableUpdateData.blood_type = bloodType;
    if (address !== undefined) patientTableUpdateData.address = address;
    if (profileImage !== undefined) patientTableUpdateData.image = profileImage;
    patientTableUpdateData.updated_at = new Date().toISOString();

    if (patientData.medical_id) {
      console.log("Updating patients table...");
      console.log("Medical ID:", patientData.medical_id);
      const { error: patientsUpdateError } = await supabase
        .from("patients")
        .update(patientTableUpdateData)
        .eq("medical_id", patientData.medical_id);

      if (patientsUpdateError) {
        console.error("Error updating patients table:", patientsUpdateError);
        console.error("Note: This is non-critical, continuing...");
      } else {
        console.log("patients table updated successfully");
      }
    }

    console.log("SUCCESS: Profile updated successfully");
    return new Response(
      JSON.stringify({
        success: true,
        message: "Patient profile updated successfully",
        patient: patientData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("=== EXCEPTION in mobile-update-patient-profile ===");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});