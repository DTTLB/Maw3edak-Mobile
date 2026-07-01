import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Session-Token",
};

// Lightweight session check used by the client to force re-login on devices whose
// session was revoked (e.g. after a password change). Returns { valid: boolean }.
// Validates the custom session token against user_sessions (doctor sessions).
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const sessionToken = req.headers.get("X-Session-Token");
    if (!sessionToken) {
      return json({ valid: false, reason: "missing_token" }, 200);
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from("user_sessions")
      .select("user_id, expires_at")
      .eq("token", sessionToken)
      .maybeSingle();

    if (sessionError) {
      console.error("validate-session lookup error:", sessionError);
      // Don't log the user out on a transient server error — report valid so the
      // client keeps the session and retries later.
      return json({ valid: true, reason: "lookup_error" }, 200);
    }

    if (!sessionData) {
      // Token no longer exists -> it was revoked or never existed.
      return json({ valid: false, reason: "revoked" }, 200);
    }

    if (new Date(sessionData.expires_at) < new Date()) {
      return json({ valid: false, reason: "expired" }, 200);
    }

    return json({ valid: true }, 200);
  } catch (error) {
    console.error("Error in mobile-validate-session:", error);
    // Fail open on unexpected errors so we never bounce a user incorrectly.
    return json({ valid: true, reason: "error" }, 200);
  }
});
