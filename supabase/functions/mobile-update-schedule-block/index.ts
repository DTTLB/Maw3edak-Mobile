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

    const { global_id, doctor_id, block_id, block_date, start_time, end_time, block_type, reason } = await req.json();

    if (!global_id || !doctor_id || !block_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
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

    const updateData: any = {};
    if (block_date !== undefined) updateData.block_date = block_date;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (block_type !== undefined) updateData.block_type = block_type;
    if (reason !== undefined) updateData.reason = reason;

    const { data: block, error: blockError } = await supabase
      .from("doctor_schedule_blocks")
      .update(updateData)
      .eq("id", block_id)
      .eq("doctor_id", doctor_id)
      .select(`
        *,
        clinics:clinic_id (
          id,
          name,
          address
        )
      `)
      .single();

    if (blockError) {
      return new Response(
        JSON.stringify({ error: blockError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: block,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in mobile-update-schedule-block:", error);
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
