import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { pbkdf2Sync } from "node:crypto";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { medicalId, password } = body;

    const { data: patient } = await supabase
      .from("user_patients")
      .select("medical_id, password_hash")
      .eq("is_deleted", false)
      .eq("medical_id", medicalId)
      .maybeSingle();

    if (!patient) {
      return new Response(
        JSON.stringify({ error: "Patient not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const [saltHex, storedHashHex] = patient.password_hash.split(':');

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

    const isValid = computedHashHex === storedHashHex;

    return new Response(
      JSON.stringify({
        medicalId: patient.medical_id,
        saltHex: saltHex,
        saltLength: saltHex.length,
        storedHashHex: storedHashHex,
        storedHashLength: storedHashHex.length,
        computedHashHex: computedHashHex,
        computedHashLength: computedHashHex.length,
        isValid: isValid,
        passwordLength: password.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});