import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Session-Token",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const sessionToken = req.headers.get("X-Session-Token");
    if (!sessionToken) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing session token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { companyId } = await req.json();
    if (!companyId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing companyId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify session token in user_sessions table (for doctor logins)
    const { data: sessionData, error: sessionError } = await supabase
      .from("user_sessions")
      .select("user_id, expires_at")
      .eq("token", sessionToken)
      .maybeSingle();

    if (sessionError || !sessionData) {
      console.error("Session verification error:", sessionError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired session" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if session is expired
    const expiresAt = new Date(sessionData.expires_at);
    if (expiresAt < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: "Session expired" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = sessionData.user_id;

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, global_id, company_id")
      .eq("is_deleted", false)
      .eq("id", userId)
      .maybeSingle();

    if (userError || !userData) {
      console.error("User lookup error:", userError);
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Find the user record for the target company
    const { data: targetUser, error: targetUserError } = await supabase
      .from("users")
      .select("id, company_id, email, mobile, full_name, role")
      .eq("is_deleted", false)
      .eq("global_id", userData.global_id)
      .eq("company_id", companyId)
      .eq("is_active", true)
      .maybeSingle();

    if (targetUserError || !targetUser) {
      console.error("Target user lookup error:", targetUserError);
      return new Response(
        JSON.stringify({ success: false, error: "You don't have access to this company" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Block switching into a company whose subscription has expired.
    // Valid = an active subscription row with no end_date or end_date in the future.
    const { data: subs, error: subsError } = await supabase
      .from("company_subscriptions")
      .select("end_date, is_active")
      .eq("company_id", companyId)
      .eq("is_active", true);

    if (subsError) {
      console.error("Subscription lookup error:", subsError.message);
    }

    const now = new Date();
    const hasValidSubscription = (subs || []).some(
      (sub) => !sub.end_date || new Date(sub.end_date) >= now
    );

    if (!hasValidSubscription) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Your company's subscription has expired. Please contact your administrator.",
          code: "SUBSCRIPTION_EXPIRED",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update the session to point to the new user_id
    const { error: updateError } = await supabase
      .from("user_sessions")
      .update({ user_id: targetUser.id })
      .eq("token", sessionToken);

    if (updateError) {
      console.error("Error updating session:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to switch company", details: updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`User session updated from ${userData.id} to ${targetUser.id} (company ${companyId})`);

    // Get settings from the primary company (where is_primary_company = true)
    const { data: primaryUser, error: primaryUserError } = await supabase
      .from("users")
      .select("biometric_login, lock_method, allow_notifications, darkmode")
      .eq("is_deleted", false)
      .eq("global_id", userData.global_id)
      .eq("is_primary_company", true)
      .eq("is_active", true)
      .maybeSingle();

    let primarySettings = {
      biometric_login_enabled: false,
      allow_notifications: true,
      darkmode: false,
    };

    if (primaryUser && !primaryUserError) {
      primarySettings = {
        biometric_login_enabled: primaryUser.biometric_login ?? false,
        allow_notifications: primaryUser.allow_notifications ?? true,
        darkmode: primaryUser.darkmode ?? false,
      };
      console.log('Primary company settings:', primarySettings);
    } else {
      console.log('No primary company found or error:', primaryUserError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        settings: primarySettings
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-switch-company:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
