import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, X-Session-Token',
};

Deno.serve(async (req: Request) => {
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

    const sessionToken = req.headers.get("X-Session-Token");
    if (!sessionToken) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing session token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let userType: 'doctor' | 'patient' | null = null;

    const { data: doctorSession, error: doctorSessionError } = await supabase
      .from("user_sessions")
      .select("user_id, expires_at")
      .eq("token", sessionToken)
      .maybeSingle();

    if (!doctorSessionError && doctorSession) {
      if (new Date(doctorSession.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ success: false, error: "Token has expired" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      userType = 'doctor';
    } else {
      const { data: patientSession, error: patientSessionError } = await supabase
        .from("user_patient_sessions")
        .select("patient_id, expires_at")
        .eq("token", sessionToken)
        .maybeSingle();

      if (patientSessionError || !patientSession) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid or expired token" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (new Date(patientSession.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ success: false, error: "Token has expired" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      userType = 'patient';
    }

    const { notificationId, action } = await req.json();

    if (!notificationId || !action) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (action !== 'authorize' && action !== 'deny') {
      return new Response(
        JSON.stringify({ success: false, error: "Action must be 'authorize' or 'deny'" }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const notificationsTable = userType === 'doctor' ? 'doctor_notifications' : 'patient_notifications';

    const { data: notification, error: notificationError } = await supabase
      .from(notificationsTable)
      .select('id, category, auth_status')
      .eq('id', notificationId)
      .maybeSingle();

    if (notificationError || !notification) {
      return new Response(
        JSON.stringify({ success: false, error: 'Notification not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (notification.category !== 'authorization') {
      return new Response(
        JSON.stringify({ success: false, error: 'Only authorization notifications can be processed' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (notification.auth_status) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization already processed' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const authStatus = action === 'authorize' ? 'authorized' : 'denied';

    const { error: markError } = await supabase
      .from(notificationsTable)
      .update({ read: true, completed: true, auth_status: authStatus })
      .eq('id', notificationId);

    if (markError) {
      console.error('Error updating notification:', markError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update notification' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: action === 'authorize' ? 'Authorization approved' : 'Authorization denied',
        auth_status: authStatus
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error handling authorization:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
