import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { randomBytes, pbkdf2Sync } from "node:crypto";

/* =============================================================================
 * mobile_otp — registration + forgot-password OTP flows for the mobile app.
 *
 * SMS is sent through the generic outbound-integration engine:
 *   outbound_integrations — the HTTP request (target_url, http_method, headers,
 *                           body_template with {{placeholders}}).
 *   outbound_templates    — per-message variable_values (e.g. { text, destination }),
 *                           whose `text` carries the user-facing {{placeholders}}.
 * Every outbound call is logged to outbound_logs and can never crash the request.
 * ===========================================================================*/

const OUTBOUND_TABLE = "outbound_integrations";
const TEMPLATE_TABLE = "outbound_templates";
const LOGS_TABLE = "outbound_logs";

// outbound_logs column mapping.
const LOG_COLS = {
  integrationId: "integration_id",
  integrationName: "integration_name",
  requestUrl: "request_url",
  method: "method",
  requestPayload: "request_payload",
  responseStatus: "response_status",
  responseBody: "response_body",
  success: "success",
  errorMessage: "error_message",
};

// outbound_integrations.id of the SMS integration row.
const SMS_INTEGRATION_ID = "8d4de26a-7fe2-474b-b4fc-c7eb96acffda";

// outbound_templates row ids for each message we send.
const TEMPLATE_IDS = {
  welcome: "f19722c8-db97-4924-b961-a745493955e5",       // registration   (text: {{PatientName}}, {{MedicalID}}, {{code}})
  resetPassword: "084d9ee3-8af0-4b95-8c3c-b7b0ff82892d", // password reset  (text: {{code}})
};

// registration_settings row "Enable OTP Register Patient Mobile" whose
// `is_active` flag toggles OTP-on-registration.
// is_active true  -> send an OTP and wait for verification.
// is_active false -> create the patient immediately, no OTP.
const REGISTRATION_SETTINGS_ID = "27fc08d5-4355-4007-a167-6401544c11d9";

/* ===========================================================================*/

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

// Security tunables.
const OTP_TTL_MS = 10 * 60 * 1000;      // OTP lifetime
const RESEND_COOLDOWN_MS = 60 * 1000;   // min gap between sends to the same target
const MAX_VERIFY_ATTEMPTS = 5;          // wrong tries before an OTP is locked

// Cryptographically secure integer in [min, max] (inclusive), rejection-sampled to avoid modulo bias.
function secureInt(min: number, max: number): number {
  const range = max - min + 1;
  const maxUnbiased = Math.floor(0xffffffff / range) * range;
  const buf = new Uint32Array(1);
  let x = 0;
  do {
    crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= maxUnbiased);
  return min + (x % range);
}

function generateOTP(): string {
  return secureInt(100000, 999999).toString();
}

function generateMedicalId(): string {
  return `MED-${secureInt(100000000, 999999999)}`;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derivedKey = pbkdf2Sync(password, salt, 100000, 32, "sha256");
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

type PatientInput = {
  medicalId: string;       // used only when creating a brand-new account
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passwordHash: string;
  dateOfBirth: unknown;
  gender: unknown;
  bloodType: unknown;
  address: unknown;
};

type PatientResult =
  | { conflict: "email" | "phone" }
  | { error: string }
  | { reactivated: boolean; medicalId: string; patientId: string };

/**
 * Create a new patient OR reactivate (welcome back) a previously soft-deleted
 * one matching the same email/phone — never create a duplicate.
 *
 *   - Email/phone belongs to an ACTIVE account  -> { conflict }.
 *   - Email/phone belongs to a SOFT-DELETED one -> reactivate that row
 *     (is_deleted = false) with the freshly submitted details + password, and
 *     reactivate its patient profile by medical_id. Keeps the original medical_id.
 *   - Otherwise                                 -> insert a new account.
 */
async function createOrReactivatePatient(
  supabase: SB,
  p: PatientInput,
): Promise<PatientResult> {
  const [{ data: byEmail }, { data: byPhone }] = await Promise.all([
    supabase.from("user_patients").select("id, medical_id, is_deleted").eq("email", p.email).maybeSingle(),
    supabase.from("user_patients").select("id, medical_id, is_deleted").eq("phone", p.phone).maybeSingle(),
  ]);

  if (byEmail && byEmail.is_deleted === false) return { conflict: "email" };
  if (byPhone && byPhone.is_deleted === false) return { conflict: "phone" };

  const target =
    (byEmail && byEmail.is_deleted ? byEmail : null) ??
    (byPhone && byPhone.is_deleted ? byPhone : null);

  if (target) {
    const { error } = await supabase
      .from("user_patients")
      .update({
        is_deleted: false,
        is_verified: true,
        first_name: p.firstName,
        last_name: p.lastName,
        email: p.email,
        phone: p.phone,
        password_hash: p.passwordHash,
        date_of_birth: p.dateOfBirth,
        gender: p.gender,
        blood_type: p.bloodType,
        address: p.address,
      })
      .eq("id", target.id);
    if (error) return { error: error.message };

    // Reactivate the related patient profile row(s) by the same medical_id.
    await supabase
      .from("patients")
      .update({ is_deleted: false })
      .eq("medical_id", target.medical_id);

    return { reactivated: true, medicalId: target.medical_id, patientId: target.id };
  }

  const { data, error } = await supabase
    .from("user_patients")
    .insert({
      medical_id: p.medicalId,
      first_name: p.firstName,
      last_name: p.lastName,
      email: p.email,
      phone: p.phone,
      password_hash: p.passwordHash,
      date_of_birth: p.dateOfBirth,
      gender: p.gender,
      blood_type: p.bloodType,
      address: p.address,
      is_verified: true,
    })
    .select()
    .single();
  if (error) return { error: error.message };

  return { reactivated: false, medicalId: p.medicalId, patientId: data.id };
}

// Fills {{Placeholder}} tokens (any spacing) from the given variables.
function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => vars[key] ?? "");
}

