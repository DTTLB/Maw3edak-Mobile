// POST /mobile-doctor-2fa-setup
// Auth: X-Session-Token. No body.
//
// Step 1 of enrollment. Generates a base32 secret, stores it as PENDING
// (encrypted, enabled still false) on the doctor's PRIMARY account, and returns
// the otpauth:// URI + raw secret for the QR code / manual entry. Nothing is
// enabled until mobile-doctor-2fa-confirm succeeds.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  buildOtpauthUri,
  corsHeaders,
  encryptSecret,
  generateSecret,
  json,
  resolveTwoFactorFromSession,
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

    // Don't let an already-enabled doctor silently overwrite a working secret.
    if (ctx.twoFactor?.enabled) {
      return json({ error: "Two-factor is already enabled" }, 409);
    }

    // Write the PENDING secret to the canonical 2FA row (an existing pending
    // record if any, otherwise the primary account).
    const secret = generateSecret();
    const otpauthUri = buildOtpauthUri(ctx.user.email, secret);

    const { error: upsertError } = await supabase
      .from("user_two_factor")
      .upsert({
        user_id: ctx.user.id,
        secret_encrypted: await encryptSecret(secret),
        enabled: false,
        confirmed_at: null,
        last_used_step: null,
      }, { onConflict: "user_id" });

    if (upsertError) throw upsertError;

    // QR is rendered client-side from otpauthUri. `secret` is returned for
    // manual entry into the authenticator app.
    return json({ otpauthUri, secret });
  } catch (error) {
    console.error("mobile-doctor-2fa-setup error:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
