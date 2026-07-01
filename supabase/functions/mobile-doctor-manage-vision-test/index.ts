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
      .from("user_sessions")
      .select("user_id")
      .eq("session_token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (sessionError || !sessionData) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired session" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const {
      doctor_id,
      patient_medical_id,
      test_id,
      test_type,
      result,
      notes,
      recommendations,
      attachments,
      company_id
    } = await req.json();

    console.log("=== DOCTOR MANAGE VISION TEST ===");
    console.log("User ID:", sessionData.user_id);
    console.log("Doctor ID:", doctor_id);
    console.log("Patient Medical ID:", patient_medical_id);
    console.log("Test ID:", test_id);
    console.log("Company ID:", company_id);

    // Validate required fields
    if (!doctor_id || !patient_medical_id) {
      return new Response(
        JSON.stringify({ error: "doctor_id and patient_medical_id are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify the user has access to this doctor
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("global_id, company_id")
      .eq("is_deleted", false)
      .eq("id", sessionData.user_id)
      .single();

    if (userError || !currentUser) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get all companies the user has access to
    const { data: userCompanies, error: companiesError } = await supabase
      .from("users")
      .select("company_id")
      .eq("is_deleted", false)
      .eq("global_id", currentUser.global_id);

    if (companiesError || !userCompanies || userCompanies.length === 0) {
      return new Response(
        JSON.stringify({ error: "No companies found for user" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const companyIds = userCompanies.map((u: any) => u.company_id);

    // Verify doctor exists and user has access
    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .select("id, company_id")
      .eq("is_deleted", false)
      .eq("id", doctor_id)
      .in("company_id", companyIds)
      .maybeSingle();

    if (doctorError || !doctor) {
      return new Response(
        JSON.stringify({ error: "Doctor not found or access denied" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get patient record(s) by medical_id
    let patientQuery = supabase
      .from("patients")
      .select("id, company_id, full_name, medical_id")
      .eq("is_deleted", false)
      .eq("medical_id", patient_medical_id);

    if (company_id) {
      patientQuery = patientQuery.eq("company_id", company_id);
    } else {
      patientQuery = patientQuery.eq("company_id", doctor.company_id);
    }

    const { data: patientRecords, error: patientError } = await patientQuery;

    if (patientError || !patientRecords || patientRecords.length === 0) {
      return new Response(
        JSON.stringify({ error: "Patient not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const patient = patientRecords[0];

    // If test_id is provided, update existing test
    if (test_id) {
      console.log("Updating existing vision test:", test_id);

      // Verify the test exists and belongs to this doctor and patient
      const { data: existingTest, error: testCheckError } = await supabase
        .from("eye_tests")
        .select("id, doctor_id, patient_id")
        .eq("id", test_id)
        .eq("doctor_id", doctor_id)
        .eq("patient_id", patient.id)
        .maybeSingle();

      if (testCheckError || !existingTest) {
        return new Response(
          JSON.stringify({ error: "Vision test not found or access denied" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Update the test
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (test_type !== undefined) updateData.test_type = test_type;
      if (result !== undefined) updateData.result = result;
      if (notes !== undefined) updateData.notes = notes;
      if (recommendations !== undefined) updateData.recommendations = recommendations;
      if (attachments !== undefined) updateData.attachments = attachments;

      const { data: updatedTest, error: updateError } = await supabase
        .from("eye_tests")
        .update(updateData)
        .eq("id", test_id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating vision test:", updateError);
        return new Response(
          JSON.stringify({
            error: "Failed to update vision test",
            details: updateError.message
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("Vision test updated successfully");

      return new Response(
        JSON.stringify({
          success: true,
          action: "updated",
          test: updatedTest,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      // Create new test
      console.log("Creating new vision test");

      if (!test_type || !result) {
        return new Response(
          JSON.stringify({ error: "test_type and result are required for new test" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const newTest: any = {
        doctor_id: doctor_id,
        patient_id: patient.id,
        company_id: patient.company_id,
        test_type: test_type,
        result: result,
        notes: notes || null,
        recommendations: recommendations || null,
        attachments: attachments || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: createdTest, error: createError } = await supabase
        .from("eye_tests")
        .insert(newTest)
        .select()
        .single();

      if (createError) {
        console.error("Error creating vision test:", createError);
        return new Response(
          JSON.stringify({
            error: "Failed to create vision test",
            details: createError.message
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("Vision test created successfully");

      return new Response(
        JSON.stringify({
          success: true,
          action: "created",
          test: createdTest,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in mobile-doctor-manage-vision-test:", error);
    return new Response(
      JSON.stringify({
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