// Fills {{Placeholder}} tokens inside a JSON string, JSON-escaping each value so
// quotes/newlines in a value can't break the surrounding JSON body.
function renderJsonBody(bodyTemplate: string, vars: Record<string, unknown>): string {
  return bodyTemplate.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => {
    const val = vars[key] ?? "";
    return JSON.stringify(String(val)).slice(1, -1); // escape, drop surrounding quotes
  });
}

// deno-lint-ignore no-explicit-any
type SB = any;

// Loads the SMS integration row (the HTTP request definition) by id.
async function getIntegration(supabase: SB, id: string) {
  const { data, error } = await supabase
    .from(OUTBOUND_TABLE)
    .select("id, name, target_url, http_method, headers, body_template, is_active")
    .eq("id", id)
    .single();
  if (error || !data) {
    console.log("Integration lookup failed:", { id, error });
    return null;
  }
  return data;
}

// Loads a template's variable_values object by row id.
async function getTemplateVars(supabase: SB, templateId: string): Promise<Record<string, unknown> | null> {
  if (!templateId) {
    console.log("No template id configured — skipping SMS");
    return null;
  }
  const { data, error } = await supabase
    .from(TEMPLATE_TABLE)
    .select("variable_values")
    .eq("id", templateId)
    .maybeSingle();
  if (error || !data) {
    console.log("Template lookup failed:", { templateId, error });
    return null;
  }
  return data.variable_values ?? null;
}

// Inserts one row into outbound_logs. Never throws — logging must not break the flow.
// deno-lint-ignore no-explicit-any
async function logOutbound(supabase: SB, entry: Record<string, unknown>) {
  try {
    const { error } = await supabase.from(LOGS_TABLE).insert(entry);
    if (error) console.error("Failed to write outbound log:", error);
  } catch (e) {
    console.error("Failed to write outbound log:", e);
  }
}

// Builds the request body + headers from an integration, sends it, and logs the result.
// Never throws: a failed/unreachable API is captured in the log and returned, not raised.
// deno-lint-ignore no-explicit-any
async function dispatch(supabase: SB, integration: any, resolved: Record<string, unknown>) {
  const headers: Record<string, string> = {};
  const hdrs = Array.isArray(integration.headers) ? integration.headers : [];
  for (const h of hdrs) {
    if (h?.key) headers[h.key] = h.value;
  }

  const reqBody = renderJsonBody(integration.body_template ?? "{}", resolved);

  let status: number | null = null;
  let responseText = "";
  let ok = false;
  let errorMessage: string | null = null;

  try {
    const res = await fetch(integration.target_url, {
      method: integration.http_method || "POST",
      headers,
      body: reqBody,
    });
    status = res.status;
    responseText = await res.text();
    ok = res.ok;
    console.log("Outbound API Response:", { status, body: responseText });
  } catch (e) {
    errorMessage = (e as Error).message;
    console.error("Outbound request failed:", errorMessage);
  }

  await logOutbound(supabase, {
    [LOG_COLS.integrationId]: integration.id,
    [LOG_COLS.integrationName]: integration.name,
    [LOG_COLS.requestUrl]: integration.target_url,
    [LOG_COLS.method]: integration.http_method || "POST",
    [LOG_COLS.requestPayload]: reqBody,
    [LOG_COLS.responseStatus]: status,
    [LOG_COLS.responseBody]: responseText,
    [LOG_COLS.success]: ok,
    [LOG_COLS.errorMessage]: errorMessage,
  });

  return { status, ok, responseText, reqBody, errorMessage };
}

