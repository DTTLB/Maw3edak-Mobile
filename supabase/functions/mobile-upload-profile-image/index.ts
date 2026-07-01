import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  console.log("=== Upload Profile Image Request Started ===");
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

    console.log("Parsing form data...");
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const fileExt = formData.get("fileExt") as string;
    const medicalId = formData.get("medicalId") as string;

    console.log("Medical ID from form:", medicalId);

    if (!medicalId) {
      console.log("ERROR: Missing medical ID");
      return new Response(
        JSON.stringify({ error: "Medical ID required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Looking up patient by medical_id...");
    const { data: patient, error: patientError } = await supabase
      .from("user_patients")
      .select("id")
      .eq("is_deleted", false)
      .eq("medical_id", medicalId)
      .maybeSingle();

    if (patientError || !patient) {
      console.log("ERROR: Patient not found", patientError);
      return new Response(
        JSON.stringify({ error: "Invalid medical ID" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const patientId = patient.id;
    console.log("Patient ID:", patientId);

    console.log("File received:", !!file);
    console.log("File ext:", fileExt);
    if (file) {
      console.log("File size:", file.size);
      console.log("File type:", file.type);
      console.log("File name:", file.name);
    }

    if (!file) {
      console.log("ERROR: No file in form data");
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const fileName = `${patientId}-${Date.now()}.${fileExt || "jpg"}`;
    console.log("Uploading to storage with filename:", fileName);

    const fileBuffer = await file.arrayBuffer();
    console.log("File buffer size:", fileBuffer.byteLength);

    if (fileBuffer.byteLength === 0) {
      console.log("ERROR: File buffer is empty");
      return new Response(
        JSON.stringify({ error: "File is empty" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("patient-profiles")
      .upload(fileName, fileBuffer, {
        contentType: file.type || `image/${fileExt || "jpg"}`,
        upsert: false,
      });

    console.log("Upload completed");
    console.log("Upload data:", uploadData);
    console.log("Upload error:", uploadError);

    if (uploadError) {
      console.error("=== UPLOAD ERROR ===");
      console.error("Upload error:", uploadError);
      console.error("Upload error details:", JSON.stringify(uploadError, null, 2));
      console.error("Patient ID:", patientId);
      console.error("File name:", fileName);
      console.error("File type:", file.type);
      console.error("Bucket:", "patient-profiles");
      console.error("File buffer size:", fileBuffer.byteLength);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to upload image",
          details: uploadError.message || "Unknown error",
          code: uploadError.code || "UNKNOWN",
          hint: uploadError.hint || "No hint available"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("SUCCESS: Upload successful, returning response");
    return new Response(
      JSON.stringify({
        success: true,
        fileName: fileName,
        path: uploadData.path,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("=== EXCEPTION in mobile-upload-profile-image ===");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("Exception stack:", error.stack);
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