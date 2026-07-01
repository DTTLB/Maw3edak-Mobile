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

    const url = new URL(req.url);
    const globalId = url.searchParams.get("global_id");
    const companyId = url.searchParams.get("company_id");
    const doctorId = url.searchParams.get("doctor_id");
    const patientMedicalId = url.searchParams.get("patient_medical_id");

    if (!globalId) {
      return new Response(
        JSON.stringify({ error: "Global ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!doctorId || !patientMedicalId) {
      return new Response(
        JSON.stringify({ error: "Doctor ID and Patient Medical ID are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Fetching vision tests for doctor:", doctorId, "patient:", patientMedicalId);

    // Get user records with this global_id
    let userQuery = supabase
      .from("users")
      .select("id, company_id")
      .eq("is_deleted", false)
      .eq("global_id", globalId);

    if (companyId) {
      userQuery = userQuery.eq("company_id", companyId);
    }

    const { data: allUserData, error: userError } = await userQuery;

    if (userError || !allUserData || allUserData.length === 0) {
      console.error("User lookup error:", userError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userIds = allUserData.map((user: any) => user.id);
    const companyIds = allUserData.map((user: any) => user.company_id);

    // Get doctors from user_doctor_access
    const { data: doctorAccess, error: doctorsError } = await supabase
      .from("user_doctor_access")
      .select(`
        doctors:doctor_id (
          id,
          company_id,
          first_name,
          last_name,
          full_name,
          specialization_id
        )
      `)
      .in("user_id", userIds);

    if (doctorsError) {
      console.error("Doctors lookup error:", doctorsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch doctors" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const doctorsData = (doctorAccess || [])
      .filter((item: any) => item.doctors && companyIds.includes(item.doctors.company_id))
      .map((item: any) => item.doctors);

    if (!doctorsData || doctorsData.length === 0) {
      return new Response(
        JSON.stringify({ error: "No doctors found for this user" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Find the selected doctor and verify access
    const selectedDoctor = doctorsData.find((d: any) => d.id === doctorId);
    if (!selectedDoctor) {
      return new Response(
        JSON.stringify({ error: "Doctor not found or access denied" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get patient records for the medical ID
    let patientQuery = supabase
      .from("patients")
      .select("id, full_name, medical_id, company_id")
      .eq("is_deleted", false)
      .eq("medical_id", patientMedicalId);

    if (companyId) {
      patientQuery = patientQuery.eq("company_id", companyId);
    }

    const { data: patientRecords, error: patientError } = await patientQuery;

    if (patientError || !patientRecords || patientRecords.length === 0) {
      console.error("Patient lookup error:", patientError);
      return new Response(
        JSON.stringify({ error: "Patient not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const patientIds = patientRecords.map(p => p.id);
    const patient = patientRecords[0];

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

    // Fetch eye tests (all tests for this patient, not just from this doctor)
    let eyeTestsQuery = supabase
      .from("eye_tests")
      .select(`
        *,
        doctors(
          id,
          first_name,
          last_name,
          full_name,
          doctor_specializations(name)
        ),
        companies(name)
      `)
      .in("patient_id", patientIds)
      .order("created_at", { ascending: false });

    const { data: eyeTests, error: testsError } = await eyeTestsQuery;

    if (testsError) {
      console.error("Error fetching eye tests:", testsError);
    }

    console.log(`Found ${eyeTests?.length || 0} eye tests`);

    // Format response with document URLs
    const testsWithDocuments = await Promise.all(
      (eyeTests || []).map(async (test: any) => {
        const documents = [];

        // Process attachments if they exist
        if (test.attachments && Array.isArray(test.attachments)) {
          for (const attachmentPath of test.attachments) {
            try {
              // Create signed URL for each document (valid for 1 hour)
              const { data: signedData, error: signedError } = await supabase
                .storage
                .from("eye-test-files")
                .createSignedUrl(attachmentPath, 3600);

              if (signedError) {
                console.error(`Error creating signed URL for ${attachmentPath}:`, signedError);
                continue;
              }

              // Extract filename from path
              const filename = attachmentPath.split('/').pop() || attachmentPath;

              // Determine file type from extension
              const extension = filename.split('.').pop()?.toLowerCase();
              let type = 'application/octet-stream';

              if (extension === 'pdf') {
                type = 'application/pdf';
              } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
                type = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
              }

              documents.push({
                name: filename,
                url: signedData.signedUrl,
                type: type,
                path: attachmentPath
              });
            } catch (error) {
              console.error(`Error processing attachment ${attachmentPath}:`, error);
            }
          }
        }

        return {
          id: test.id,
          test_date: test.created_at,
          test_type: test.test_type,
          results: test.result,
          recommendations: test.recommendations || test.notes || "",
          notes: test.notes,
          doctor_id: test.doctor_id,
          doctor_name: test.doctors?.full_name || `${test.doctors?.first_name} ${test.doctors?.last_name}` || "N/A",
          doctor_specialization: test.doctors?.doctor_specializations?.[0]?.name || "N/A",
          patient_name: patient.full_name,
          patient_medical_id: patient.medical_id,
          created_at: test.created_at,
          documents: documents,
        };
      })
    );

    // Format latest examination
    let latestExamination = null;
    if (latestExam) {
      latestExamination = {
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

    // Format latest prescription
    let latestPrescriptionFormatted = null;
    if (latestPrescription) {
      latestPrescriptionFormatted = {
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

    return new Response(
      JSON.stringify({
        success: true,
        latest_examination: latestExamination,
        latest_prescription: latestPrescriptionFormatted,
        tests: testsWithDocuments,
        recent_tests: testsWithDocuments,
        patient: {
          name: patient.full_name,
          medical_id: patient.medical_id,
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-doctor-vision-tests:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