// Renders a template (level 1: message text) and dispatches it through the integration (level 2: body).
async function sendSms(
  supabase: SB,
  templateId: string,
  destination: string,
  messageVars: Record<string, string>,
) {
  const integration = await getIntegration(supabase, SMS_INTEGRATION_ID);
  if (!integration || !integration.is_active) {
    console.log("SMS integration not found or inactive — SMS not sent");
    return;
  }

  const templateVars = await getTemplateVars(supabase, templateId);
  if (!templateVars) {
    console.log("Template not found — SMS not sent");
    return;
  }

  // Level 1: render every string in variable_values with the runtime message vars.
  const resolved: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(templateVars)) {
    resolved[k] = typeof v === "string" ? renderTemplate(v, messageVars) : v;
  }
  // The phone number always overrides destination.
  resolved.destination = destination;

  try {
    await dispatch(supabase, integration, resolved);
  } catch (smsError) {
    console.error("Error sending SMS:", smsError);
  }
}

// Reads registration_settings.is_active for the OTP toggle row.
// Returns true when OTP is required (is_active = true). Fails CLOSED: a missing
// row or a query error keeps OTP ON, so we never silently skip verification.
async function isOtpRequired(supabase: SB): Promise<boolean> {
  const { data, error } = await supabase
    .from("registration_settings")
    .select("is_active")
    .eq("id", REGISTRATION_SETTINGS_ID)
    .maybeSingle();
  if (error || !data) {
    console.log("registration_settings lookup failed — defaulting OTP ON:", error);
    return true;
  }
  return data.is_active === true;
}

/* ============================ Action handlers ============================= */

