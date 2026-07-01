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
    const { medicalId, doctorId } = body;

    if (!medicalId) {
      return new Response(
        JSON.stringify({ error: "Medical ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Fetching eye tests for medical_id:", medicalId, "doctorId:", doctorId);

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

    // Build query for eye tests
    let query = supabase
      .from("eye_tests")
      .select(`
        *,
        doctors(id, first_name, last_name, full_name),
        companies(name)
      `)
      .in("patient_id", patientIds)
      .order("created_at", { ascending: false });

    // Filter by doctor if provided
    if (doctorId) {
      query = query.eq("doctor_id", doctorId);
    }

    const { data: eyeTests, error: testsError } = await query;

    if (testsError) {
      console.error("Error fetching eye tests:", testsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch eye tests", details: testsError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
          date: test.created_at,
          test_type: test.test_type,
          result: test.result,
          notes: test.notes,
          doctor_id: test.doctor_id,
          doctor: test.doctors?.full_name || `${test.doctors?.first_name} ${test.doctors?.last_name}` || "N/A",
          company: test.companies?.name || "N/A",
          documents: documents,
        };
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        tests: testsWithDocuments,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-patient-eye-tests:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
