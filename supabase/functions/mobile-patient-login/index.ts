import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { randomBytes, pbkdf2Sync } from "node:crypto";

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
    console.log("=== MOBILE PATIENT LOGIN START ===");
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
          details: "Missing required environment variables"
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
    let body;
    try {
      body = await req.json();
      console.log("Request body parsed successfully");
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: "Request body must be valid JSON"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const medicalId = body.medicalId?.trim();
    const mobileNumber = body.mobileNumber?.trim();
    const password = body.password;

    console.log("Login attempt:", { medicalId, mobileNumber, hasPassword: !!password });

    if ((!medicalId && !mobileNumber) || !password) {
      console.log("Missing credentials");
      return new Response(
        JSON.stringify({ error: "Medical ID or Mobile Number and password are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (typeof password !== 'string') {
      console.log("Invalid input types");
      return new Response(
        JSON.stringify({ error: "Invalid input format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Searching for patient...");

    let patient;
    let fetchError;
    try {
      let query = supabase
        .from("user_patients")
        .select("id, medical_id, password_hash, first_name, last_name, email, phone, date_of_birth, gender, blood_type, address, profile_image, is_deleted, must_change_password, temp_password_expires_at, first_login_at");
      // NOTE: deleted accounts are intentionally NOT filtered out here. We need
      // to verify the password first, then return a clear "account deleted"
      // message instead of a misleading "invalid password" (see below).

      if (medicalId) {
        console.log("Searching by medical_id:", medicalId);
        query = query.eq("medical_id", medicalId);
      } else if (mobileNumber) {
        console.log("Searching by phone:", mobileNumber);
        query = query.eq("phone", mobileNumber);
      }

      const result = await query.maybeSingle();

      patient = result.data;
      fetchError = result.error;
      console.log("Patient lookup completed:", { found: !!patient, error: fetchError?.message });
    } catch (dbError) {
      console.error("Database query failed:", dbError);
      return new Response(
        JSON.stringify({
          error: "Database connection error",
          details: "Failed to query patient database"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (fetchError || !patient) {
      console.log("Patient not found or error:", fetchError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!patient.password_hash || !patient.password_hash.includes(':')) {
      console.log("Invalid password format - missing salt");
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Verifying password...");
    const [saltHex, storedHashHex] = patient.password_hash.split(':');

    let isPasswordValid = false;
    try {
      const saltBytes = new Uint8Array(
        saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      );

      const derivedKey = pbkdf2Sync(
        password,
        saltBytes,
        100000,
        32,
        'sha256'
      );

      const computedHashHex = Array.from(derivedKey)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      isPasswordValid = computedHashHex === storedHashHex;
      console.log("Password verification result:", { match: isPasswordValid });
    } catch (hashError) {
      console.error("Password hashing error:", hashError);
      return new Response(
        JSON.stringify({
          error: "Authentication error",
          details: "Failed to verify password"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!isPasswordValid) {
      console.log("Password mismatch");
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Authentication successful");

    // --- Soft-delete gate ---------------------------------------------------
    // The password is correct, so do NOT say "invalid credentials". If the
    // account (or its patient profile) has been soft-deleted, return a clear,
    // non-revealing message instead. Checked before the subscription/2FA gates
    // so a deleted patient never receives a pending token either.
    {
      let accountDeleted = patient.is_deleted === true;
      if (!accountDeleted) {
        const { data: profileRows } = await supabase
          .from("patients")
          .select("is_deleted")
          .eq("medical_id", patient.medical_id);
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

    // --- Forced password-change gate ----------------------------------------
    // Patients created by a receptionist (or otherwise issued an auto-generated
    // temporary password) must change it before they get a session. The
    // password is already verified above, so this only triggers for a correct
    // temporary password. No session/token is issued here — the mobile app
    // routes the patient to the Change Password screen using `patientId`.
    if (patient.must_change_password === true) {
      // Temporary password past its lifetime: it can no longer be used at all.
      if (
        patient.temp_password_expires_at &&
        new Date(patient.temp_password_expires_at) < new Date()
      ) {
        console.log("Temporary password expired - blocking login");
        return new Response(
          JSON.stringify({
            success: false,
            code: "TEMP_PASSWORD_EXPIRED",
            error: "Your temporary password has expired. Please request a new password.",
            message: "Your temporary password has expired. Please request a new password.",
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("Password change required - not issuing session");
      return new Response(
        JSON.stringify({
          success: false,
          code: "PASSWORD_CHANGE_REQUIRED",
          message: "For your security, please change your temporary password before continuing.",
          patientId: patient.id,
          changePasswordRequired: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // --- Subscription gate --------------------------------------------------
    // A patient may sign in only while they hold a currently-valid subscription:
    // an active patient_subscriptions row whose end_date is still in the future.
    // Mirrors the company-subscription gate used for doctors. Runs before the
    // 2FA gate so an expired patient never receives a pending token either.
    try {
      const now = new Date();
      const { data: subs, error: subsError } = await supabase
        .from("patient_subscriptions")
        .select("end_date, is_active")
        .eq("medical_id", patient.medical_id)
        .eq("is_active", true);

      if (subsError) {
        // Fail open on an unexpected lookup error (don't lock everyone out).
        console.error("Subscription lookup error:", subsError.message);
      } else {
        const hasValidSubscription = (subs || []).some(
          (s: any) => s.end_date && new Date(s.end_date) > now
        );

        console.log("Subscription check:", {
          rows: subs?.length || 0,
          hasValidSubscription,
        });

        if (!hasValidSubscription) {
          console.log("No active subscription - blocking login");
          return new Response(
            JSON.stringify({
              error: "Your subscription has expired. Please renew to continue.",
              code: "SUBSCRIPTION_EXPIRED",
            }),
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
    } catch (subDbError) {
      console.error("Subscription query failed:", subDbError);
    }

    // --- Two-factor gate ----------------------------------------------------
    // 2FA is keyed directly to the patient (patient_id = user_patients.id). If
    // 2FA is enabled we do NOT issue a session here; instead mint a short-lived
    // (~5 min) pending token scoped only to the 2FA step. The mobile login
    // screen then calls mobile-patient-two-factor-login to finish.
    try {
      const { data: twoFactor } = await supabase
        .from("patient_two_factor")
        .select("enabled")
        .eq("patient_id", patient.id)
        .maybeSingle();

      if (twoFactor?.enabled) {
        console.log("2FA enabled - issuing pending token instead of session");
        const pendingToken = randomBytes(32).toString("hex");
        const pendingExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

        const { error: pendingError } = await supabase
          .from("patient_two_factor_login_tokens")
          .insert({
            token: pendingToken,
            patient_id: patient.id,
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

    console.log("Creating session");

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    let sessionError;
    try {
      const result = await supabase
        .from("user_patient_sessions")
        .insert({
          patient_id: patient.id,
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
          details: "Failed to create session in database"
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
          details: sessionError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userData = {
      id: patient.id,
      medical_id: patient.medical_id,
      first_name: patient.first_name,
      last_name: patient.last_name,
      email: patient.email,
      phone: patient.phone,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      blood_type: patient.blood_type,
      address: patient.address,
      profile_image: patient.profile_image,
    };

    console.log("Login successful, returning response");

    return new Response(
      JSON.stringify({
        session: {
          token: token,
          expires_at: expiresAt.getTime(),
        },
        user: userData,
        patient: userData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("=== UNEXPECTED ERROR IN MOBILE_PATIENT_LOGIN ===");
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error?.message || "Unknown error occurred"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});