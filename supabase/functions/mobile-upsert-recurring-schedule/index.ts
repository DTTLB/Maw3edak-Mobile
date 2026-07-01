import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { global_id, doctor_id, clinic_id, day_of_week, start_time, end_time, schedule_id } = await req.json();

    console.log('Received request data:', { global_id, doctor_id, clinic_id, day_of_week, start_time, end_time, schedule_id });

    if (!global_id || !doctor_id || !clinic_id || day_of_week === undefined || !start_time || !end_time) {
      const missing = [];
      if (!global_id) missing.push('global_id');
      if (!doctor_id) missing.push('doctor_id');
      if (!clinic_id) missing.push('clinic_id');
      if (day_of_week === undefined) missing.push('day_of_week');
      if (!start_time) missing.push('start_time');
      if (!end_time) missing.push('end_time');

      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: `Missing: ${missing.join(', ')}`,
          received: { global_id, doctor_id, clinic_id, day_of_week, start_time, end_time }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("is_deleted", false)
      .eq("global_id", global_id);

    if (userError || !users || users.length === 0) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userIds = users.map(u => u.id);

    const { data: access, error: accessError } = await supabase
      .from("user_doctor_access")
      .select("*")
      .in("user_id", userIds)
      .eq("doctor_id", doctor_id)
      .maybeSingle();

    if (accessError || !access) {
      return new Response(
        JSON.stringify({ error: "Access denied to this doctor" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .select("company_id")
      .eq("is_deleted", false)
      .eq("id", doctor_id)
      .maybeSingle();

    if (doctorError || !doctor || !doctor.company_id) {
      return new Response(
        JSON.stringify({ error: "Doctor not found or missing company_id" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const company_id = doctor.company_id;

    if (schedule_id) {
      const { data, error } = await supabase
        .from("doctor_recurring_schedules")
        .update({
          start_time,
          end_time,
          updated_at: new Date().toISOString(),
        })
        .eq("id", schedule_id)
        .eq("doctor_id", doctor_id)
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      const { data: existing, error: checkError } = await supabase
        .from("doctor_recurring_schedules")
        .select("id")
        .eq("doctor_id", doctor_id)
        .eq("clinic_id", clinic_id)
        .eq("day_of_week", day_of_week)
        .maybeSingle();

      if (checkError) {
        return new Response(
          JSON.stringify({ error: checkError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (existing) {
        const { data, error } = await supabase
          .from("doctor_recurring_schedules")
          .update({
            start_time,
            end_time,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else {
        const { data, error } = await supabase
          .from("doctor_recurring_schedules")
          .insert({
            doctor_id,
            clinic_id,
            company_id,
            day_of_week,
            start_time,
            end_time,
          })
          .select()
          .single();

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }
  } catch (error: any) {
    console.error("Error in mobile-upsert-recurring-schedule:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error?.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
