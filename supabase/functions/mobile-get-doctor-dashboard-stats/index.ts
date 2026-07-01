import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { isUuid } from "../_shared/resolve-access.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const globalId = url.searchParams.get("global_id");
    const userId = url.searchParams.get("user_id");
    const companyId = url.searchParams.get("company_id");

    if (!globalId && !userId) {
      return new Response(
        JSON.stringify({ error: "global_id or user_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Dashboard stats params:', { globalId, userId, companyId });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log('Date range:', { todayStr, tomorrowStr });

    let userRecord: any = null;

    if (globalId) {
      const { data, error } = await supabase
        .from('users')
        .select('id, profile_image, role, company_id')
        .eq('is_deleted', false)
        .eq('global_id', globalId)
        .eq('is_primary_company', true)
        .maybeSingle();
      if (error) console.error('Error fetching user by global_id:', error);
      userRecord = data;
    }

    // Receptionist support: the app sends the receptionist's user_id in the
    // `global_id` slot (a UUID). If global_id didn't resolve and it's a UUID,
    // resolve it as a user_id so the staff/doctor RPCs can scope via
    // user_doctor_access by user_id.
    const userIdParam = userId || (isUuid(globalId) ? globalId : null);

    if (!userRecord && userIdParam) {
      const { data, error } = await supabase
        .from('users')
        .select('id, profile_image, role, company_id')
        .eq('is_deleted', false)
        .eq('id', userIdParam)
        .maybeSingle();
      if (error) console.error('Error fetching user by user_id:', error);
      userRecord = data;
    }

    const resolvedUserId: string | null = userRecord?.id || userIdParam || null;
    const resolvedCompanyId: string | null = companyId || userRecord?.company_id || null;
    const userRole: string = userRecord?.role || 'doctor';

    console.log('Resolved user:', { resolvedUserId, resolvedCompanyId, userRole });

    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    let todaySchedule = 0;
    let cancelledCount = 0;
    let completedToday = 0;
    let pendingToday = 0;

    if (isAdmin && resolvedCompanyId) {
      const [s, c, co, p] = await Promise.all([
        supabase.rpc("get_admin_today_schedule", {
          p_user_id: resolvedUserId,
          p_company_id: resolvedCompanyId,
          p_today: todayStr,
          p_tomorrow: tomorrowStr,
        }),
        supabase.rpc("get_admin_cancelled_count", {
          p_user_id: resolvedUserId,
          p_company_id: resolvedCompanyId,
          p_today: todayStr,
          p_tomorrow: tomorrowStr,
        }),
        supabase.rpc("get_admin_completed_today", {
          p_user_id: resolvedUserId,
          p_company_id: resolvedCompanyId,
          p_today: todayStr,
          p_tomorrow: tomorrowStr,
        }),
        supabase.rpc("get_admin_pending_today", {
          p_user_id: resolvedUserId,
          p_company_id: resolvedCompanyId,
          p_today: todayStr,
          p_tomorrow: tomorrowStr,
        }),
      ]);
      if (s.error) console.error("Error admin today schedule:", s.error);
      if (c.error) console.error("Error admin cancelled:", c.error);
      if (co.error) console.error("Error admin completed:", co.error);
      if (p.error) console.error("Error admin pending:", p.error);
      todaySchedule = s.data || 0;
      cancelledCount = c.data || 0;
      completedToday = co.data || 0;
      pendingToday = p.data || 0;
    } else {
      const [s, c, co, p] = await Promise.all([
        supabase.rpc("get_doctor_today_schedule", {
          p_global_id: globalId || null,
          p_user_id: resolvedUserId || null,
          p_today: todayStr,
          p_tomorrow: tomorrowStr,
          p_company_id: resolvedCompanyId || null,
        }),
        supabase.rpc("get_doctor_cancelled_count", {
          p_global_id: globalId || null,
          p_user_id: resolvedUserId || null,
          p_today: todayStr,
          p_tomorrow: tomorrowStr,
          p_company_id: resolvedCompanyId || null,
        }),
        supabase.rpc("get_doctor_completed_today", {
          p_global_id: globalId || null,
          p_user_id: resolvedUserId || null,
          p_today: todayStr,
          p_tomorrow: tomorrowStr,
          p_company_id: resolvedCompanyId || null,
        }),
        supabase.rpc("get_doctor_pending_today", {
          p_global_id: globalId || null,
          p_user_id: resolvedUserId || null,
          p_today: todayStr,
          p_tomorrow: tomorrowStr,
          p_company_id: resolvedCompanyId || null,
        }),
      ]);
      if (s.error) console.error("Error doctor today schedule:", s.error);
      if (c.error) console.error("Error doctor cancelled:", c.error);
      if (co.error) console.error("Error doctor completed:", co.error);
      if (p.error) console.error("Error doctor pending:", p.error);
      todaySchedule = s.data || 0;
      cancelledCount = c.data || 0;
      completedToday = co.data || 0;
      pendingToday = p.data || 0;
    }

    const responseData = {
      todaySchedule,
      cancelled: cancelledCount,
      completed: completedToday,
      pending: pendingToday,
      profileImage: userRecord?.profile_image || null,
    };

    console.log('Dashboard stats response:', responseData);

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in get-doctor-dashboard-stats:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error?.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
