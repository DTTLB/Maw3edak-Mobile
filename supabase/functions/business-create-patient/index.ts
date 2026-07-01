import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { randomBytes, pbkdf2Sync } from "node:crypto";

// =============================================================================
// business-create-patient
// -----------------------------------------------------------------------------
// NEW, dedicated endpoint for the RECEPTIONIST flow: a receptionist registers a
// walk-in patient from the reception desk. It mirrors the public patient-register
// logic (creates the global `user_patients` account, generates a unique
// medical_id, hashes a password) BUT:
//   - it does NOT require the "verify a human" / OTP step (the receptionist is
//     an authenticated staff member acting on the patient's behalf), and
//   - it GENERATES the password server-side and returns it once (plaintext) so
//     the receptionist can hand the medical_id + password to the patient, and
//   - it also creates the company-scoped `patients` profile for the
//     receptionist's company and links it to the receptionist's doctors via
//     `patient_doctor_access`, so the new patient is immediately visible and
//     bookable in the reception screens.
//
// Duplicate handling matches patient-register: an ACTIVE account on the same
// email/phone is blocked; a soft-deleted one is reactivated instead of
// duplicated.
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Same hashing scheme as patient-register, so the generated password works with
// the existing patient login (pbkdf2, 100k iterations, sha256, "salt:hash" hex).
function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derivedKey = pbkdf2Sync(password, salt, 100000, 32, "sha256");
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

