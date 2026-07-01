import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// business-mark-notifications-read
// -----------------------------------------------------------------------------
// Marks one notification (notificationId) or ALL of the receptionist's
// accessible notifications as read. Scope is resolved from user_doctor_access —
// a receptionist can only ever mark notifications belonging to doctors assigned
// to them (by doctor_id or that doctor's global_id).
//
// Request: { user_id, company_id?, notificationId? }
//   - notificationId present -> mark that single notification read
//   - notificationId absent   -> mark all accessible notifications read
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

    const body = await req.json().catch(() => ({}));
    const userId = body.user_id?.trim() || body.userId?.trim() || null;
    const companyId = body.company_id?.trim() || body.companyId?.trim() || null;
    const notificationId = body.notificationId || body.notification_id || null;

    if (!userId) {
      return json({ success: false, error: "user_id is required" }, 400);
    }

    // Assigned doctors (+ their global_id).
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
    const globalIds = [...new Set((accessRows || []).map((r: any) => r.doctors?.global_id).filter(Boolean))];

    if (doctorIds.length === 0 && globalIds.length === 0) {
      return json({ success: true, updated: 0 });
    }

    if (notificationId) {
      // Verify the notification is within this receptionist's scope.
      const { data: notif } = await supabase
        .from("doctor_notifications")
        .select("id, doctor_id, global_id")
        .eq("id", notificationId)
        .maybeSingle();

      if (!notif) {
        return json({ success: false, error: "Notification not found" }, 404);
      }
      const inScope =
        (notif.doctor_id && doctorIds.includes(notif.doctor_id)) ||
        (notif.global_id && globalIds.includes(notif.global_id));
      if (!inScope) {
        return json({ success: false, error: "Not authorized for this notification" }, 403);
      }

      const { error: updErr } = await supabase
        .from("doctor_notifications")
        .update({ read: true })
        .eq("id", notificationId);
      if (updErr) {
        return json({ success: false, error: "Failed to update notification", details: updErr.message }, 500);
      }
      return json({ success: true, updated: 1 });
    }

    // Mark all accessible notifications read (scoped by doctor_id and global_id).
    const updates: Promise<any>[] = [];
    if (doctorIds.length > 0) {
      let q = supabase.from("doctor_notifications").update({ read: true }).in("doctor_id", doctorIds).eq("read", false);
      if (companyId) q = q.eq("company_id", companyId);
      updates.push(q);
    }
    if (globalIds.length > 0) {
      let q = supabase.from("doctor_notifications").update({ read: true }).in("global_id", globalIds).eq("read", false);
      if (companyId) q = q.eq("company_id", companyId);
      updates.push(q);
    }
    await Promise.all(updates);

    return json({ success: true });
  } catch (error: any) {
    console.error("Error in business-mark-notifications-read:", error);
    return json({ success: false, error: "Internal server error", details: error?.message || String(error) }, 500);
  }
});
