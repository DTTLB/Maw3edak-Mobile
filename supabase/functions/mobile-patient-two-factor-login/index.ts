// POST /mobile-patient-two-factor-login
// Body: { pendingToken, code }   (code = 6-digit TOTP OR a recovery code)
//
// Stage 2 of patient login. Validates the short-lived pending token minted by
// mobile-patient-login's 2FA gate, verifies the second factor against the
// patient's enabled secret (with replay protection for TOTP / single-use for
// recovery codes), consumes the token, then issues the normal mobile patient
// session and returns the same payload (session, user, patient) as a normal
// login.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { randomBytes } from "node:crypto";
import {
  checkRateLimit,
  corsHeaders,
  decryptSecret,
  json,
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

    const body = await req.json().catch(() => ({}));
    const { pendingToken, code } = body;
    if (!pendingToken || !code) {
      return json({ error: "Missing token or code" }, 400);
    }

    // --- validate the pending (2FA-step-only) token --------------------------
    const { data: pending } = await supabase
      .from("patient_two_factor_login_tokens")
      .select("token, patient_id, expires_at, consumed_at")
      .eq("token", pendingToken)
      .maybeSingle();

    if (
      !pending ||
      pending.consumed_at ||
      new Date(pending.expires_at).getTime() < Date.now()
    ) {
      return json(
        { error: "This sign-in session has expired. Please log in again." },
        401,
      );
    }

    // Rate-limit per patient (the pending token is scoped to one patient).
    const allowed = await checkRateLimit(supabase, "2fa_patient_login", pending.patient_id, 5, 60);
    if (!allowed) {
      return json({ error: "Too many attempts. Please wait a minute." }, 429);
    }

    const { data: tf } = await supabase
      .from("patient_two_factor")
      .select("secret_encrypted, enabled, recovery_codes, last_used_step")
      .eq("patient_id", pending.patient_id)
      .maybeSingle();

    if (!tf?.enabled || !tf.secret_encrypted) {
      return json({ error: "Two-factor is not enabled for this account" }, 400);
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
      await supabase
        .from("patient_two_factor")
        .update({ last_used_step: step })
        .eq("patient_id", pending.patient_id);
      verified = true;
    }

    // --- 2) otherwise try a single-use recovery code -------------------------
    if (!verified) {
      const codes = Array.isArray(tf.recovery_codes) ? tf.recovery_codes : [];
      let matchedIndex = -1;
      for (let i = 0; i < codes.length; i++) {
        if (codes[i].used_at) continue;
        if (await verifyRecoveryCode(code, codes[i].hash)) {
          matchedIndex = i;
          break;
        }
      }
      if (matchedIndex >= 0) {
        codes[matchedIndex].used_at = new Date().toISOString();
        await supabase
          .from("patient_two_factor")
          .update({ recovery_codes: codes })
          .eq("patient_id", pending.patient_id);
        verified = true;
      }
    }

    if (!verified) {
      return json({ error: "Invalid verification code" }, 401);
    }

    // --- consume the pending token, then issue the real session -------------
    await supabase
      .from("patient_two_factor_login_tokens")
      .update({ consumed_at: new Date().toISOString() })
      .eq("token", pendingToken);

    // Load the patient profile for the session payload (same shape as
    // mobile-patient-login).
    const { data: patient } = await supabase
      .from("user_patients")
      .select("id, medical_id, first_name, last_name, email, phone, date_of_birth, gender, blood_type, address, profile_image")
      .eq("is_deleted", false)
      .eq("id", pending.patient_id)
      .maybeSingle();

    if (!patient) return json({ error: "Patient not found" }, 404);

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { error: sessionError } = await supabase
      .from("user_patient_sessions")
      .insert({
        patient_id: patient.id,
        token: token,
        expires_at: expiresAt.toISOString(),
      });

    if (sessionError) {
      return json(
        { error: "Failed to create session", details: sessionError.message },
        500,
      );
    }

    const userData = {
      id: patient.id,
      medical_id: patient.medical_id,
      first_name: patient.first_name,
      last_name: patient.last_name,
      email: patient.email,
      phone: patient.phone,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      blood_type: patient.blood_type,
      address: patient.address,
      profile_image: patient.profile_image,
    };

    return json({
      session: {
        token: token,
        expires_at: expiresAt.getTime(),
      },
      user: userData,
      patient: userData,
    });
  } catch (error) {
    console.error("mobile-patient-two-factor-login error:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
