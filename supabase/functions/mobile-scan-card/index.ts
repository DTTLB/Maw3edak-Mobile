import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function base64url(data: ArrayBuffer | string): string {
  let binary: string;
  if (typeof data === "string") {
    binary = btoa(unescape(encodeURIComponent(data)));
  } else {
    const bytes = new Uint8Array(data);
    let str = "";
    for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
    binary = btoa(str);
  }
  return binary.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const normalized = pem
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const lines = normalized.split("\n");
  const b64Lines = lines.filter(
    (line) =>
      line.trim().length > 0 &&
      !line.includes("-----BEGIN") &&
      !line.includes("-----END")
  );
  const b64 = b64Lines.join("");

  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

async function getAccessToken(privateKeyPem: string, clientEmail: string): Promise<string> {
  console.log("[mobile-scan-card] pemToArrayBuffer start");
  const keyBuffer = pemToArrayBuffer(privateKeyPem);
  console.log("[mobile-scan-card] pemToArrayBuffer done, keyBuffer byteLength:", keyBuffer.byteLength);

  console.log("[mobile-scan-card] importKey start");
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  console.log("[mobile-scan-card] importKey done");

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/cloud-vision",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }));

  const signingInput = `${header}.${payload}`;
  console.log("[mobile-scan-card] signing JWT...");
  const signature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );
  console.log("[mobile-scan-card] JWT signed, exchanging for access token...");

  const jwt = `${signingInput}.${base64url(signature)}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  console.log("[mobile-scan-card] token exchange HTTP status:", tokenRes.status);
  const tokenData = await tokenRes.json();
  console.log("[mobile-scan-card] token exchange result keys:", Object.keys(tokenData).join(", "));
  if (!tokenData.access_token) {
    console.error("[mobile-scan-card] token exchange failed:", JSON.stringify(tokenData));
    throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
  }
  console.log("[mobile-scan-card] access token obtained successfully");
  return tokenData.access_token;
}

function detectBrand(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "American Express";
  return "Other";
}

function parseCardData(rawText: string): {
  cardNumber: string | null;
  expiry: string | null;
  holderName: string | null;
  brand: string;
} {
  const normalizedText = rawText.replace(/\n/g, " ").replace(/\s+/g, " ");

  const cardRegex16 = /\b(\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4})\b/;
  const cardRegex15 = /\b(3[47]\d{2}[\s\-]?\d{6}[\s\-]?\d{5})\b/;
  const cardMatch = normalizedText.match(cardRegex16) || normalizedText.match(cardRegex15);
  const rawCardNumber = cardMatch ? cardMatch[1].replace(/[\s\-]/g, "") : null;

  const expiryRegex = /\b(0[1-9]|1[0-2])[\/\s\-](\d{2,4})\b/;
  const expiryMatch = normalizedText.match(expiryRegex);
  let expiry: string | null = null;
  if (expiryMatch) {
    expiry = `${expiryMatch[1]}/${expiryMatch[2].slice(-2)}`;
  }

  const skipWords = new Set([
    "VALID", "THRU", "THROUGH", "EXPIRES", "EXPIRY", "MEMBER", "SINCE",
    "CREDIT", "DEBIT", "CARD", "BANK", "VISA", "MASTERCARD", "AMEX", "AMERICAN", "EXPRESS",
  ]);
  const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
  let holderName: string | null = null;

  for (const line of lines) {
    if (/^[A-Z][A-Z\s\.\-]{3,30}$/.test(line)) {
      const words = line.trim().split(/\s+/);
      const isName = words.length >= 2 && words.every(w => !skipWords.has(w) && /^[A-Z][A-Z\-\.]*$/.test(w));
      if (isName) {
        holderName = line.trim();
        break;
      }
    }
  }

  return {
    cardNumber: rawCardNumber,
    expiry,
    holderName,
    brand: rawCardNumber ? detectBrand(rawCardNumber) : "Other",
  };
}

Deno.serve(async (req: Request) => {
  console.log("[mobile-scan-card] Request received:", req.method);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log("[mobile-scan-card] Parsing request body...");
    let body: { imageBase64?: string };
    try {
      body = await req.json();
    } catch (parseErr) {
      console.error("[mobile-scan-card] Failed to parse JSON body:", parseErr);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { imageBase64 } = body;

    console.log("[mobile-scan-card] imageBase64 present:", !!imageBase64);
    if (imageBase64) {
      console.log("[mobile-scan-card] imageBase64 length:", imageBase64.length, "bytes (base64)");
    }

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (imageBase64.length > 4_000_000) {
      console.error("[mobile-scan-card] Image too large:", imageBase64.length, "chars. Limit is ~4MB base64.");
      return new Response(
        JSON.stringify({ success: false, error: "Image is too large. Please try again with a lower quality setting." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const envKey = Deno.env.get("GOOGLE_CLOUD_VISION_PRIVATE_KEY");
    console.log("[mobile-scan-card] env key present:", !!envKey, "length:", envKey?.length ?? 0);
    const privateKeyPem = envKey ||
      "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCoGqMm+5yJsx/p\n9mDmrGoNLA29vECzC1GzrWfMWNVFDrdiCFOcORmYlfzx7Om01hWQaZcqLBuVPP5i\nIhVuWB85DJovMs2dKU4Mk9z+3ffKvSap+GFroDgQkyzdoRoT8+rnhEvPs4yj/0Mg\nTZfX/EKzrOwmMKt+Pta5vp9T2NvsaRa4pb2T/ixYax+5jdfUrhXj88ajAuKKUPXJ\nQB43Ytt52F84IULtF0Wut5iqYPdrgIx2V5JO1CJPMQQgfkfCYDgLot8sQC1p1YIM\n+5yTSm/8Ge8Vw3a2DxteyWhB8ecUFbTi7Jhgg2kHx+Jru/jl0j/Z5RMlEfYqAq5d\neS2H18ytAgMBAAECggEAH2ny6TsF0rm1kgwnqZO4scN0wesnEA5iczhJeGd1W1VX\nsasqrLwC63/D6BXEyrVjDDyfMhNSCD6Aryf9Z0RyeT/ApGdTAzaPzkvndX1Xa/yS\n+BphYjJrp7VJIhWUAPyI/kC7xhGgi5kNG0FEyejrMhZzfuODeLEXgVh8/7c7yd6/\n2H2Z0+Z6bKseJAVfCBIs6y+DL4sZAkiKiAhZEQ5gOAGu7uP1C+OLELZtihGY/Zpi\nyxQYsk9kHUdhfL2+kbpE73IbLCEax6mXhzuiVMqtwyn6N3QxVbgGL8CiblwlZK2j\nI4wAhuIMpeMlHszRVE4xk1HCga4S3An6rMxV40wNpQKBgQDeF29ZNR8ZVJ1Ukgo0\nwgHzHdY0lAKLY13sPSLNAf1LAsqguraeEHjq4J+qntAMazV+8dxEQS+9JMuECLjX\nM+xgdHKwVysDCWJcMwIyEH2809ldfoSB7ZlbWLw0FkycU9QSjWpBbfd9i5kLSgtx\nCNndKV6jAMCY8Ik/+cvf4JPTawKBgQDBxRKkIqoD9inq3IYvowuvHA9ZQ4ZcA7yx\ncyNLHgnrYqzcDkb2uLHbtYBLLc1uX2+lU6ze7Iz+6iamUnD8GHU/7H4ozq44QuKU\nA6wq2idC49zfvQe2uUGD6TrfiLcLOu+X5kfp+2sXR0K9bAWv6TAIMHyeA9KDVBZb\nSeHhkjz+RwKBgQDRsES0cGBldSt6rswuFcLrfQ9C40AnxPDn3K0f7LHvAbq42LEV\nOi5AbUazPHDoWMzQh6DVXMqrBbOVfPqwTVjvlOK4NgTpQBH7RTncdQ+Sml7PVGXd\nmqzBv10qvKcmrks8HQLmteIHSid8rjNxTM8ObkHpGwu9GtYrbjkcrphD8wKBgQC+\nBVJDjg7mdagjvwEEhEM4BS90HUkMwUlxR3Ur/BhEMm9MGeAzoWoiCPr4PsF/5K1r\nFwSnVJjsf5lJb/2G60FIX9ZUlGK7n7Ps7TEQkQEBks2OyCRhZ4k9ICJxBfRjWfeO\nIfESH1Gk8WgctGtbWDWXQl1i5GK0EWkfOvP9rtiLjwKBgDloFU1vlmb4uww+o1ra\nVDTVt+FK6N+920l0m+8qvbY9fXm26GVaMEMFdObeQfEw/+xsOaPE2dY8cznTMskH\nB8jG9ejeRtk3UK3NNgA0esTlB0D9xgRWq7EocEKlaGfdPo1cjLXTT7fTcSHVnNGq\nl2xoquy2qtGRxPF+aJVp/jz3\n-----END PRIVATE KEY-----\n";
    const clientEmail = Deno.env.get("GOOGLE_CLOUD_VISION_CLIENT_EMAIL") ||
      "ocr-988@maw3edak-5d473.iam.gserviceaccount.com";

    console.log("[mobile-scan-card] Getting access token for:", clientEmail);
    const accessToken = await getAccessToken(privateKeyPem, clientEmail);
    console.log("[mobile-scan-card] Access token obtained, calling Vision API...");

    const visionResponse = await fetch(
      "https://vision.googleapis.com/v1/images:annotate",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBase64 },
              features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
            },
          ],
        }),
      }
    );

    console.log("[mobile-scan-card] Vision API response status:", visionResponse.status);
    const visionData = await visionResponse.json();
    console.log("[mobile-scan-card] Vision API response ok:", visionResponse.ok, "error:", visionData.error?.message || "none");

    if (!visionResponse.ok || visionData.error) {
      return new Response(
        JSON.stringify({ success: false, error: `Vision API error: ${visionData.error?.message || "Unknown"}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const textAnnotations = visionData.responses?.[0]?.textAnnotations;
    console.log("[mobile-scan-card] textAnnotations count:", textAnnotations?.length ?? 0);
    if (!textAnnotations || textAnnotations.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No text detected. Please ensure the card is well-lit and clearly visible." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fullText = textAnnotations[0].description || "";
    const parsed = parseCardData(fullText);

    if (!parsed.cardNumber) {
      return new Response(
        JSON.stringify({ success: false, error: "Could not detect card number. Please position the card clearly within the frame." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        cardNumber: parsed.cardNumber,
        expiry: parsed.expiry,
        holderName: parsed.holderName,
        brand: parsed.brand,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: `Error: ${err instanceof Error ? err.message : "Unexpected error"}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
