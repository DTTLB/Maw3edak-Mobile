import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_BITS = 256;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
}

async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  const [saltHex, storedHashHex] = passwordHash.split(":");
  if (!saltHex || !storedHashHex) return false;

  const salt = hexToBytes(saltHex);
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    PBKDF2_KEY_BITS,
  );

  const hashBytes = new Uint8Array(derivedBits);
  const computedHashHex = bytesToHex(hashBytes);

  return computedHashHex === storedHashHex;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const medicalIdRaw = (body.medicalId || "").toString();
    const password = (body.password || "").toString();

    const medicalId = medicalIdRaw.toUpperCase().trim();

    if (!medicalId || !password) {
      return new Response(
        JSON.stringify({ error: "Medical ID and password are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: patients, error: patientsError } = await supabase
      .from("user_patients")
      .select("*")
      .eq("medical_id", medicalId);
    // NOTE: deleted accounts are intentionally NOT filtered here so we can
    // verify the password first and then return a clear "account deleted"
    // message rather than a misleading "invalid password" (see below).

    if (patientsError) {
      console.error("Error fetching patient:", patientsError);
      return new Response(
        JSON.stringify({ error: "Failed to authenticate" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!patients || patients.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid medical ID or password" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const patient = patients[0];

    if (!patient.is_active) {
      return new Response(
        JSON.stringify({
          error: "Account is inactive. Please contact support.",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const isValid = await verifyPassword(password, patient.password_hash);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid medical ID or password" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Soft-delete gate: password is correct, so don't say "invalid password".
    // Block the login with a clear message if the account or its patient
    // profile has been soft-deleted.
    let accountDeleted = patient.is_deleted === true;
    if (!accountDeleted) {
      const { data: profileRows } = await supabase
        .from("patients")
        .select("is_deleted")
        .eq("medical_id", patient.medical_id);
      accountDeleted = (profileRows || []).some((r: any) => r.is_deleted === true);
    }
    if (accountDeleted) {
      return new Response(
        JSON.stringify({ error: "Account not available. Please contact support." }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { error: sessionError } = await supabase
      .from("user_patient_sessions")
      .insert([
        {
          patient_id: patient.id,
          token,
          expires_at: expiresAt.toISOString(),
        },
      ]);

    if (sessionError) {
      console.error("Error creating session:", sessionError);
      return new Response(
        JSON.stringify({ error: "Failed to create session" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { password_hash, ...patientWithoutPassword } = patient;

    return new Response(
      JSON.stringify({
        session: {
          token,
          expires_at: expiresAt.getTime(),
        },
        user: patientWithoutPassword,
        patient: patientWithoutPassword,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error in mobile-login:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
