import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// business-get-notifications
// -----------------------------------------------------------------------------
// Notification feed for the RECEPTIONIST. The doctor endpoint requires a doctor
// global_id (which receptionists don't have), so this resolves the receptionist's
// assigned doctors via user_doctor_access and returns every doctor_notifications
// row addressed to those doctors — by doctor_id OR by the doctor's global_id.
//
// Request: { user_id, company_id? }
// Response: { success, notifications:[...], unreadCount }
// =============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      return json({ success: false, error: "Server configuration error" }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    let userId: string | null = null;
    let companyId: string | null = null;
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      userId = body.user_id?.trim() || body.userId?.trim() || null;
      companyId = body.company_id?.trim() || body.companyId?.trim() || null;
    } else {
      const url = new URL(req.url);
      userId = url.searchParams.get("user_id");
      companyId = url.searchParams.get("company_id");
    }

    if (!userId) {
      return json({ success: false, error: "user_id is required" }, 400);
    }

    // Assigned doctors (+ their global_id) for this receptionist.
    let accessQuery = supabase
      .from("user_doctor_access")
      .select("doctor_id, doctors:doctor_id ( global_id )")
      .eq("user_id", userId);
    if (companyId) accessQuery = accessQuery.eq("company_id", companyId);

    const { data: accessRows, error: accessError } = await accessQuery;
    if (accessError) {
      return json({ success: false, error: "Failed to resolve assigned doctors", details: accessError.message }, 500);
    }

    const doctorIds = [...new Set((accessRows || []).map((r: any) => r.doctor_id).filter(Boolean))];
    const globalIds = [
      ...new Set((accessRows || []).map((r: any) => r.doctors?.global_id).filter(Boolean)),
    ];

    if (doctorIds.length === 0 && globalIds.length === 0) {
      return json({ success: true, notifications: [], unreadCount: 0 });
    }

    const selectCols = `
      id, category, message_header, message_body, read, created_at,
      objective_id, completed, auth_status, doctor_id, global_id, company_id,
      companies:company_id ( name )
    `;

    // Two scoped queries (by doctor_id, by global_id), merged + deduped — keeps
    // each query simple and avoids brittle .or() string building.
    const queries: Promise<any>[] = [];
    if (doctorIds.length > 0) {
      let q = supabase.from("doctor_notifications").select(selectCols).in("doctor_id", doctorIds);
      if (companyId) q = q.eq("company_id", companyId);
      queries.push(q.order("created_at", { ascending: false }).limit(100));
    }
    if (globalIds.length > 0) {
      let q = supabase.from("doctor_notifications").select(selectCols).in("global_id", globalIds);
      if (companyId) q = q.eq("company_id", companyId);
      queries.push(q.order("created_at", { ascending: false }).limit(100));
    }

    const results = await Promise.all(queries);
    const byId = new Map<string, any>();
    for (const res of results) {
      for (const n of res.data || []) {
        if (!byId.has(n.id)) {
          byId.set(n.id, {
            id: n.id,
            category: n.category,
            message_header: n.message_header,
            message_body: n.message_body,
            read: n.read,
            created_at: n.created_at,
            objective_id: n.objective_id,
            completed: n.completed,
            auth_status: n.auth_status,
            company_name: n.companies?.name || null,
          });
        }
      }
    }

    const notifications = Array.from(byId.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 100);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return json({ success: true, notifications, unreadCount });
  } catch (error: any) {
    console.error("Error in business-get-notifications:", error);
    return json({ success: false, error: "Internal server error", details: error?.message || String(error) }, 500);
  }
});
