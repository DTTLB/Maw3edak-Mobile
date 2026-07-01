import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * mobile-delete-account
 *
 * In-app account deletion for BOTH patient and doctor account systems
 * (Apple App Store Guideline 5.1.1(v)).
 *
 * Only the authenticated owner of the account can delete it:
 *   - Patient: Authorization: Bearer <patient session token>  (user_patient_sessions)
 *   - Doctor:  X-Session-Token: <doctor session token>        (user_sessions)
 *
 * Behaviour: SOFT DELETE ONLY. The account and profile rows are flagged with
 * `is_deleted = TRUE` and NOTHING else is changed:
 *   - Patient: user_patients + patients, matched by medical_id.
 *   - Doctor:  users + doctors, matched by global_id.
 * No personal data is renamed or modified (name, email, mobile, status and
 * password are all left untouched) and no row is ever physically deleted.
 * Clinical / financial / legal records (appointments, invoices, encounters,
 * history) are retained. Soft-deleted rows are excluded from every normal app
 * query and from login, so the account effectively disappears.
 *
 * Active auth sessions / device (push) tokens are cleared so the user is logged
 * out everywhere immediately — these are transient auth artifacts, not personal
 * data or history.
 *
 * Errors are returned as clean user-friendly messages; stack traces are never
 * exposed to the client.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, X-Session-Token",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return json({ success: false, error: "Server configuration error" }, 500);
    }
    const supabase = createClient(supabaseUrl, serviceKey);

    let body: { userType?: string } = {};
    try {
      body = await req.json();
    } catch {
      return json({ success: false, error: "Invalid request." }, 400);
    }

    const userType = body?.userType;
    if (userType !== "patient" && userType !== "doctor") {
      return json({ success: false, error: "Invalid user type." }, 400);
    }

    // ---------------------------------------------------------------- PATIENT
    if (userType === "patient") {
      const token = (req.headers.get("Authorization") || "")
        .replace("Bearer ", "")
        .trim();
      if (!token) return json({ success: false, error: "Not authenticated." }, 401);

      const { data: session, error: sErr } = await supabase
        .from("user_patient_sessions")
        .select("patient_id, expires_at")
        .eq("token", token)
        .maybeSingle();

      if (sErr || !session) {
        return json(
          { success: false, error: "Session not found. Please log in again." },
          401
        );
      }
      if (session.expires_at && new Date(session.expires_at) < new Date()) {
        return json(
          { success: false, error: "Session expired. Please log in again." },
          401
        );
      }

      const patientId = session.patient_id;

      // Resolve the patient's medical_id — the key shared by user_patients and
      // patients. Both tables are soft-deleted by this id so they stay in sync.
      const { data: account, error: accErr } = await supabase
        .from("user_patients")
        .select("medical_id")
        .eq("id", patientId)
        .maybeSingle();

      if (accErr || !account?.medical_id) {
        console.error("patient lookup failed:", accErr?.message);
        return json(
          { success: false, error: "We couldn't complete account deletion. Please try again." },
          500
        );
      }

      const medicalId = account.medical_id;

      // 1. Soft-delete the patient account row(s) — user_patients. ONLY the
      //    is_deleted flag is set; no personal field is touched.
      const { error: upErr } = await supabase
        .from("user_patients")
        .update({ is_deleted: true })
        .eq("medical_id", medicalId);

      if (upErr) {
        console.error("user_patients soft-delete failed:", upErr.message);
        return json(
          { success: false, error: "We couldn't complete account deletion. Please try again." },
          500
        );
      }

      // 2. Soft-delete the related patient profile row(s) — patients — by the
      //    same medical_id. Non-fatal: the account is already blocked via
      //    user_patients if this ever fails.
      const { error: pErr } = await supabase
        .from("patients")
        .update({ is_deleted: true })
        .eq("medical_id", medicalId);

      if (pErr) console.error("patients soft-delete failed:", pErr.message);

      // 3. Log out everywhere: clear sessions and push tokens (transient auth
      //    artifacts only — no personal data or history is touched).
      await supabase.from("user_patient_sessions").delete().eq("patient_id", patientId);
      try {
        await supabase.from("device_tokens").delete().eq("medical_id", medicalId);
      } catch (_) { /* ignore */ }

      return json({ success: true, message: "Your account has been deleted." });
    }

    // ----------------------------------------------------------------- DOCTOR
    const token = (req.headers.get("X-Session-Token") || "").trim();
    if (!token) return json({ success: false, error: "Not authenticated." }, 401);

    const { data: session, error: sErr } = await supabase
      .from("user_sessions")
      .select("user_id, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (sErr || !session) {
      return json(
        { success: false, error: "Session not found. Please log in again." },
        401
      );
    }
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return json(
        { success: false, error: "Session expired. Please log in again." },
        401
      );
    }

    const userId = session.user_id;

    // A doctor identity spans multiple `users` rows (one per company) sharing
    // the same global_id — soft-delete them all, plus the doctor profile(s).
    // A receptionist / single-company staff member has NO global_id: just their
    // own single `users` row is soft-deleted (no doctor profile to touch).
    const { data: me, error: meErr } = await supabase
      .from("users")
      .select("global_id")
      .eq("id", userId)
      .maybeSingle();

    if (meErr || !me) {
      console.error("user lookup failed:", meErr?.message);
      return json(
        { success: false, error: "We couldn't complete account deletion. Please try again." },
        500
      );
    }

    const globalId: string | null = me.global_id ?? null;

    // 1. Soft-delete the login/account row(s) — users. By global_id for doctors
    //    (all clinics), or by the single user id for receptionists/staff.
    const { error: uErr } = await (
      globalId
        ? supabase.from("users").update({ is_deleted: true }).eq("global_id", globalId)
        : supabase.from("users").update({ is_deleted: true }).eq("id", userId)
    );

    if (uErr) {
      console.error("users soft-delete failed:", uErr.message);
      return json(
        { success: false, error: "We couldn't complete account deletion. Please try again." },
        500
      );
    }

    // 2. Soft-delete the related doctor profile row(s) — doctors — by global_id.
    //    Only applies to doctors; receptionists own no doctor profile. Best-effort.
    if (globalId) {
      try {
        const { error: dErr } = await supabase
          .from("doctors")
          .update({ is_deleted: true })
          .eq("global_id", globalId);
        if (dErr) console.error("doctors soft-delete failed:", dErr.message);
      } catch (_) { /* ignore */ }
    }

    // 3. Log out everywhere: clear sessions and push tokens (transient auth
    //    artifacts only). For doctors, every users row of the identity.
    let userIds: string[] = [userId];
    if (globalId) {
      const { data: rows } = await supabase
        .from("users")
        .select("id")
        .eq("global_id", globalId);
      userIds = (rows || []).map((r: { id: string }) => r.id);
      if (userIds.length === 0) userIds.push(userId);
    }

    await supabase.from("user_sessions").delete().in("user_id", userIds);
    try {
      if (globalId) {
        await supabase.from("device_tokens").delete().eq("global_id", globalId);
      } else {
        await supabase.from("device_tokens").delete().in("user_id", userIds);
      }
    } catch (_) { /* ignore */ }

    return json({ success: true, message: "Your account has been deleted." });
  } catch (e) {
    console.error("delete-account error:", e instanceof Error ? e.message : e);
    return json(
      { success: false, error: "We couldn't complete account deletion. Please try again." },
      500
    );
  }
});
