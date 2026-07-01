// POST /patient-two-factor-disable
// Body: { sessionToken, code }   (code = 6-digit TOTP OR a recovery code)
//
// Mirrors the doctor disable flow for patients. Verifies the current second
// factor against the patient's enabled secret, then wipes the patient_two_factor
// row. user_patients.two_factor_required is left as-is (an admin-forced flag).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  checkRateLimit,
  corsHeaders,
  decryptSecret,
  json,
  resolvePatientFromSession,
  verifyRecoveryCode,
  verifyTotp,
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

    const { sessionToken, code } = await req.json().catch(() => ({}));
    const patient = await resolvePatientFromSession(supabase, sessionToken);
    if (!patient) return json({ error: "Invalid or expired session" }, 401);

    // Rate-limit: a 6-digit code is brute-forceable otherwise.
    const allowed = await checkRateLimit(supabase, "2fa_disable", patient.id, 5, 60);
    if (!allowed) {
      return json({ error: "Too many attempts. Please wait a minute." }, 429);
    }

    const { data: tf } = await supabase
      .from("patient_two_factor")
      .select("secret_encrypted, enabled, recovery_codes, last_used_step")
      .eq("patient_id", patient.id)
      .maybeSingle();

    if (!tf?.enabled || !tf.secret_encrypted) {
      return json({ error: "Two-factor is not enabled" }, 400);
    }

    let verified = false;

    // --- 1) try TOTP ---------------------------------------------------------
    const secret = await decryptSecret(tf.secret_encrypted);
    const step = await verifyTotp(code, secret);
    if (step !== null) {
      // Replay protection: reject a code at or below the last accepted step.
      if (tf.last_used_step !== null && step <= tf.last_used_step) {
        return json({ error: "This code has already been used" }, 401);
      }
      verified = true;
    }

    // --- 2) otherwise try a single-use recovery code -------------------------
    if (!verified) {
      const codes = Array.isArray(tf.recovery_codes) ? tf.recovery_codes : [];
      for (let i = 0; i < codes.length; i++) {
        if (codes[i].used_at) continue;
        if (await verifyRecoveryCode(code, codes[i].hash)) {
          verified = true;
          break;
        }
      }
    }

    if (!verified) {
      return json({ error: "Invalid verification code" }, 401);
    }

    // Wipe the 2FA row entirely. two_factor_required (admin flag) stays as-is.
    const { error: deleteError } = await supabase
      .from("patient_two_factor")
      .delete()
      .eq("patient_id", patient.id);

    if (deleteError) throw deleteError;

    return json({ success: true });
  } catch (error) {
    console.error("patient-two-factor-disable error:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
