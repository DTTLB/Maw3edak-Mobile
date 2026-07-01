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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const sessionToken = req.headers.get("X-Session-Token");
    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: "Missing session token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Get doctor notifications - Token received");

    const { data: sessionData, error: sessionError } = await supabase
      .from("user_sessions")
      .select("user_id, expires_at")
      .eq("token", sessionToken)
      .maybeSingle();

    console.log("Session lookup result:", { found: !!sessionData, error: sessionError?.message });

    if (sessionError || !sessionData) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (new Date(sessionData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Token has expired" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: userData } = await supabase
      .from("users")
      .select("id, global_id, company_id")
      .eq("is_deleted", false)
      .eq("id", sessionData.user_id)
      .maybeSingle();

    console.log("User lookup:", { found: !!userData, global_id: userData?.global_id, company_id: userData?.company_id });

    if (!userData || !userData.global_id) {
      return new Response(
        JSON.stringify({ error: "User not found or missing global_id" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Fetching notifications for global_id:", userData.global_id);
    console.log("Current company_id:", userData.company_id);

    // Fetch authorization notifications separately (simple query by global_id)
    // Filter by current company_id
    const { data: authNotifications, error: authError } = await supabase
      .from("doctor_notifications")
      .select(`
        id,
        category,
        message_header,
        message_body,
        read,
        created_at,
        objective_id,
        completed,
        auth_status,
        company_id,
        companies:company_id(name)
      `)
      .eq("global_id", userData.global_id)
      .eq("category", "authorization")
      .eq("company_id", userData.company_id)
      .order("created_at", { ascending: false });

    if (authError) {
      console.error("Error fetching authorization notifications:", authError);
    }

    // Format authorization notifications to match structure
    const formattedAuthNotifications = (authNotifications || []).map((notif: any) => ({
      ...notif,
      company_name: notif.companies?.name || null,
      companies: undefined,
    }));

    // Fetch other notifications with proper joins through user_doctor_access
    // Filter by current company_id
    const { data: otherNotifications, error: otherError } = await supabase.rpc(
      "get_doctor_notifications_via_access",
      {
        p_global_id: userData.global_id,
        p_company_id: userData.company_id,
      }
    );

    if (otherError) {
      console.error("Error fetching other notifications:", otherError);
    }

    // Combine both result sets
    const notifications = [
      ...formattedAuthNotifications,
      ...(otherNotifications || []),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
     .slice(0, 100);

    console.log("Notifications found:", notifications?.length || 0);

    if (authError && otherError) {
      console.error("Error fetching notifications:", { authError, otherError });
      return new Response(
        JSON.stringify({ error: "Failed to fetch notifications" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const unreadCount = notifications?.filter((n) => !n.read).length || 0;

    return new Response(
      JSON.stringify({
        success: true,
        notifications: notifications || [],
        unreadCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-doctor-notifications:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});