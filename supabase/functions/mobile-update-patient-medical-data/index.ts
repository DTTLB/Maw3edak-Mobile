import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Whitelist of editable columns per table. medical_id is intentionally excluded —
// the server always stamps the resolved medical_id and never trusts a client value.
const ALLOWED_FIELDS: Record<string, string[]> = {
  allergies: ["allergen", "type", "severity", "reaction"],
  emergency_contacts: ["name", "relationship", "phone", "is_primary"],
  conditions: ["condition", "diagnosed_on", "notes"],
  surgeries: ["procedure", "performed_on", "notes"],
};

function pickAllowedFields(table: string, payload: Record<string, unknown>) {
  const allowed = ALLOWED_FIELDS[table];
  const result: Record<string, unknown> = {};
  for (const field of allowed) {
    if (payload[field] !== undefined) {
      result[field] = payload[field];
    }
  }
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("mobile-update-patient-medical-data called");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    console.log("Authorization header present:", !!authHeader);

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
    console.log("Token extracted, length:", token.length);

    const { data: sessionData, error: sessionError } = await supabase
      .from("user_patient_sessions")
      .select("patient_id, expires_at")
      .eq("token", token)
      .maybeSingle();

    console.log("Session lookup result:", { found: !!sessionData, error: sessionError });

    if (sessionError || !sessionData) {
      console.error("Session error:", sessionError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token", details: sessionError?.message }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (new Date(sessionData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Token has expired" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: patientData, error: patientError } = await supabase
      .from("user_patients")
      .select("medical_id")
      .eq("is_deleted", false)
      .eq("id", sessionData.patient_id)
      .maybeSingle();

    console.log("Patient lookup result:", { found: !!patientData, error: patientError });

    if (patientError || !patientData) {
      console.error("Patient error:", patientError);
      return new Response(
        JSON.stringify({ error: "Patient not found", details: patientError?.message }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const medicalId = patientData.medical_id;

    if (!medicalId) {
      return new Response(
        JSON.stringify({ error: "Patient has no medical record" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const { table, operation, payload, id } = body;
    console.log("Request:", { table, operation, id, hasPayload: !!payload });

    if (!table || !ALLOWED_FIELDS[table]) {
      return new Response(
        JSON.stringify({ error: "Invalid table" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!["insert", "update", "delete"].includes(operation)) {
      return new Response(
        JSON.stringify({ error: "Invalid operation" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (operation === "insert") {
      const fields = pickAllowedFields(table, payload ?? {});

      // Always stamp the server-resolved medical_id — never trust the client.
      const insertData = {
        ...fields,
        medical_id: medicalId,
        is_active: true,
      };

      const { data: inserted, error: insertError } = await supabase
        .from(table)
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to add record", details: insertError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, record: inserted }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // update and delete both target an existing row by id and must verify ownership.
    if (!id) {
      return new Response(
        JSON.stringify({ error: "Record id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: existing, error: existingError } = await supabase
      .from(table)
      .select("medical_id")
      .eq("id", id)
      .maybeSingle();

    if (existingError || !existing) {
      console.error("Target row lookup error:", existingError);
      return new Response(
        JSON.stringify({ error: "Record not found", details: existingError?.message }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Ownership check: the target row must belong to this patient's medical record.
    if (existing.medical_id !== medicalId) {
      console.warn("Ownership mismatch on", table, "id", id);
      return new Response(
        JSON.stringify({ error: "Not authorized to modify this record" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (operation === "update") {
      const fields = pickAllowedFields(table, payload ?? {});

      if (Object.keys(fields).length === 0) {
        return new Response(
          JSON.stringify({ error: "No fields to update" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const updateData = {
        ...fields,
        updated_at: new Date().toISOString(),
      };

      const { data: updated, error: updateError } = await supabase
        .from(table)
        .update(updateData)
        .eq("id", id)
        .eq("medical_id", medicalId)
        .select()
        .single();

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update record", details: updateError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, record: updated }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // operation === "delete" — soft delete only.
    const { error: deleteError } = await supabase
      .from(table)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("medical_id", medicalId);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to remove record", details: deleteError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-update-patient-medical-data:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