// action: "send" — sends an OTP for registration (default) or password reset.
async function handleSend(supabase: SB, body: SB) {
  const { mobile, phone, email, firstName, lastName, password, passwordHash, dateOfBirth,
    gender, bloodType, address, type, medicalId } = body;
  const phoneNumber = mobile || phone;

  if (!phoneNumber) return json({ error: "Phone number is required" }, 400);

  // ---- Password reset OTP -------------------------------------------------
  if (type === "password_reset") {
    if (!medicalId) return json({ error: "Medical ID is required for password reset" }, 400);

    // Rate limit: reject if a code was sent to this target within the cooldown window.
    const { data: recent } = await supabase
      .from("patient_password_reset_otps")
      .select("created_at")
      .eq("phone", phoneNumber)
      .eq("medical_id", medicalId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recent && Date.now() - new Date(recent.created_at).getTime() < RESEND_COOLDOWN_MS) {
      return json({ error: "Please wait a moment before requesting another code." }, 429);
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_TTL_MS);

    await supabase
      .from("patient_password_reset_otps")
      .delete()
      .eq("phone", phoneNumber)
      .eq("medical_id", medicalId);

    const { error: insertError } = await supabase
      .from("patient_password_reset_otps")
      .insert({
        phone: phoneNumber,
        medical_id: medicalId,
        otp_code: otp,
        expires_at: otpExpiry.toISOString(),
        type: "reset_password",
        attempts: 0,
      });

    if (insertError) {
      console.error("Error storing password reset OTP:", insertError);
      return json({ error: "Failed to send OTP" }, 500);
    }

    await sendSms(supabase, TEMPLATE_IDS.resetPassword, phoneNumber, { code: otp });

    // Never return the OTP — it must only reach the user via SMS.
    return json({ success: true, message: "OTP sent successfully", expiresAt: otpExpiry.toISOString() });
  }

  // ---- Registration OTP ---------------------------------------------------
  if (!email) return json({ error: "Email is required for registration" }, 400);
  if (!firstName || !lastName)
    return json({ error: "First name and last name are required" }, 400);
  // Hash server-side from the plaintext password. Fall back to a client-supplied
  // hash only for older app builds that still send passwordHash (transitional).
  const finalPasswordHash = password ? hashPassword(password) : passwordHash;
  if (!finalPasswordHash)
    return json({ error: "Password is required" }, 400);

  // Only ACTIVE accounts block registration. A soft-deleted account is allowed
  // through here and gets reactivated ("welcome back") at create time instead of
  // creating a duplicate.
  const { data: existingEmail } = await supabase
    .from("user_patients").select("id").eq("email", email).eq("is_deleted", false).maybeSingle();
  if (existingEmail) return json({ error: "Email already registered" }, 400);

  const { data: existingPhone } = await supabase
    .from("user_patients").select("id").eq("phone", phoneNumber).eq("is_deleted", false).maybeSingle();
  if (existingPhone) return json({ error: "Phone number already registered" }, 400);

  const patientName = `${firstName} ${lastName}`;

  // Honour the registration_settings toggle. When OTP is disabled, skip the
  // OTP entirely and create the verified patient right away.
  if (!(await isOtpRequired(supabase))) {
    const result = await createOrReactivatePatient(supabase, {
      medicalId: generateMedicalId(),
      firstName,
      lastName,
      email,
      phone: phoneNumber,
      passwordHash: finalPasswordHash,
      dateOfBirth,
      gender,
      bloodType,
      address,
    });

    if ("conflict" in result) {
      return json(
        { error: result.conflict === "email" ? "Email already registered" : "Phone number already registered" },
        400,
      );
    }
    if ("error" in result) {
      console.error("Error creating patient:", result.error);
      return json({ error: "Failed to create patient account", details: result.error }, 500);
    }

    return json({
      success: true,
      otpRequired: false,
      reactivated: result.reactivated,
      welcomeBack: result.reactivated,
      message: result.reactivated ? "Welcome back! Your account has been reactivated." : "Account created successfully",
      medicalId: result.medicalId,
      fullName: patientName,
    });
  }

  // Rate limit: reject if a code was sent to this target within the cooldown window.
  const { data: recent } = await supabase
    .from("otp_verification_patient")
    .select("created_at")
    .eq("mobile", phoneNumber)
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (recent && Date.now() - new Date(recent.created_at).getTime() < RESEND_COOLDOWN_MS) {
    return json({ error: "Please wait a moment before requesting another code." }, 429);
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + OTP_TTL_MS);
  // Generated now because the Medical ID is part of the registration SMS.
  // Stored on the OTP row so the SAME id is used when the patient is created at verify.
  const newMedicalId = generateMedicalId();

  await supabase
    .from("otp_verification_patient")
    .delete()
    .eq("mobile", phoneNumber)
    .eq("email", email);

  const { error: insertError } = await supabase
    .from("otp_verification_patient")
    .insert({
      mobile: phoneNumber,
      email,
      otp_code: otp,
      medical_id: newMedicalId,
      expires_at: otpExpiry.toISOString(),
      first_name: firstName,
      last_name: lastName,
      password_hash: finalPasswordHash,
      date_of_birth: dateOfBirth,
      gender,
      blood_type: bloodType,
      address,
      attempts: 0,
    });

  if (insertError) {
    console.error("Error storing OTP:", insertError);
    return json({ error: "Failed to send OTP" }, 500);
  }

  await sendSms(supabase, TEMPLATE_IDS.welcome, phoneNumber, {
    PatientName: patientName,
    MedicalID: newMedicalId,
    code: otp,
  });

  // Never return the OTP — it must only reach the user via SMS.
  return json({ success: true, otpRequired: true, message: "OTP sent successfully", expiresAt: otpExpiry.toISOString() });
}

