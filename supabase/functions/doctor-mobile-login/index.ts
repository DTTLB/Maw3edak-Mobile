import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { randomBytes, pbkdf2Sync } from "node:crypto";
import { resolveDoctorTwoFactorByGlobalId } from "../_shared/two-factor.ts";

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
    console.log("=== DOCTOR MOBILE LOGIN START ===");
    console.log("Request method:", req.method);
    console.log("Request URL:", req.url);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing environment variables");
      console.error("Has SUPABASE_URL:", !!supabaseUrl);
      console.error("Has SUPABASE_SERVICE_ROLE_KEY:", !!supabaseKey);
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          details: "Missing required environment variables",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Creating Supabase client...");
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client created successfully");

    console.log("Reading request body...");
    let body: any;
    try {
      body = await req.json();
      console.log("Request body parsed successfully");
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: "Request body must be valid JSON",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const email = body.email?.trim();
    const mobileNumber = body.mobileNumber?.trim();
    const password = body.password;
    const company_id = body.company_id?.trim();
    // Proof that 2FA was already passed this login (issued by
    // mobile-doctor-2fa-login when the doctor still has a clinic to choose).
    // Lets the clinic-pick request skip the 2FA gate.
    const twoFactorToken = body.twoFactorToken?.trim();

    console.log("Login attempt:", {
      email,
      mobileNumber,
      hasPassword: !!password,
      passwordLength: password?.length,
      company_id,
    });

    if ((!email && !mobileNumber) || !password) {
      console.log("Missing credentials");
      return new Response(
        JSON.stringify({ error: "Email or Mobile Number and password are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (typeof password !== "string") {
      console.log("Invalid input types");
      return new Response(JSON.stringify({ error: "Invalid input format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Searching for doctor in users table...");

    let doctors: any[] | null = null;
    let fetchError: any = null;
    try {
      let query = supabase
        .from("users")
        .select(
          "id, company_id, email, mobile, password_hash, full_name, is_active, is_deleted, global_id, role, is_primary_company, companies(id, name, slug, address, mobile, email, register_number)"
        )
        // NOTE: deleted accounts are intentionally NOT filtered out here. We
        // verify the password first, then return a clear "account deleted"
        // message instead of a misleading "invalid credentials" (see below).
        .eq("is_active", true)
        .not("global_id", "is", null);

      if (email) {
        console.log("Searching by email (case-insensitive):", email);
        query = query.ilike("email", email);
      } else if (mobileNumber) {
        console.log("Searching by mobile:", mobileNumber);
        query = query.eq("mobile", mobileNumber);
      }

      const result = await query;
      doctors = result.data;
      fetchError = result.error;

      console.log("Doctor lookup completed:", {
        found: !!doctors && doctors.length > 0,
        count: doctors?.length || 0,
        error: fetchError?.message,
      });
    } catch (dbError) {
      console.error("Database query failed:", dbError);
      return new Response(
        JSON.stringify({
          error: "Database connection error",
          details: "Failed to query users database",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (fetchError || !doctors || doctors.length === 0) {
      console.log("Doctor not found or error:", fetchError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid credentials or account not authorized for mobile access" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Determine which of the doctor's companies have a valid (active,
    // non-expired) subscription. A company is accessible only if it has a
    // company_subscriptions row with is_active = true AND end_date is either
    // null (no expiry) or still in the future.
    const companyIds = [...new Set(doctors.map((d: any) => d.company_id))];
    const validCompanyIds = new Set<string>();
    try {
      const now = new Date();
      const { data: subs, error: subsError } = await supabase
        .from("company_subscriptions")
        .select("company_id, end_date, is_active")
        .in("company_id", companyIds)
        .eq("is_active", true);

      if (subsError) {
        console.error("Subscription lookup error:", subsError.message);
      }

      for (const sub of subs || []) {
        if (!sub.end_date || new Date(sub.end_date) >= now) {
          validCompanyIds.add(sub.company_id);
        }
      }
      console.log("Subscription check:", {
        totalCompanies: companyIds.length,
        validCompanies: validCompanyIds.size,
      });
    } catch (subDbError) {
      console.error("Subscription query failed:", subDbError);
    }

    // Keep only the companies whose subscription is currently valid.
    const activeDoctors = doctors.filter((d: any) =>
      validCompanyIds.has(d.company_id)
    );

    // If none of the doctor's companies have a valid subscription, block login.
    if (activeDoctors.length === 0) {
      console.log("All companies have expired subscriptions - blocking login");
      return new Response(
        JSON.stringify({
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

    // Verify the password FIRST (before revealing the clinic list), then run
    // the 2FA gate, then prompt for clinic selection. So we pick the row to
    // authenticate against here: the chosen company, or the primary/first
    // active account when no company has been selected yet.
    let primaryDoctor;
    if (company_id) {
      const selected = doctors.find((d: any) => d.company_id === company_id);
      if (!selected) {
        console.log("Selected company not found for user");
        return new Response(
          JSON.stringify({ error: "Invalid company selection" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      // Block login into a company whose subscription has expired.
      if (!validCompanyIds.has(company_id)) {
        console.log("Selected company subscription expired - blocking login");
        return new Response(
          JSON.stringify({
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
      primaryDoctor = selected;
    } else {
      primaryDoctor =
        activeDoctors.find((d: any) => d.is_primary_company) || activeDoctors[0];
    }

    if (!primaryDoctor.password_hash || !primaryDoctor.password_hash.includes(":")) {
      console.log("Invalid password format - missing salt");
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Verifying password...");
    console.log("Password to verify length:", password.length);
    const [saltHex, storedHashHex] = primaryDoctor.password_hash.split(":");
    console.log("Salt hex length:", saltHex.length, "Stored hash length:", storedHashHex.length);

    let isPasswordValid = false;
    try {
      const saltBytes = new Uint8Array(saltHex.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16)));

      const derivedKey = pbkdf2Sync(password, saltBytes, 100000, 32, "sha256");

      const computedHashHex = Array.from(derivedKey)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      console.log("Computed hash first 10:", computedHashHex.substring(0, 10));
      console.log("Stored hash first 10:", storedHashHex.substring(0, 10));

      isPasswordValid = computedHashHex === storedHashHex;
      console.log("Password verification result:", { match: isPasswordValid });
    } catch (hashError) {
      console.error("Password hashing error:", hashError);
      return new Response(
        JSON.stringify({
          error: "Authentication error",
          details: "Failed to verify password",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!isPasswordValid) {
      console.log("Password mismatch");
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Authentication successful");

    // --- Soft-delete gate ---------------------------------------------------
    // The password is correct, so do NOT say "invalid credentials". If the
    // doctor's login (users) or profile (doctors) has been soft-deleted,
    // return a clear, non-revealing message. Checked before the 2FA gate so a
    // deleted doctor never receives a pending token either. All `users` rows of
    // a deleted doctor share is_deleted = true (they share global_id).
    {
      let accountDeleted = primaryDoctor.is_deleted === true;
      if (!accountDeleted) {
        const { data: profileRows } = await supabase
          .from("doctors")
          .select("is_deleted")
          .eq("global_id", primaryDoctor.global_id);
        accountDeleted = (profileRows || []).some((r: any) => r.is_deleted === true);
      }
      if (accountDeleted) {
        console.log("Account soft-deleted - blocking login");
        return new Response(
          JSON.stringify({ error: "Account not available. Please contact support." }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // --- Two-factor gate ----------------------------------------------------
    // Order: password (done) -> 2FA -> clinic selection. 2FA is GLOBAL to the
    // doctor's identity: it may be enrolled on ANY clinic row sharing this
    // global_id (the web portal enrolls on whichever clinic the staff member
    // used, not necessarily the primary), so we resolve the canonical record
    // across all rows. If enabled, we do NOT issue a session; we mint a
    // short-lived (~5 min) pending token and the mobile login screen calls
    // mobile-doctor-2fa-login to finish.
    //
    // EXCEPTION: a `twoFactorToken` proof (issued by mobile-doctor-2fa-login
    // when the doctor still had a clinic to pick) means 2FA already passed this
    // login — so the clinic-pick request skips the gate.
    let twoFactorProofOk = false;
    if (twoFactorToken) {
      const { data: proof } = await supabase
        .from("two_factor_login_tokens")
        .select("user_id, expires_at, consumed_at, two_factor_passed")
        .eq("token", twoFactorToken)
        .maybeSingle();

      const proofValid = proof &&
        proof.two_factor_passed === true &&
        !proof.consumed_at &&
        new Date(proof.expires_at).getTime() > Date.now() &&
        doctors.some((d: any) => d.id === proof.user_id); // same doctor identity

      if (proofValid) {
        twoFactorProofOk = true;
        // Single-use: consume the proof now.
        await supabase
          .from("two_factor_login_tokens")
          .update({ consumed_at: new Date().toISOString() })
          .eq("token", twoFactorToken);
      } else {
        console.log("2FA proof token invalid/expired - falling through to gate");
      }
    }

    if (!twoFactorProofOk) {
      try {
        const ctx = await resolveDoctorTwoFactorByGlobalId(
          supabase,
          primaryDoctor.global_id
        );

        if (ctx?.twoFactor?.enabled) {
          console.log("2FA enabled - issuing pending token instead of session");
          const pendingToken = randomBytes(32).toString("hex");
          const pendingExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

          const { error: pendingError } = await supabase
            .from("two_factor_login_tokens")
            .insert({
              token: pendingToken,
              user_id: primaryDoctor.id,
              // Clinic not chosen yet when no company_id was sent.
              company_id: company_id || null,
              expires_at: pendingExpiresAt.toISOString(),
            });

          if (pendingError) {
            console.error("Failed to mint pending 2FA token:", pendingError.message);
            return new Response(
              JSON.stringify({
                error: "Failed to start two-factor verification",
                details: pendingError.message,
              }),
              {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }

          return new Response(
            JSON.stringify({ twoFactorRequired: true, pendingToken }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      } catch (twoFactorError) {
        console.error("2FA gate error (continuing without gate):", twoFactorError);
      }
    }

    // --- Clinic selection (AFTER password + 2FA) ----------------------------
    // Now that the doctor is fully authenticated, prompt for clinic choice if
    // they belong to more than one active company and haven't picked one yet.
    if (!company_id && activeDoctors.length > 1) {
      console.log("Authenticated - prompting for clinic selection");
      const companies = activeDoctors.map((u: any) => ({
        company_id: u.company_id,
        company_name: u.companies?.name || "Unknown Company",
        company_slug: u.companies?.slug,
        user_id: u.id,
        role: u.role,
      }));

      return new Response(
        JSON.stringify({ requiresCompanySelection: true, companies }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Creating session for selected company");

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    let sessionError: any;
    try {
      const result = await supabase.from("user_sessions").insert({
        user_id: primaryDoctor.id,
        token: token,
        expires_at: expiresAt.toISOString(),
      });

      sessionError = result.error;
      console.log("Session creation result:", { error: sessionError?.message });
    } catch (sessionDbError) {
      console.error("Session creation database error:", sessionDbError);
      return new Response(
        JSON.stringify({
          error: "Session creation failed",
          details: "Failed to create session in database",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (sessionError) {
      console.error("Error creating session:", sessionError);
      return new Response(
        JSON.stringify({
          error: "Failed to create session",
          details: sessionError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userData = {
      id: primaryDoctor.id,
      email: primaryDoctor.email,
      mobile: primaryDoctor.mobile,
      full_name: primaryDoctor.full_name,
      global_id: primaryDoctor.global_id,
      role: primaryDoctor.role,
      company_id: primaryDoctor.company_id,
    };

    // Only expose companies with a valid (non-expired) subscription.
    const companiesAccess = activeDoctors.map((doc: any) => ({
      id: doc.id,
      company_id: doc.company_id,
      is_primary_company: doc.is_primary_company,
      role: doc.role,
    }));

    // ✅ FIX 1 (your “line ~369”): specialization_name -> name
    console.log("Fetching accessible doctors for user:", primaryDoctor.id);
    const { data: doctorAccess, error: doctorAccessError } = await supabase
      .from("user_doctor_access")
      .select(
        `
        doctor_id,
        access_type,
        doctors:doctor_id (
          id,
          full_name,
          email,
          specialization_id,
          doctor_specializations:specialization_id (
            name
          )
        )
      `
      )
      .eq("user_id", primaryDoctor.id);

    if (doctorAccessError) {
      console.error("Doctor access fetch error:", doctorAccessError.message);
    }

    const accessibleDoctors =
      doctorAccess?.map((da: any) => ({
        id: da.doctors?.id,
        full_name: da.doctors?.full_name,
        email: da.doctors?.email,
        specialization: da.doctors?.doctor_specializations?.name || null,
        access_type: da.access_type,
      })) || [];

    // ✅ FIX 2: Replace the TEST token insert with real FCM insert (uses fcm_token)
    const fcmToken =
      body.fcm_token?.trim() ||
      body.fcmToken?.trim() ||
      body.deviceToken?.trim() ||
      null;

    if (fcmToken) {
      // Deactivate old active tokens for this doctor (except the current one)
      const { error: deactivateErr } = await supabase
        .from("device_tokens")
        .update({ is_active: false })
        .eq("user_id", primaryDoctor.id)
        .neq("fcm_token", fcmToken)
        .eq("is_active", true);

      if (deactivateErr) console.error("device_tokens deactivate error:", deactivateErr.message);

      // Manual upsert: check if token exists, then update or insert
      const { data: existingToken } = await supabase
        .from("device_tokens")
        .select("id")
        .eq("user_id", primaryDoctor.id)
        .eq("fcm_token", fcmToken)
        .maybeSingle();

      if (existingToken) {
        console.log("=== TOKEN EXISTS - UPDATING ===");
        const { error: updateError } = await supabase
          .from("device_tokens")
          .update({
            global_id: primaryDoctor.global_id,
            platform: body.platform ?? null,
            device_model: body.device_model ?? body.deviceModel ?? null,
            app_version: body.app_version ?? body.appVersion ?? null,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingToken.id);

        if (updateError) {
          console.error("❌ Device token update FAILED:", updateError.message);
        } else {
          console.log("✅ Device token updated");
        }
      } else {
        console.log("=== NEW TOKEN - INSERTING ===");
        const { error: insertError } = await supabase
          .from("device_tokens")
          .insert({
            user_id: primaryDoctor.id,
            global_id: primaryDoctor.global_id,
            fcm_token: fcmToken,
            platform: body.platform ?? null,
            device_model: body.device_model ?? body.deviceModel ?? null,
            app_version: body.app_version ?? body.appVersion ?? null,
            is_active: true,
          });

        if (insertError) {
          console.error("❌ Device token insert FAILED:", insertError.message);
        } else {
          console.log("✅ Device token inserted");
        }
      }
    } else {
      console.log("No fcm token provided; skipping device_tokens insert");
    }

    console.log(
      "Login successful, returning response with",
      doctors.length,
      "companies and",
      accessibleDoctors.length,
      "accessible doctors"
    );

    return new Response(
      JSON.stringify({
        session: {
          token: token,
          expires_at: expiresAt.getTime(),
        },
        user: userData,
        companies: companiesAccess,
        accessible_doctors: accessibleDoctors,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("=== UNEXPECTED ERROR IN DOCTOR_MOBILE_LOGIN ===");
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error?.message || "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
