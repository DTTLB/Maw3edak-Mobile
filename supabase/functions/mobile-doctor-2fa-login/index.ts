// POST /mobile-doctor-2fa-login
// Body: { pendingToken, code }   (code = 6-digit TOTP OR a recovery code)
//
// Stage 2 of doctor login. Validates the short-lived pending token minted by
// doctor-mobile-login's 2FA gate, verifies the second factor against the
// doctor's canonical 2FA record (with replay protection for TOTP / single-use
// for recovery codes), consumes the token, then EITHER:
//   - issues the real session + payload (session, user, companies,
//     accessible_doctors) — when the clinic is already known (single active
//     company, or the pending token carried a company_id); OR
//   - returns { requiresCompanySelection, companies, twoFactorToken } — when the
//     doctor belongs to several active clinics and hasn't chosen yet. The
//     `twoFactorToken` proves 2FA passed; the mobile re-calls doctor-mobile-login
//     with the chosen company_id + this token to finish without re-prompting.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { randomBytes } from "node:crypto";
import {
  checkRateLimit,
  corsHeaders,
  decryptSecret,
  json,
  resolveDoctorTwoFactorByGlobalId,
  verifyRecoveryCode,
  verifyTotp,
} from "../_shared/two-factor.ts";
import {
  issueDoctorSession,
  loadDoctorContextByUserId,
} from "../_shared/doctor-session.ts";

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
      .from("two_factor_login_tokens")
      .select("token, user_id, company_id, expires_at, consumed_at")
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

    // Rate-limit per user (the pending token is scoped to one user).
    const allowed = await checkRateLimit(supabase, "2fa_login", pending.user_id, 5, 60);
    if (!allowed) {
      return json({ error: "Too many attempts. Please wait a minute." }, 429);
    }

    // 2FA is global to the doctor's identity. Resolve the canonical 2FA row
    // (which may live on any clinic row) from the selected row's global_id.
    const { data: selectedUser } = await supabase
      .from("users")
      .select("global_id")
      .eq("is_deleted", false)
      .eq("id", pending.user_id)
      .maybeSingle();

    const ctx = await resolveDoctorTwoFactorByGlobalId(
      supabase,
      selectedUser?.global_id,
    );
    if (!ctx) return json({ error: "User not found" }, 404);

    const tf = ctx.twoFactor;
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
        .from("user_two_factor")
        .update({ last_used_step: step })
        .eq("user_id", ctx.user.id);
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
          .from("user_two_factor")
          .update({ recovery_codes: codes })
          .eq("user_id", ctx.user.id);
        verified = true;
      }
    }

    if (!verified) {
      return json({ error: "Invalid verification code" }, 401);
    }

    // --- consume the pending token, then issue the real session -------------
    await supabase
      .from("two_factor_login_tokens")
      .update({ consumed_at: new Date().toISOString() })
      .eq("token", pendingToken);

    // Build the same context (selected company + valid-subscription companies)
    // doctor-mobile-login would have.
    const lctx = await loadDoctorContextByUserId(supabase, pending.user_id);
    if (!lctx) return json({ error: "User not found" }, 404);

    // If the clinic isn't decided yet (no company_id on the pending token) and
    // the doctor has more than one active clinic, hand back the clinic list +
    // a proof token instead of a session — the mobile finishes via
    // doctor-mobile-login(company_id, twoFactorToken).
    if (!pending.company_id && lctx.activeDoctors.length > 1) {
      const proofToken = randomBytes(32).toString("hex");
      const proofExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

      const { error: proofError } = await supabase
        .from("two_factor_login_tokens")
        .insert({
          token: proofToken,
          user_id: pending.user_id,
          company_id: null,
          expires_at: proofExpiresAt.toISOString(),
          two_factor_passed: true,
        });

      if (proofError) {
        console.error("Failed to mint 2FA proof token:", proofError.message);
        return json({ error: "Failed to complete verification" }, 500);
      }

      const companies = lctx.activeDoctors.map((u: any) => ({
        company_id: u.company_id,
        company_name: u.companies?.name || "Unknown Company",
        company_slug: u.companies?.slug,
        user_id: u.id,
        role: u.role,
      }));

      return json({
        requiresCompanySelection: true,
        companies,
        twoFactorToken: proofToken,
      });
    }

    // Clinic is known (single active company, or the pending token carried a
    // company_id) — issue the session + payload now.
    const payload = await issueDoctorSession(
      supabase,
      lctx.selectedDoctor,
      lctx.activeDoctors,
      body,
    );

    return json(payload);
  } catch (error) {
    console.error("mobile-doctor-2fa-login error:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