// action: "verify" — verifies a registration OTP and creates the patient.
async function handleVerify(supabase: SB, body: SB) {
  const { phone, email, otp } = body;
  if (!phone || !email || !otp) return json({ error: "Phone, email, and OTP are required" }, 400);

  const { data: otpRecord, error: fetchError } = await supabase
    .from("otp_verification_patient")
    .select("*")
    .eq("mobile", phone)
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError || !otpRecord) return json({ error: "OTP not found or expired" }, 404);
  if (otpRecord.verified) return json({ error: "OTP already used" }, 400);
  if (new Date(otpRecord.expires_at) < new Date()) return json({ error: "OTP has expired" }, 400);
  if ((otpRecord.attempts ?? 0) >= MAX_VERIFY_ATTEMPTS)
    return json({ error: "Too many incorrect attempts. Please request a new code." }, 429);

  if (String(otpRecord.otp_code) !== String(otp)) {
    // Count the wrong try; lock the OTP once the limit is reached.
    await supabase
      .from("otp_verification_patient")
      .update({ attempts: (otpRecord.attempts ?? 0) + 1 })
      .eq("id", otpRecord.id);
    return json({ error: "Invalid OTP" }, 400);
  }

  const { error: updateError } = await supabase
    .from("otp_verification_patient")
    .update({ verified: true })
    .eq("id", otpRecord.id);
  if (updateError) {
    console.error("Error verifying OTP:", updateError);
    return json({ error: "Failed to verify OTP" }, 500);
  }

  // Reuse the Medical ID generated and texted to the patient during `send`.
  // createOrReactivatePatient reactivates a previously soft-deleted account
  // ("welcome back") instead of creating a duplicate.
  const result = await createOrReactivatePatient(supabase, {
    medicalId: otpRecord.medical_id || generateMedicalId(),
    firstName: otpRecord.first_name,
    lastName: otpRecord.last_name,
    email: otpRecord.email,
    phone: otpRecord.mobile,
    passwordHash: otpRecord.password_hash,
    dateOfBirth: otpRecord.date_of_birth,
    gender: otpRecord.gender,
    bloodType: otpRecord.blood_type,
    address: otpRecord.address,
  });

  if ("conflict" in result) {
    return json(
      { error: result.conflict === "email" ? "Email already registered" : "Phone number already registered" },
      400,
    );
  }
  if ("error" in result) {
    console.error("Error creating patient:", result.error);
    return json({ error: "Failed to create patient account", details: result.error }, 500);
  }

  await supabase.from("otp_verification_patient").delete().eq("id", otpRecord.id);

  return json({
    success: true,
    reactivated: result.reactivated,
    welcomeBack: result.reactivated,
    message: result.reactivated ? "Welcome back! Your account has been reactivated." : "Account created successfully",
    medicalId: result.medicalId,
    fullName: `${otpRecord.first_name} ${otpRecord.last_name}`,
  });
}

// action: "reset" — verifies a password-reset OTP and updates the password.
async function handleReset(supabase: SB, body: SB) {
  const { medicalId, password, phone, otpCode } = body;
  if (!medicalId || !password || !phone || !otpCode)
    return json({ success: false, error: "All fields are required" }, 400);

  const { data: otpRecord, error: otpError } = await supabase
    .from("patient_password_reset_otps")
    .select("*")
    .eq("phone", phone)
    .eq("medical_id", medicalId)
    .eq("type", "reset_password")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (otpError) {
    console.error("Error verifying OTP:", otpError);
    return json({ success: false, error: "Failed to verify OTP" }, 500);
  }
  if (!otpRecord)
    return json({ success: false, error: "Invalid or expired OTP" }, 400);
  if (new Date() > new Date(otpRecord.expires_at))
    return json({ success: false, error: "OTP has expired" }, 400);
  if ((otpRecord.attempts ?? 0) >= MAX_VERIFY_ATTEMPTS)
    return json({ success: false, error: "Too many incorrect attempts. Please request a new code." }, 429);

  if (String(otpRecord.otp_code) !== String(otpCode)) {
    await supabase
      .from("patient_password_reset_otps")
      .update({ attempts: (otpRecord.attempts ?? 0) + 1 })
      .eq("id", otpRecord.id);
    return json({ success: false, error: "Invalid or expired OTP" }, 400);
  }

  const { error: updateError } = await supabase
    .from("user_patients")
    .update({ password_hash: hashPassword(password) })
    .eq("medical_id", medicalId);
  if (updateError) {
    console.error("Error updating password:", updateError);
    return json({ success: false, error: "Failed to update password" }, 500);
  }

  await supabase.from("patient_password_reset_otps").delete().eq("id", otpRecord.id);

  return json({ success: true, message: "Password reset successfully" });
}

/* ================================ Router ================================= */

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const action = body?.action;

    switch (action) {
      case "send":
        return await handleSend(supabase, body);
      case "verify":
        return await handleVerify(supabase, body);
      case "reset":
        return await handleReset(supabase, body);
      default:
        return json({ error: `Unknown or missing action: ${action}. Expected one of send | verify | reset.` }, 400);
    }
  } catch (error) {
    console.error("Error in mobile_otp function:", error);
    return json({ error: "Internal server error", details: (error as Error).message }, 500);
  }
});
