// GET /mobile-doctor-2fa-status
// Auth: X-Session-Token. No body.
//
// Resolves the doctor's PRIMARY account (is_primary_company=true for their
// global_id) and reports whether 2FA is enabled and whether an admin forced it.
// The doctor settings screen uses `enabled` to set the toggle's initial state.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders,
  json,
  resolveTwoFactorFromSession,
  resolveUserFromSession,
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

    // Whether the company the doctor is CURRENTLY signed into is their primary
    // one. 2FA may only be managed from the primary company; from any other
    // company the mobile toggle is read-only. (2FA itself is global to the
    // doctor's identity — this only gates WHERE it can be changed from.)
    // Receptionists / single-company staff have no global_id and exactly one
    // row, so they can always manage their own 2FA.
    const sessionUserId = await resolveUserFromSession(supabase, sessionToken);
    const { data: sessionRow } = await supabase
      .from("users")
      .select("is_primary_company")
      .eq("is_deleted", false)
      .eq("id", sessionUserId)
      .maybeSingle();

    const canManage = ctx.user.global_id ? !!sessionRow?.is_primary_company : true;

    return json({
      success: true,
      enabled: !!ctx.twoFactor?.enabled,
      required: ctx.required,
      isPrimaryCompany: canManage,
    });
  } catch (error) {
    console.error("mobile-doctor-2fa-status error:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
