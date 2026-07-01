import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { randomBytes, pbkdf2Sync } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Session-Token",
};

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derivedKey = pbkdf2Sync(password, salt, 100000, 32, "sha256");
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(":")) {
    return false;
  }

  const [saltHex, storedHashHex] = storedHash.split(":");

  const saltBytes = new Uint8Array(
    saltHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  const derivedKey = pbkdf2Sync(password, saltBytes, 100000, 32, "sha256");

  const computedHashHex = Array.from(derivedKey)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computedHashHex === storedHashHex;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate via custom session token (same pattern as other doctor endpoints)
    const sessionToken = req.headers.get("X-Session-Token");
    if (!sessionToken) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing session token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from("user_sessions")
      .select("user_id, expires_at")
      .eq("token", sessionToken)
      .maybeSingle();

    if (sessionError || !sessionData) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new Date(sessionData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: "Session expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ success: false, error: "Password must be at least 8 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up the doctor account for this session
    const { data: doctor, error: fetchError } = await supabase
      .from("users")
      .select("id, global_id, password_hash")
      .eq("is_deleted", false)
      .eq("id", sessionData.user_id)
      .maybeSingle();

    if (fetchError || !doctor) {
      return new Response(
        JSON.stringify({ success: false, error: "Doctor not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!verifyPassword(currentPassword, doctor.password_hash)) {
      return new Response(
        JSON.stringify({ success: false, error: "Current password is incorrect" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newPasswordHash = hashPassword(newPassword);

    // A doctor with access to multiple companies has ONE users row per (doctor, company),
    // all sharing the same global_id, and password_hash is stored per-row. So when the
    // doctor has a global_id, update EVERY account that shares it to keep the password
    // identical across all their clinics (same canonical pattern as darkmode/language/
    // notifications/security). Fall back to this single row only if there is no global_id.
    const { data: updatedRows, error: updateError } = doctor.global_id
      ? await supabase
          .from("users")
          .update({ password_hash: newPasswordHash })
          .eq("global_id", doctor.global_id)
          .select("id")
      : await supabase
          .from("users")
          .update({ password_hash: newPasswordHash })
          .eq("id", doctor.id)
          .select("id");

    if (updateError) {
      console.error("Update doctor password error:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to update password" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const updatedCount = updatedRows?.length ?? 0;
    console.log(
      `Doctor password updated for global_id=${doctor.global_id ?? "(none)"} across ${updatedCount} account(s)`
    );

    // Force re-login on the doctor's OTHER devices: invalidate every active session
    // belonging to any account that shares this global_id, except the session that just
    // made this change (so the current device stays logged in). Protected endpoints look
    // the token up in user_sessions and return 401 when it is gone, so other devices are
    // bounced to the login screen on their next request.
    const accountIds = (updatedRows && updatedRows.length > 0)
      ? updatedRows.map((r) => r.id)
      : [doctor.id];

    let revokedSessions = 0;
    const { data: revokedRows, error: revokeError } = await supabase
      .from("user_sessions")
      .delete()
      .in("user_id", accountIds)
      .neq("token", sessionToken)
      .select("token");

    if (revokeError) {
      // Non-fatal: the password change already succeeded. Log and continue.
      console.error("Failed to revoke other sessions:", revokeError);
    } else {
      revokedSessions = revokedRows?.length ?? 0;
      console.log(`Revoked ${revokedSessions} other session(s) after password change`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password updated successfully",
        updated_accounts: updatedCount,
        revoked_sessions: revokedSessions,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error changing doctor password:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
