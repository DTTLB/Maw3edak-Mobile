import { createClient } from 'npm:@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// ---------------------------------------------------------------------------
// FCM HTTP v1 auth + send (same proven path as `send-push-notification`,
// reusing the existing FIREBASE_* secrets — no new Firebase setup required).
// ---------------------------------------------------------------------------
const getServiceAccount = () => {
  const project_id = Deno.env.get('FIREBASE_PROJECT_ID');
  const private_key = Deno.env.get('FIREBASE_PRIVATE_KEY');
  const client_email = Deno.env.get('FIREBASE_CLIENT_EMAIL');
  if (!project_id || !private_key || !client_email) {
    throw new Error('Missing Firebase credentials in environment variables');
  }
  return { project_id, private_key, client_email };
};

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  let normalizedPem = pem.replace(/\\n/g, '\n');
  normalizedPem = normalizedPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '');
  const pemContents = normalizedPem.replace(/\s/g, '');
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes.buffer;
}

let cachedToken: { value: string; exp: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.value;

  const SERVICE_ACCOUNT = getServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: SERVICE_ACCOUNT.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: expiry,
    iat: now,
  };

  const unsignedToken = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(SERVICE_ACCOUNT.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsignedToken),
  );
  const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
  const jwt = `${unsignedToken}.${encodedSignature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!response.ok) throw new Error(`Failed to get access token: ${await response.text()}`);

  const data = await response.json();
  cachedToken = { value: data.access_token, exp: Date.now() + 3600 * 1000 };
  return data.access_token;
}

async function sendFcmNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, any>,
): Promise<{ success: boolean; unregistered?: boolean; error?: string }> {
  try {
    const accessToken = await getAccessToken();
    const projectId = getServiceAccount().project_id;

    const stringData: Record<string, string> = {};
    if (data) {
      for (const [k, v] of Object.entries(data)) stringData[k] = String(v);
    }

    const message = {
      message: {
        token: fcmToken,
        notification: { title, body },
        data: stringData,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default',
            defaultSound: true,
            defaultVibrateTimings: true,
            visibility: 'public',
          },
        },
        apns: {
          headers: { 'apns-priority': '10' },
          payload: { aps: { sound: 'default', badge: 1, contentAvailable: true } },
        },
      },
    };

    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      let errorCode = '';
      try {
        const errorData = JSON.parse(errorText);
        errorCode = errorData?.error?.details?.[0]?.errorCode || errorData?.error?.status || '';
      } catch (_) { /* ignore */ }
      const unregistered =
        errorCode === 'UNREGISTERED' ||
        errorCode === 'NOT_FOUND' ||
        errorText.includes('registration-token-not-registered') ||
        errorText.includes('Requested entity was not found');
      console.error('FCM Error:', errorText);
      return { success: false, unregistered, error: errorText };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in sendFcmNotification:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// ---------------------------------------------------------------------------
// Handler: drain due reminders, push to each of the patient's devices, mark sent.
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Optional shared-secret guard (set CRON_SECRET in the function secrets and
  // pass it as `Authorization: Bearer <CRON_SECRET>` from pg_cron).
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret) {
    const auth = req.headers.get('Authorization') || '';
    if (auth !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: due, error } = await supabase
      .from('reminder_queue')
      .select('*')
      .lte('send_at', new Date().toISOString())
      .eq('sent', false)
      .order('send_at', { ascending: true })
      .limit(200);

    if (error) throw error;

    let sent = 0;
    let noDevice = 0;

    for (const r of due ?? []) {
      const { data: tokens } = await supabase
        .from('device_tokens')
        .select('id, fcm_token')
        .eq('patient_id', r.patient_id)
        .eq('is_active', true);

      if (!tokens || tokens.length === 0) {
        noDevice++;
      } else {
        for (const { id, fcm_token } of tokens) {
          const result = await sendFcmNotification(fcm_token, r.title, r.body, r.data || {});
          if (result.unregistered) {
            await supabase.from('device_tokens').update({ is_active: false }).eq('id', id);
          } else if (result.success) {
            sent++;
          }
        }
      }

      // Mark processed regardless — a missed dose is not re-sent the next minute.
      await supabase
        .from('reminder_queue')
        .update({ sent: true, sent_at: new Date().toISOString() })
        .eq('id', r.id);
    }

    return new Response(
      JSON.stringify({ success: true, due: due?.length ?? 0, pushed: sent, noDevice }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in send-due-reminders:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
