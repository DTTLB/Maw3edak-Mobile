// POST /mobile-doctor-2fa-disable
// Auth: X-Session-Token. Body: { code: "123456" } (a current TOTP OR a recovery code)
//
// Turns 2FA off on the doctor's PRIMARY account. If not enabled -> { success:true }
// (already off). Otherwise verify the code, then wipe the secret/recovery codes.
// Leaves users.two_factor_required untouched (that's an admin policy).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  checkRateLimit,
  corsHeaders,
  decryptSecret,
  json,
  resolveTwoFactorFromSession,
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

    const sessionToken = req.headers.get("X-Session-Token");
    const ctx = await resolveTwoFactorFromSession(supabase, sessionToken);
    if (!ctx) return json({ error: "Invalid or expired session" }, 401);

    const tf = ctx.twoFactor;

    // Already off — nothing to do.
    if (!tf?.enabled || !tf.secret_encrypted) {
      return json({ success: true });
    }

    const { code } = await req.json().catch(() => ({ code: undefined }));

    // Rate-limit: requiring the current code makes this brute-forceable.
    const allowed = await checkRateLimit(supabase, "2fa_disable", ctx.user.id, 5, 60);
    if (!allowed) {
      return json({ error: "Too many attempts. Please wait a minute." }, 429);
    }

    // Verify a current TOTP, or fall back to a single-use recovery code.
    let verified = false;
    const secret = await decryptSecret(tf.secret_encrypted);
    if (await verifyTotp(code, secret) !== null) {
      verified = true;
    } else {
      const codes = Array.isArray(tf.recovery_codes) ? tf.recovery_codes : [];
      for (const entry of codes) {
        if (entry.used_at) continue;
        if (await verifyRecoveryCode(code, entry.hash)) {
          verified = true;
          break;
        }
      }
    }

    if (!verified) {
      return json({ error: "Invalid verification code" }, 401);
    }

    const { error: wipeError } = await supabase
      .from("user_two_factor")
      .update({
        secret_encrypted: null,
        enabled: false,
        confirmed_at: null,
        recovery_codes: [],
        last_used_step: null,
      })
      .eq("user_id", ctx.user.id);

    if (wipeError) throw wipeError;

    return json({ success: true });
  } catch (error) {
    console.error("mobile-doctor-2fa-disable error:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
