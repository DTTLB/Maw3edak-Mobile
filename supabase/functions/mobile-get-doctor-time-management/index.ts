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

    const { global_id, doctor_id, clinic_id, start_date, end_date, company_id } = await req.json();

    if (!global_id) {
      return new Response(
        JSON.stringify({ error: "Missing global_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!doctor_id) {
      let userQuery = supabase
        .from("users")
        .select("id, is_primary_company, company_id")
        .eq("is_deleted", false)
        .eq("global_id", global_id);

      if (company_id) {
        userQuery = userQuery.eq("company_id", company_id);
      }

      const { data: users, error: userError } = await userQuery;

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
      const companyIds = users.map(u => u.company_id);

      const { data: doctorAccess, error: accessError } = await supabase
        .from("user_doctor_access")
        .select(`
          doctors:doctor_id (
            id,
            first_name,
            last_name,
            company_id
          )
        `)
        .in("user_id", userIds);

      if (accessError) {
        return new Response(
          JSON.stringify({ error: accessError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      let filteredDoctors = (doctorAccess || [])
        .filter((item: any) => item.doctors && companyIds.includes(item.doctors.company_id))
        .map((item: any) => ({
          id: item.doctors.id,
          full_name: `${item.doctors.first_name} ${item.doctors.last_name}`,
          name: `${item.doctors.first_name} ${item.doctors.last_name}`,
          first_name: item.doctors.first_name,
          last_name: item.doctors.last_name,
        }));

      const doctorIds = filteredDoctors.map(d => d.id);

      const { data: clinicAccess, error: clinicError } = await supabase
        .from("doctor_clinic_access")
        .select(`
          clinics:clinic_id (
            id,
            name,
            address
          )
        `)
        .in("doctor_id", doctorIds);

      if (clinicError) {
        return new Response(
          JSON.stringify({ error: clinicError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const clinicsMap = new Map();
      (clinicAccess || []).forEach((item: any) => {
        if (item.clinics) {
          clinicsMap.set(item.clinics.id, {
            id: item.clinics.id,
            name: item.clinics.name,
            address: item.clinics.address,
          });
        }
      });

      const clinics = Array.from(clinicsMap.values());

      let schedulesQuery = supabase
        .from("doctor_recurring_schedules")
        .select("*, clinics(id, name, address)")
        .in("doctor_id", doctorIds);

      if (clinic_id) {
        schedulesQuery = schedulesQuery.eq("clinic_id", clinic_id);
      }

      const { data: schedules, error: schedulesError } = await schedulesQuery;

      if (schedulesError) {
        console.error("Error fetching schedules:", schedulesError);
      }

      let blocksQuery = supabase
        .from("doctor_schedule_blocks")
        .select("*, clinics(id, name, address)")
        .in("doctor_id", doctorIds);

      if (start_date) {
        blocksQuery = blocksQuery.gte("block_date", start_date);
      }

      if (clinic_id) {
        blocksQuery = blocksQuery.eq("clinic_id", clinic_id);
      }

      const { data: blocks, error: blocksError } = await blocksQuery;

      if (blocksError) {
        console.error("Error fetching blocks:", blocksError);
      }

      let exceptionsQuery = supabase
        .from("doctor_schedule_exceptions")
        .select("*, clinics(name)")
        .in("doctor_id", doctorIds);

      if (start_date) {
        exceptionsQuery = exceptionsQuery.gte("exception_date", start_date);
      }

      if (clinic_id) {
        exceptionsQuery = exceptionsQuery.eq("clinic_id", clinic_id);
      }

      const { data: exceptions, error: exceptionsError } = await exceptionsQuery;

      if (exceptionsError) {
        console.error("Error fetching exceptions:", exceptionsError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            doctors: filteredDoctors,
            clinics,
            schedules: schedules || [],
            exceptions: exceptions || [],
            blocks: blocks || [],
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let userQuery2 = supabase
      .from("users")
      .select("id")
      .eq("is_deleted", false)
      .eq("global_id", global_id);

    if (company_id) {
      userQuery2 = userQuery2.eq("company_id", company_id);
    }

    const { data: users, error: userError } = await userQuery2;

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

    let schedulesQuery = supabase
      .from("doctor_recurring_schedules")
      .select("*, clinics(id, name, address)")
      .eq("doctor_id", doctor_id);

    if (clinic_id) {
      schedulesQuery = schedulesQuery.eq("clinic_id", clinic_id);
    }

    const { data: schedules, error: schedulesError } = await schedulesQuery;

    if (schedulesError) {
      console.error("Error fetching schedules:", schedulesError);
    }

    let blocksQuery = supabase
      .from("doctor_schedule_blocks")
      .select("*, clinics(id, name, address)")
      .eq("doctor_id", doctor_id);

    if (start_date) {
      blocksQuery = blocksQuery.gte("block_date", start_date);
    }

    if (clinic_id) {
      blocksQuery = blocksQuery.eq("clinic_id", clinic_id);
    }

    const { data: blocks, error: blocksError } = await blocksQuery;

    if (blocksError) {
      console.error("Error fetching blocks:", blocksError);
    }

    let exceptionsQuery = supabase
      .from("doctor_schedule_exceptions")
      .select("*, clinics(name)")
      .eq("doctor_id", doctor_id);

    if (start_date) {
      exceptionsQuery = exceptionsQuery.gte("exception_date", start_date);
    }

    if (clinic_id) {
      exceptionsQuery = exceptionsQuery.eq("clinic_id", clinic_id);
    }

    const { data: exceptions, error: exceptionsError } = await exceptionsQuery;

    if (exceptionsError) {
      console.error("Error fetching exceptions:", exceptionsError);
    }

    const { data: doctorClinics, error: doctorClinicsError } = await supabase
      .from("doctor_clinic_access")
      .select(`
        clinics:clinic_id (
          id,
          name,
          address
        )
      `)
      .eq("doctor_id", doctor_id);

    const clinics = (doctorClinics || [])
      .filter(item => item.clinics)
      .map(item => item.clinics);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          schedules: schedules || [],
          exceptions: exceptions || [],
          blocks: blocks || [],
          clinics: clinics || [],
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in mobile-get-doctor-time-management:", error);
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
