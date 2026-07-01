import { createClient } from 'npm:@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RequestBody {
  patientId?: string;
  medicalId?: string;
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
): Promise<{ success: boolean; error?: string; unregistered?: boolean }> {
  try {
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
      const errorData = JSON.parse(errorText);

      // Check if token is unregistered/invalid
      const errorCode = errorData?.error?.details?.[0]?.errorCode || errorData?.error?.status;
      const isUnregistered = errorCode === 'UNREGISTERED' ||
                            errorCode === 'NOT_FOUND' ||
                            errorText.includes('registration-token-not-registered') ||
                            errorText.includes('Requested entity was not found');

      console.error('FCM Error:', errorText);
      return {
        success: false,
        error: errorText,
        unregistered: isUnregistered
      };
    }

    const result = await response.json();
    return { success: true };
  } catch (error) {
    console.error('Error in sendFcmNotification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

Deno.serve(async (req: Request) => {
  console.log('=== SEND PUSH NOTIFICATION ===');

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

    const { patientId, medicalId, title, body, data }: RequestBody = await req.json();

    console.log('Request:', { patientId, medicalId, title, body, hasData: !!data });

    if (!title || !body) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Title and body are required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let targetPatientId = patientId;

    let targetMedicalId = medicalId;

    if (!targetPatientId && medicalId) {
      console.log('Looking up patient by medical_id:', medicalId);
      const { data: patient } = await supabase
        .from('user_patients')
        .select('id')
        .eq('is_deleted', false)
        .eq('medical_id', medicalId)
        .maybeSingle();

      if (patient) {
        targetPatientId = patient.id;
        console.log('Found patient:', targetPatientId);
      }
    }

    if (!targetPatientId && !medicalId) {
      console.error('Patient not found');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Patient not found',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (targetPatientId && !targetMedicalId) {
      const { data: patient } = await supabase
        .from('user_patients')
        .select('medical_id, allow_notifications')
        .eq('is_deleted', false)
        .eq('id', targetPatientId)
        .maybeSingle();

      if (patient) {
        targetMedicalId = patient.medical_id;

        if (patient.allow_notifications === false) {
          console.log('Patient has disabled notifications');
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Patient has disabled notifications',
            }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
    } else if (targetMedicalId) {
      const { data: patient } = await supabase
        .from('user_patients')
        .select('allow_notifications')
        .eq('is_deleted', false)
        .eq('medical_id', targetMedicalId)
        .maybeSingle();

      if (patient && patient.allow_notifications === false) {
        console.log('Patient has disabled notifications');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Patient has disabled notifications',
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    console.log('Fetching ALL active device tokens for medical_id:', targetMedicalId);
    const { data: tokens, error } = await supabase
      .from('device_tokens')
      .select('id, fcm_token, platform, device_model')
      .eq('medical_id', targetMedicalId)
      .not('patient_id', 'is', null)
      .eq('is_active', true);

    console.log('Found tokens:', tokens?.length || 0);

    if (error) {
      console.error('Error fetching tokens:', error);
      throw error;
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No active device tokens found for this patient',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Sending notifications to', tokens.length, 'device(s) (multi-device mode)');

    const results = await Promise.all(
      tokens.map(async (token) => {
        const result = await sendFcmNotification(token.fcm_token, title, body, data);

        // If token is unregistered, mark it as inactive
        if (result.unregistered) {
          console.log(`Token ${token.fcm_token.substring(0, 20)}... is unregistered, marking as inactive`);
          await supabase
            .from('device_tokens')
            .update({ is_active: false })
            .eq('id', token.id);
        }

        return {
          ...result,
          tokenId: token.id,
          device: token.device_model,
          platform: token.platform,
        };
      })
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const unregistered = results.filter((r) => r.unregistered).length;

    console.log('Results:', { total: tokens.length, successful, failed, unregistered });

    return new Response(
      JSON.stringify({
        success: successful > 0,
        message: `Notification sent to ${successful} of ${tokens.length} device(s)`,
        details: {
          total: tokens.length,
          successful,
          failed,
          unregistered,
        },
        results: results.map((r) => ({
          device: r.device,
          platform: r.platform,
          success: r.success,
          unregistered: r.unregistered || false,
          error: r.error,
        })),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
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
