import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { randomBytes, pbkdf2Sync } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derivedKey = pbkdf2Sync(password, salt, 100000, 32, 'sha256');

  const saltHex = salt.toString('hex');
  const hashHex = derivedKey.toString('hex');

  return `${saltHex}:${hashHex}`;
}

async function generateUniqueMedicalId(supabase: any): Promise<string> {
  let medicalId: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 100;

  while (!isUnique && attempts < maxAttempts) {
    const random = Math.floor(Math.random() * 900000000) + 100000000;
    medicalId = `MED-${random}`;

    const { data: existing } = await supabase
      .from("user_patients")
      .select("id")
      .eq("medical_id", medicalId)
      .maybeSingle();

    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error("Failed to generate unique medical ID after maximum attempts");
  }

  return medicalId!;
}

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

    const body = await req.json();
    const {
      verificationId,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      bloodType,
      address,
    } = body;

    if (!verificationId || !password || !firstName || !lastName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: otpRecord, error: otpError } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("id", verificationId)
      .eq("is_verified", true)
      .maybeSingle();

    if (otpError || !otpRecord) {
      return new Response(
        JSON.stringify({ error: "Invalid or unverified verification ID" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Look up any existing account by email or phone, INCLUDING soft-deleted
    // ones, so we can reactivate ("welcome back") instead of creating a duplicate.
    const [{ data: byEmail }, { data: byPhone }] = await Promise.all([
      supabase
        .from("user_patients")
        .select("id, medical_id, is_deleted")
        .eq("email", otpRecord.email)
        .maybeSingle(),
      supabase
        .from("user_patients")
        .select("id, medical_id, is_deleted")
        .eq("phone", otpRecord.phone)
        .maybeSingle(),
    ]);

    // An ACTIVE account already uses this email/phone -> block (ask them to log in).
    if (byEmail && byEmail.is_deleted === false) {
      return new Response(
        JSON.stringify({ error: "Email already registered" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    if (byPhone && byPhone.is_deleted === false) {
      return new Response(
        JSON.stringify({ error: "Phone number already registered" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const passwordHash = hashPassword(password);

    // A previously soft-deleted account matching email/phone -> reactivate it.
    const target =
      (byEmail && byEmail.is_deleted ? byEmail : null) ??
      (byPhone && byPhone.is_deleted ? byPhone : null);

    let medicalId: string;
    let patientId: string;
    let reactivated = false;

    if (target) {
      const { error: reactivateError } = await supabase
        .from("user_patients")
        .update({
          is_deleted: false,
          is_verified: true,
          first_name: firstName,
          last_name: lastName,
          email: otpRecord.email,
          phone: otpRecord.phone,
          password_hash: passwordHash,
          date_of_birth: dateOfBirth,
          gender: gender,
          blood_type: bloodType,
          address: address,
        })
        .eq("id", target.id);

      if (reactivateError) {
        console.error("Error reactivating patient:", reactivateError);
        return new Response(
          JSON.stringify({ error: "Failed to reactivate patient account", details: reactivateError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Reactivate the related patient profile row(s) by the same medical_id.
      await supabase
        .from("patients")
        .update({ is_deleted: false })
        .eq("medical_id", target.medical_id);

      // Drop any stale two-factor enrollment from the previous account life so
      // the reactivated patient can enroll a fresh second factor instead of
      // being locked out by an old secret/recovery codes they no longer have.
      await supabase
        .from("patient_two_factor")
        .delete()
        .eq("patient_id", target.id);

      medicalId = target.medical_id;
      patientId = target.id;
      reactivated = true;
    } else {
      medicalId = await generateUniqueMedicalId(supabase);

      const { data: patient, error: insertError } = await supabase
        .from("user_patients")
        .insert({
          medical_id: medicalId,
          first_name: firstName,
          last_name: lastName,
          email: otpRecord.email,
          phone: otpRecord.phone,
          password_hash: passwordHash,
          date_of_birth: dateOfBirth,
          gender: gender,
          blood_type: bloodType,
          address: address,
          is_verified: true,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating patient:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to create patient account", details: insertError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      patientId = patient.id;
    }

    await supabase
      .from("otp_verifications")
      .delete()
      .eq("id", verificationId);

    return new Response(
      JSON.stringify({
        success: true,
        reactivated,
        welcomeBack: reactivated,
        message: reactivated
          ? "Welcome back! Your account has been reactivated."
          : "Patient account created successfully",
        medicalId: medicalId,
        patientId: patientId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in patient_register:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});