// POST /mobile-doctor-2fa-confirm
// Auth: X-Session-Token. Body: { code: "123456" }
//
// Step 2 of enrollment. Verifies the 6-digit code against the PENDING secret on
// the doctor's PRIMARY account. Only on success: enabled=true, confirmed_at=now,
// last_used_step=<matched step>, and 10 one-time recovery codes are generated,
// hashed, stored, and returned ONCE in plaintext.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  checkRateLimit,
  corsHeaders,
  decryptSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
  json,
  resolveTwoFactorFromSession,
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

    const sessionToken = req.headers.get("X-Session-Token");
    const ctx = await resolveTwoFactorFromSession(supabase, sessionToken);
    if (!ctx) return json({ error: "Invalid or expired session" }, 401);

    const { code } = await req.json().catch(() => ({ code: undefined }));

    // Rate-limit: a 6-digit code is brute-forceable otherwise.
    const allowed = await checkRateLimit(supabase, "2fa_confirm", ctx.user.id, 5, 60);
    if (!allowed) {
      return json({ error: "Too many attempts. Please wait a minute." }, 429);
    }

    const tf = ctx.twoFactor;
    if (!tf?.secret_encrypted) {
      return json({ error: "No pending two-factor setup found" }, 400);
    }
    if (tf.enabled) {
      return json({ error: "Two-factor is already enabled" }, 409);
    }

    const secret = await decryptSecret(tf.secret_encrypted);
    const step = await verifyTotp(code, secret);
    if (step === null) {
      return json({ error: "Invalid verification code" }, 401);
    }

    const recoveryCodes = generateRecoveryCodes(10);
    const hashed = await Promise.all(
      recoveryCodes.map(async (c) => ({
        hash: await hashRecoveryCode(c),
        used_at: null,
      })),
    );

    const { error: updateError } = await supabase
      .from("user_two_factor")
      .update({
        enabled: true,
        confirmed_at: new Date().toISOString(),
        last_used_step: step, // prevent replay of the confirmation code at login
        recovery_codes: hashed,
      })
      .eq("user_id", ctx.user.id);

    if (updateError) throw updateError;

    return json({ success: true, recoveryCodes });
  } catch (error) {
    console.error("mobile-doctor-2fa-confirm error:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
