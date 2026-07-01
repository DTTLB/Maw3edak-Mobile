import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { randomBytes, pbkdf2Sync } from "node:crypto";
import { decryptSecret, verifyTotp, verifyRecoveryCode } from "../_shared/two-factor.ts";

// =============================================================================
// business-mobile-login
// -----------------------------------------------------------------------------
// Unified mobile login entry point for BUSINESS users (doctor + receptionist).
//
// DOCTOR:
//   Doctors are NOT handled here. To guarantee the existing, working doctor
//   login behaves *exactly* as before (2FA, clinic selection, device tokens,
//   subscription gates, accessible doctors), a doctor account is transparently
//   forwarded to the untouched `doctor-mobile-login` function and its response
//   is returned verbatim. Nothing about the doctor flow is duplicated here.
//
// RECEPTIONIST (NEW):
//   Receptionists live in the same `users` table with role = 'receptionist' and
//   (typically) global_id = NULL. They do NOT own a global_id and belong to a
//   single company. After authenticating, we resolve the doctor(s) assigned to
//   them via `user_doctor_access` and return the *linked doctor's* global_id as
//   `activeDoctorGlobalId`. The mobile app injects that into
//   `session.user.global_id`, so every existing doctor screen/endpoint keeps
//   working unchanged (lean global_id injection — no endpoint refactor).
//
// SECURITY: a receptionist can only ever receive global_ids of doctors that are
// assigned to them in `user_doctor_access` (scoped to their company). The list
// is computed server-side; the client never supplies an arbitrary global_id.
// =============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
    console.log("=== BUSINESS MOBILE LOGIN START ===");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing environment variables");
      return json(
        { error: "Server configuration error", details: "Missing required environment variables" },
        500
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: any;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return json({ error: "Invalid request body", details: "Request body must be valid JSON" }, 400);
    }

    const email = body.email?.trim();
    const mobileNumber = body.mobileNumber?.trim();
    const password = body.password;
    // Which assigned doctor the receptionist wants to act as (optional). When a
    // receptionist has multiple assigned doctors and none is requested, we
    // default to the first and return the full list so the app can let them pick.
    const requestedDoctorGlobalId =
      body.activeDoctorGlobalId?.trim() || body.active_doctor_global_id?.trim() || null;
    // Optional 2FA code (TOTP or recovery code) for receptionists who enrolled.
    const twoFactorCode = body.code?.trim() || body.twoFactorCode?.trim() || null;

    if ((!email && !mobileNumber) || !password) {
      return json({ error: "Email or Mobile Number and password are required" }, 400);
    }
    if (typeof password !== "string") {
      return json({ error: "Invalid input format" }, 400);
    }

    // -------------------------------------------------------------------------
    // 1) Look up the account in the SAME users table used by doctor login, but
    //    WITHOUT the `global_id is not null` filter (receptionists have none).
    //    We accept both doctor and receptionist roles.
    // -------------------------------------------------------------------------
    let usersQuery = supabase
      .from("users")
      .select(
        "id, company_id, email, mobile, password_hash, full_name, is_active, is_deleted, global_id, role, is_primary_company, companies(id, name, slug, address, mobile, email, register_number)"
      )
      .eq("is_active", true)
      .in("role", ["doctor", "receptionist"]);

    if (email) {
      usersQuery = usersQuery.ilike("email", email);
    } else if (mobileNumber) {
      usersQuery = usersQuery.eq("mobile", mobileNumber);
    }

    const { data: matchedUsers, error: lookupError } = await usersQuery;

    if (lookupError) {
      console.error("User lookup error:", lookupError.message);
      return json({ error: "Database connection error", details: "Failed to query users database" }, 500);
    }

    if (!matchedUsers || matchedUsers.length === 0) {
      return json({ error: "Invalid credentials or account not authorized for mobile access" }, 401);
    }

    // -------------------------------------------------------------------------
    // 2) DOCTOR accounts -> forward to the UNTOUCHED doctor-mobile-login.
    //    Any row carrying a non-null global_id (or role 'doctor') is a doctor.
    //    We do not re-implement or alter doctor behavior in any way.
    // -------------------------------------------------------------------------
    const isDoctorAccount = matchedUsers.some(
      (u: any) => u.role === "doctor" || (u.global_id !== null && u.global_id !== undefined)
    );

    if (isDoctorAccount) {
      console.log("Doctor account detected -> forwarding to doctor-mobile-login (verbatim)");
      const incomingAuth = req.headers.get("Authorization") || `Bearer ${supabaseKey}`;
      const forwardResp = await fetch(`${supabaseUrl}/functions/v1/doctor-mobile-login`, {
        method: "POST",
        headers: {
          Authorization: incomingAuth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const forwardText = await forwardResp.text();
      return new Response(forwardText, {
        status: forwardResp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // -------------------------------------------------------------------------
    // 3) RECEPTIONIST path. Receptionists are single-company, so there is one
    //    row (defensively pick the primary / first if several ever exist).
    // -------------------------------------------------------------------------
    const receptionist =
      matchedUsers.find((u: any) => u.is_primary_company) || matchedUsers[0];

    // Verify password using the SAME scheme as doctor login (PBKDF2-SHA256,
    // 100k iterations, stored as `saltHex:hashHex`).
    if (!receptionist.password_hash || !receptionist.password_hash.includes(":")) {
      return json({ error: "Invalid credentials" }, 401);
    }

    let isPasswordValid = false;
    try {
      const [saltHex, storedHashHex] = receptionist.password_hash.split(":");
      const saltBytes = new Uint8Array(
        saltHex.match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16))
      );
      const derivedKey = pbkdf2Sync(password, saltBytes, 100000, 32, "sha256");
      const computedHashHex = Array.from(derivedKey)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      isPasswordValid = computedHashHex === storedHashHex;
    } catch (hashError) {
      console.error("Password hashing error:", hashError);
      return json({ error: "Authentication error", details: "Failed to verify password" }, 500);
    }

    if (!isPasswordValid) {
      return json({ error: "Invalid credentials" }, 401);
    }

    // Soft-delete gate (password is correct, so give a clear, non-revealing msg).
    if (receptionist.is_deleted === true) {
      return json({ error: "Account not available. Please contact support." }, 403);
    }

    // --- Two-factor gate (receptionist) -------------------------------------
    // If the receptionist enrolled 2FA in settings, require the 6-digit code
    // (or a single-use recovery code) at login. Verified INLINE here — no
    // pending-token round trip — since a receptionist is a single user row.
    {
      const { data: tf } = await supabase
        .from("user_two_factor")
        .select("enabled, secret_encrypted, recovery_codes, last_used_step")
        .eq("user_id", receptionist.id)
        .maybeSingle();

      if (tf?.enabled && tf.secret_encrypted) {
        if (!twoFactorCode) {
          // No code yet — tell the app to prompt for it and resubmit.
          return json({ twoFactorRequired: true });
        }

        let verified = false;

        // 1) TOTP, with replay protection (reject codes at/below last step).
        const secret = await decryptSecret(tf.secret_encrypted);
        const step = await verifyTotp(twoFactorCode, secret);
        if (step !== null) {
          if (tf.last_used_step !== null && step <= tf.last_used_step) {
            return json({ error: "This code has already been used" }, 401);
          }
          await supabase
            .from("user_two_factor")
            .update({ last_used_step: step })
            .eq("user_id", receptionist.id);
          verified = true;
        } else {
          // 2) Single-use recovery code.
          const codes = Array.isArray(tf.recovery_codes) ? tf.recovery_codes : [];
          for (let i = 0; i < codes.length; i++) {
            if (codes[i].used_at) continue;
            if (await verifyRecoveryCode(twoFactorCode, codes[i].hash)) {
              codes[i].used_at = new Date().toISOString();
              await supabase
                .from("user_two_factor")
                .update({ recovery_codes: codes })
                .eq("user_id", receptionist.id);
              verified = true;
              break;
            }
          }
        }

        if (!verified) {
          return json({ error: "Invalid verification code", code: "INVALID_2FA" }, 401);
        }
      }
    }

    // Subscription gate — same rule as doctor login: the receptionist's company
    // must have an active, non-expired subscription.
    try {
      const now = new Date();
      const { data: subs } = await supabase
        .from("company_subscriptions")
        .select("company_id, end_date, is_active")
        .eq("company_id", receptionist.company_id)
        .eq("is_active", true);
      const hasValidSub = (subs || []).some(
        (s: any) => !s.end_date || new Date(s.end_date) >= now
      );
      if (!hasValidSub) {
        return json(
          {
            error: "Your company's subscription has expired. Please contact your administrator.",
            code: "SUBSCRIPTION_EXPIRED",
          },
          403
        );
      }
    } catch (subErr) {
      console.error("Subscription check failed (continuing):", subErr);
    }

    // -------------------------------------------------------------------------
    // 4) Resolve the doctor(s) assigned to this receptionist via
    //    user_doctor_access, scoped to the receptionist's company. This is the
    //    ONLY source of allowed doctors — the client cannot influence it.
    //
    //    NOTE: assigned doctors are matched by their PROFILE id (doctors.id),
    //    NOT by global_id. Most clinic-managed doctor profiles have a NULL
    //    global_id (only doctors who log in themselves carry one), so we accept
    //    doctors with OR without a global_id here. Data access for the
    //    receptionist is resolved downstream by the receptionist's user_id
    //    (-> user_doctor_access -> doctor profiles), which needs no global_id.
    // -------------------------------------------------------------------------
    const { data: accessRows, error: accessError } = await supabase
      .from("user_doctor_access")
      .select(
        `
        doctor_id,
        access_type,
        company_id,
        doctors:doctor_id (
          id,
          full_name,
          email,
          global_id,
          is_deleted,
          company_id,
          specialization_id,
          doctor_specializations:specialization_id ( name )
        )
      `
      )
      .eq("user_id", receptionist.id)
      .eq("company_id", receptionist.company_id);

    if (accessError) {
      console.error("user_doctor_access lookup error:", accessError.message);
      return json({ error: "Failed to resolve assigned doctors" }, 500);
    }

    // Keep live doctor profiles (with OR without a global_id), deduped by id.
    const seen = new Set<string>();
    const allowedDoctors = (accessRows || [])
      .map((r: any) => r.doctors)
      .filter((d: any) => d && d.is_deleted !== true && !seen.has(d.id) && seen.add(d.id))
      .map((d: any) => ({
        doctor_id: d.id,
        doctor_global_id: d.global_id || null,
        doctor_name: d.full_name,
        email: d.email,
        specialization: d.doctor_specializations?.name || null,
      }));

    // Reject ONLY when the receptionist has no assigned doctor at all.
    if (allowedDoctors.length === 0) {
      console.log("Receptionist has no assigned doctor - blocking login");
      return json(
        { error: "No doctor assigned to this receptionist.", code: "NO_DOCTOR_ASSIGNED" },
        403
      );
    }

    // The receptionist's own user_id is the data-resolution key used across the
    // app (injected into session.user.global_id on the client). Every doctor
    // data endpoint resolves it via user_doctor_access, so all assigned doctors'
    // data is available without any per-doctor global_id.
    const resolutionKey = receptionist.id;
    // Surfaced for reference; not required for data access.
    const activeDoctorGlobalId =
      requestedDoctorGlobalId &&
      allowedDoctors.some((d) => d.doctor_global_id === requestedDoctorGlobalId)
        ? requestedDoctorGlobalId
        : allowedDoctors[0].doctor_global_id;

    // -------------------------------------------------------------------------
    // 5) Create the session (same table/shape/expiry as doctor login).
    // -------------------------------------------------------------------------
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { error: sessionError } = await supabase.from("user_sessions").insert({
      user_id: receptionist.id,
      token,
      expires_at: expiresAt.toISOString(),
    });

    if (sessionError) {
      console.error("Error creating session:", sessionError.message);
      return json({ error: "Failed to create session", details: sessionError.message }, 500);
    }

    // -------------------------------------------------------------------------
    // 6) Register the FCM device token (same manual upsert as doctor login).
    //    Scope it to the active doctor's global_id so notifications align.
    // -------------------------------------------------------------------------
    const fcmToken =
      body.fcm_token?.trim() || body.fcmToken?.trim() || body.deviceToken?.trim() || null;

    if (fcmToken) {
      try {
        await supabase
          .from("device_tokens")
          .update({ is_active: false })
          .eq("user_id", receptionist.id)
          .neq("fcm_token", fcmToken)
          .eq("is_active", true);

        const { data: existingToken } = await supabase
          .from("device_tokens")
          .select("id")
          .eq("user_id", receptionist.id)
          .eq("fcm_token", fcmToken)
          .maybeSingle();

        const tokenPayload = {
          // Receptionists have no global_id of their own; leave it null.
          global_id: receptionist.global_id ?? null,
          platform: body.platform ?? null,
          device_model: body.device_model ?? body.deviceModel ?? null,
          app_version: body.app_version ?? body.appVersion ?? null,
          is_active: true,
        };

        if (existingToken) {
          await supabase
            .from("device_tokens")
            .update({ ...tokenPayload, updated_at: new Date().toISOString() })
            .eq("id", existingToken.id);
        } else {
          await supabase
            .from("device_tokens")
            .insert({ user_id: receptionist.id, fcm_token: fcmToken, ...tokenPayload });
        }
      } catch (tokenErr) {
        console.error("device_tokens registration error (non-fatal):", tokenErr);
      }
    }

    // -------------------------------------------------------------------------
    // 7) Build the response. KEY: user.global_id = activeDoctorGlobalId so the
    //    mobile app's existing screens/endpoints keep working unchanged.
    // -------------------------------------------------------------------------
    const userData = {
      id: receptionist.id,
      email: receptionist.email,
      mobile: receptionist.mobile,
      full_name: receptionist.full_name,
      // Data-resolution key read by every existing doctor screen. For a
      // receptionist this is their OWN user_id (a UUID). Data endpoints resolve
      // it via user_doctor_access (a doctor's `DR-...` global_id resolves first;
      // a UUID falls back to user_id resolution), so all screens work unchanged.
      global_id: resolutionKey,
      role: "receptionist",
      company_id: receptionist.company_id,
      // Receptionist-specific context (additive; ignored by doctor screens).
      realUserId: receptionist.id,
      activeDoctorGlobalId,
      allowedDoctors,
    };

    const companiesAccess = [
      {
        id: receptionist.id,
        company_id: receptionist.company_id,
        is_primary_company: receptionist.is_primary_company ?? true,
        role: "receptionist",
      },
    ];

    console.log(
      `Receptionist login OK: ${allowedDoctors.length} assigned doctor(s), active=${activeDoctorGlobalId}`
    );

    return json({
      session: { token, expires_at: expiresAt.getTime() },
      user: userData,
      role: "receptionist",
      allowedDoctors,
      activeDoctorGlobalId,
      companies: companiesAccess,
      // For parity with doctor login's response shape.
      accessible_doctors: allowedDoctors.map((d) => ({
        id: d.doctor_id,
        full_name: d.doctor_name,
        email: d.email,
        specialization: d.specialization,
        access_type: "receptionist",
      })),
    });
  } catch (error: any) {
    console.error("=== UNEXPECTED ERROR IN BUSINESS_MOBILE_LOGIN ===", error?.message);
    return json({ error: "Internal server error", details: error?.message || "Unknown error" }, 500);
  }
});
