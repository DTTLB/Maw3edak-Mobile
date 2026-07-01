import { createClient } from 'npm:@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RequestBody {
  globalId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

const getServiceAccount = () => {
  const project_id = Deno.env.get('FIREBASE_PROJECT_ID');
  const private_key = Deno.env.get('FIREBASE_PRIVATE_KEY');
  const client_email = Deno.env.get('FIREBASE_CLIENT_EMAIL');

  if (!project_id || !private_key || !client_email) {
    throw new Error('Missing Firebase credentials in environment variables');
  }

  return {
    project_id,
    private_key,
    client_email,
  };
};

function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function getAccessToken(): Promise<string> {
  const SERVICE_ACCOUNT = getServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: SERVICE_ACCOUNT.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: expiry,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(SERVICE_ACCOUNT.private_key),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );
  const jwt = `${unsignedToken}.${encodedSignature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  // Replace literal \n with actual newlines
  let normalizedPem = pem.replace(/\\n/g, '\n');

  // Remove BEGIN/END markers if present
  normalizedPem = normalizedPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '');

  // Remove all whitespace
  const pemContents = normalizedPem.replace(/\s/g, '');

  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
}

async function sendFcmNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  const accessToken = await getAccessToken();

  const stringData: Record<string, string> = {};
  if (data) {
    for (const [key, value] of Object.entries(data)) {
      stringData[key] = String(value);
    }
  }

  const message = {
    message: {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: stringData,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
          defaultSound: true,
          defaultVibrateTimings: true,
          defaultLightSettings: true,
          visibility: 'public',
        },
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            contentAvailable: true,
          },
        },
      },
    },
  };

  const SERVICE_ACCOUNT = getServiceAccount();
  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${SERVICE_ACCOUNT.project_id}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send FCM notification: ${errorText}`);
  }

  return await response.json();
}

Deno.serve(async (req: Request) => {
  console.log('=== SEND DOCTOR PUSH NOTIFICATION ===');

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { globalId, title, body, data }: RequestBody = await req.json();

    console.log('Request:', { globalId, title, body, hasData: !!data });

    if (!globalId || !title || !body) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'globalId, title, and body are required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Checking if doctor has notifications enabled for global_id:', globalId);
    const { data: doctor, error: doctorError } = await supabase
      .from('users')
      .select('allow_notifications')
      .eq('is_deleted', false)
      .eq('global_id', globalId)
      .eq('is_primary_company', true)
      .maybeSingle();

    if (doctorError) {
      console.error('Error checking doctor notification settings:', doctorError);
      throw doctorError;
    }

    if (doctor && doctor.allow_notifications === false) {
      console.log('Doctor has disabled notifications');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Doctor has disabled notifications',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Fetching device tokens for global_id:', globalId);
    const { data: tokens, error } = await supabase
      .from('device_tokens')
      .select('fcm_token, platform, device_model')
      .eq('global_id', globalId)
      .eq('is_active', true);

    console.log('Found tokens:', tokens?.length || 0);

    if (error) {
      console.error('Error fetching tokens:', error);
      throw error;
    }

    if (!tokens || tokens.length === 0) {
      console.log('No active device tokens found for doctor with global_id:', globalId);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No active device tokens found for this doctor',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Sending notifications to', tokens.length, 'device(s)');

    const results = await Promise.allSettled(
      tokens.map((token) =>
        sendFcmNotification(token.fcm_token, title, body, data)
      )
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log('Results:', { successful, failed });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification sent to ${successful} device(s)`,
        details: {
          total: tokens.length,
          successful,
          failed,
        },
        results: results.map((r, i) => ({
          device: tokens[i].device_model,
          platform: tokens[i].platform,
          status: r.status,
          error: r.status === 'rejected' ? r.reason?.message : undefined,
        })),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending doctor notification:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send notification',
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});