// Human-friendly password: 10 chars from an unambiguous alphabet (no 0/O, 1/I/l)
// so it can be read aloud / copied without confusion.
function generatePassword(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(10);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

async function generateUniqueMedicalId(supabase: any): Promise<string> {
  for (let attempts = 0; attempts < 100; attempts++) {
    const random = Math.floor(Math.random() * 900000000) + 100000000;
    const medicalId = `MED-${random}`;
    const { data: existing } = await supabase
      .from("user_patients")
      .select("id")
      .eq("medical_id", medicalId)
      .maybeSingle();
    if (!existing) return medicalId;
  }
  throw new Error("Failed to generate unique medical ID after maximum attempts");
}

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
    const userId: string | null = (body.user_id || body.userId || "").trim() || null;
    const firstName: string = (body.first_name || body.firstName || "").trim();
    const lastName: string = (body.last_name || body.lastName || "").trim();
    const email: string | null = (body.email || "").trim().toLowerCase() || null;
    const phone: string | null = (body.phone || "").trim() || null;
    const dateOfBirth: string | null = (body.date_of_birth || body.dateOfBirth || "").trim() || null;
    const gender: string | null = (body.gender || "").trim() || null;
    const bloodType: string | null = (body.blood_type || body.bloodType || "").trim() || null;
    const address: string | null = (body.address || "").trim() || null;

    // ---- Validate input -----------------------------------------------------
    if (!userId || !UUID_RE.test(userId)) {
      return json({ success: false, error: "A valid user_id is required" }, 400);
    }
    if (!firstName || !lastName) {
      return json({ success: false, error: "First and last name are required" }, 400);
    }
    if (!email && !phone) {
      return json({ success: false, error: "A phone number or email is required" }, 400);
    }

    // ---- Authorize the receptionist + resolve their company -----------------
    const { data: staff, error: staffError } = await supabase
      .from("users")
      .select("id, company_id, is_deleted")
      .eq("id", userId)
      .maybeSingle();

    if (staffError || !staff || staff.is_deleted === true) {
      return json({ success: false, error: "User not found or not authorized" }, 403);
    }
    const companyId = staff.company_id;
    if (!companyId) {
      return json({ success: false, error: "User is not linked to a company" }, 400);
    }

    // ---- Look up any existing global account by email or phone --------------
    // (including soft-deleted, so we can reactivate instead of duplicating).
    const lookups = await Promise.all([
      email
        ? supabase.from("user_patients").select("id, medical_id, is_deleted").eq("email", email).maybeSingle()
        : Promise.resolve({ data: null }),
      phone
        ? supabase.from("user_patients").select("id, medical_id, is_deleted").eq("phone", phone).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    const byEmail: any = lookups[0].data;
    const byPhone: any = lookups[1].data;

    if (byEmail && byEmail.is_deleted === false) {
      return json({ success: false, error: "A patient with this email already exists" }, 409);
    }
    if (byPhone && byPhone.is_deleted === false) {
      return json({ success: false, error: "A patient with this phone number already exists" }, 409);
    }

    // ---- Create or reactivate the global user_patients account --------------
    const password = generatePassword();
    const passwordHash = hashPassword(password);

    // The receptionist hands the patient an AUTO-GENERATED temporary password.
    // Force a password change on first login and give the temp password a
    // 7-day lifetime. These flags are read by mobile-patient-login.
    const nowIso = new Date().toISOString();
    const tempPasswordExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const firstLoginFields = {
      must_change_password: true,
      password_reset_reason: "AUTO_GENERATED_PASSWORD",
      temp_password_expires_at: tempPasswordExpiresAt,
      password_changed_at: null,
      first_login_at: null,
    };

    const reactivateTarget =
      (byEmail && byEmail.is_deleted ? byEmail : null) ??
      (byPhone && byPhone.is_deleted ? byPhone : null);

    let medicalId: string;
    let reactivated = false;

    if (reactivateTarget) {
      const { error: reactivateError } = await supabase
        .from("user_patients")
        .update({
          is_deleted: false,
          is_verified: true,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          password_hash: passwordHash,
          date_of_birth: dateOfBirth,
          gender,
          blood_type: bloodType,
          address,
          ...firstLoginFields,
          updated_at: nowIso,
        })
        .eq("id", reactivateTarget.id);
      if (reactivateError) {
        return json({ success: false, error: "Failed to reactivate patient account", details: reactivateError.message }, 500);
      }
      // Drop any stale two-factor enrolment from the previous account life.
      await supabase.from("patient_two_factor").delete().eq("patient_id", reactivateTarget.id);
      medicalId = reactivateTarget.medical_id;
      reactivated = true;
    } else {
      medicalId = await generateUniqueMedicalId(supabase);
      const { error: insertError } = await supabase.from("user_patients").insert({
        medical_id: medicalId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password_hash: passwordHash,
        date_of_birth: dateOfBirth,
        gender,
        blood_type: bloodType,
        address,
        is_verified: true,
        ...firstLoginFields,
      });
      if (insertError) {
        return json({ success: false, error: "Failed to create patient account", details: insertError.message }, 500);
      }
    }

    // ---- Create / reactivate the company-scoped patients profile ------------
    // NOTE: `full_name` is a generated column in `patients` — never write it.
    const profileFields = {
      company_id: companyId,
      medical_id: medicalId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      date_of_birth: dateOfBirth,
      gender,
      blood_type: bloodType,
      address,
      is_active: true,
      authorized: true,
      is_deleted: false,
    };

    const { data: existingProfile } = await supabase
      .from("patients")
      .select("id")
      .eq("company_id", companyId)
      .eq("medical_id", medicalId)
      .maybeSingle();

    let patientId: string;
    if (existingProfile) {
      const { error: updateError } = await supabase
        .from("patients")
        .update(profileFields)
        .eq("id", existingProfile.id);
      if (updateError) {
        return json({ success: false, error: "Failed to update patient profile", details: updateError.message }, 500);
      }
      patientId = existingProfile.id;
    } else {
      const { data: inserted, error: profileError } = await supabase
        .from("patients")
        .insert(profileFields)
        .select("id")
        .single();
      if (profileError || !inserted) {
        return json({ success: false, error: "Failed to create patient profile", details: profileError?.message }, 500);
      }
      patientId = inserted.id;
    }

    // ---- Link the patient to the receptionist's doctors ---------------------
    // Without a patient_doctor_access row the patient is invisible to the
    // reception screens (the patient list is doctor-scoped). Link to every
    // doctor this receptionist is assigned to, skipping any existing links.
    const { data: doctorAccess } = await supabase
      .from("user_doctor_access")
      .select("doctor_id")
      .eq("user_id", userId);

    const doctorIds = [...new Set((doctorAccess || []).map((r: any) => r.doctor_id).filter(Boolean))];
    if (doctorIds.length > 0) {
      const { data: existingLinks } = await supabase
        .from("patient_doctor_access")
        .select("doctor_id")
        .eq("patient_id", patientId)
        .in("doctor_id", doctorIds);
      const linked = new Set((existingLinks || []).map((r: any) => r.doctor_id));
      const newLinks = doctorIds
        .filter((id) => !linked.has(id))
        .map((doctor_id) => ({ patient_id: patientId, doctor_id, company_id: companyId }));
      if (newLinks.length > 0) {
        const { error: linkError } = await supabase.from("patient_doctor_access").insert(newLinks);
        if (linkError) {
          // Non-fatal: the patient exists; they just may not show until linked.
          console.error("patient_doctor_access insert failed (non-fatal):", linkError.message);
        }
      }
    }

    return json({
      success: true,
      reactivated,
      message: reactivated ? "Existing patient reactivated" : "Patient created successfully",
      patientId,
      medicalId,
      password,
    });
  } catch (error: any) {
    console.error("Error in business-create-patient:", error);
    return json({ success: false, error: "Internal server error", details: error?.message || String(error) }, 500);
  }
});
