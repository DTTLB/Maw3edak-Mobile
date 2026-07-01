// POST /patient-two-factor-status
// Body: { sessionToken }
//
// Mirrors mobile-doctor-2fa-status for patients. Resolves the patient from their
// mobile session token and reports whether 2FA is enabled and whether an admin
// forced it. The patient settings screen uses `enabled` to set the toggle's
// initial state and `required` to lock it ON.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders,
  json,
  resolvePatientFromSession,
} from "../_shared/two-factor.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { sessionToken } = await req.json().catch(() => ({ sessionToken: undefined }));
    const patient = await resolvePatientFromSession(supabase, sessionToken);
    if (!patient) return json({ error: "Invalid or expired session" }, 401);

    const { data: tf } = await supabase
      .from("patient_two_factor")
      .select("enabled")
      .eq("patient_id", patient.id)
      .maybeSingle();

    return json({
      success: true,
      enabled: !!tf?.enabled,
      required: !!patient.two_factor_required,
    });
  } catch (error) {
    console.error("patient-two-factor-status error:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
