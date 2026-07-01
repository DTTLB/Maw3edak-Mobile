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
    const { medicalId } = body;

    if (!medicalId) {
      return new Response(
        JSON.stringify({ error: "Medical ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Fetching eye summary for medical_id:", medicalId);

    // Get ALL patient records across ALL companies using medical_id
    const { data: patientRecords, error: patientError } = await supabase
      .from("patients")
      .select("id, company_id")
      .eq("is_deleted", false)
      .eq("medical_id", medicalId);

    if (patientError) {
      console.error("Patient lookup error:", patientError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch patient records", details: patientError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!patientRecords || patientRecords.length === 0) {
      console.log("No patient records found for medical_id:", medicalId);
      return new Response(
        JSON.stringify({ error: "Patient not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${patientRecords.length} patient records across companies`);

    const patientIds = patientRecords.map(p => p.id);

    // Get latest eye examination
    const { data: latestExam, error: examError } = await supabase
      .from("patient_eye_history")
      .select(`
        *,
        doctors(first_name, last_name, full_name),
        companies(name)
      `)
      .in("patient_id", patientIds)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (examError) {
      console.error("Error fetching eye examination:", examError);
    }

    // Get latest eyeglass prescription
    const { data: latestPrescription, error: prescriptionError } = await supabase
      .from("eyeglass_prescriptions")
      .select(`
        *,
        doctors(first_name, last_name, full_name),
        companies(name)
      `)
      .in("patient_id", patientIds)
      .order("issue_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (prescriptionError) {
      console.error("Error fetching eyeglass prescription:", prescriptionError);
    }

    // Get recent eye tests (last 5)
    const { data: recentTests, error: testsError } = await supabase
      .from("eye_tests")
      .select(`
        *,
        doctors(first_name, last_name, full_name),
        companies(name)
      `)
      .in("patient_id", patientIds)
      .order("created_at", { ascending: false })
      .limit(5);

    if (testsError) {
      console.error("Error fetching eye tests:", testsError);
    }

    // Format response
    const response: any = {
      success: true,
      latest_examination: null,
      latest_prescription: null,
      recent_tests: [],
    };

    if (latestExam) {
      response.latest_examination = {
        date: latestExam.created_at,
        right_sphere: latestExam.right_sphere,
        left_sphere: latestExam.left_sphere,
        right_cylinder: latestExam.right_cylinder,
        left_cylinder: latestExam.left_cylinder,
        right_axis: latestExam.right_axis,
        left_axis: latestExam.left_axis,
        vision_with_glasses: latestExam.vision_with_glasses,
        vision_without_glasses: latestExam.vision_without_glasses,
        pressure_right: latestExam.pressure_right,
        pressure_left: latestExam.pressure_left,
        notes: latestExam.notes,
        doctor: latestExam.doctors?.full_name || `${latestExam.doctors?.first_name} ${latestExam.doctors?.last_name}` || "N/A",
        company: latestExam.companies?.name || "N/A",
      };
    }

    if (latestPrescription) {
      response.latest_prescription = {
        date: latestPrescription.issue_date,
        right_sphere: latestPrescription.right_sphere,
        left_sphere: latestPrescription.left_sphere,
        right_cylinder: latestPrescription.right_cylinder,
        left_cylinder: latestPrescription.left_cylinder,
        right_axis: latestPrescription.right_axis,
        left_axis: latestPrescription.left_axis,
        right_add: latestPrescription.right_add,
        left_add: latestPrescription.left_add,
        lens_type: latestPrescription.lens_type,
        frame_type: latestPrescription.frame_type,
        pd: latestPrescription.pd,
        remarks: latestPrescription.remarks,
        doctor: latestPrescription.doctors?.full_name || `${latestPrescription.doctors?.first_name} ${latestPrescription.doctors?.last_name}` || "N/A",
        company: latestPrescription.companies?.name || "N/A",
      };
    }

    if (recentTests && recentTests.length > 0) {
      response.recent_tests = recentTests.map((test: any) => ({
        id: test.id,
        date: test.created_at,
        test_type: test.test_type,
        result: test.result,
        notes: test.notes,
        attachments: test.attachments || [],
        doctor: test.doctors?.full_name || `${test.doctors?.first_name} ${test.doctors?.last_name}` || "N/A",
        company: test.companies?.name || "N/A",
      }));
    }

    console.log("Eye summary fetched successfully");

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-patient-eye-summary:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
