import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const globalId = url.searchParams.get("global_id");
    const companyId = url.searchParams.get("company_id");

    if (!globalId) {
      return new Response(
        JSON.stringify({ error: "Missing global_id parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user records with this global_id (optionally filtered by company_id)
    let userQuery = supabase
      .from("users")
      .select("id, company_id")
      .eq("is_deleted", false)
      .eq("global_id", globalId);

    if (companyId) {
      userQuery = userQuery.eq("company_id", companyId);
    }

    const { data: allUserData, error: userError } = await userQuery;

    if (userError || !allUserData || allUserData.length === 0) {
      console.error("User lookup error:", userError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userIds = allUserData.map((user: any) => user.id);
    const companyIds = allUserData.map((user: any) => user.company_id);

    // Get doctors the user has access to via user_doctor_access table
    const { data: doctorAccess, error: accessError } = await supabase
      .from("user_doctor_access")
      .select(`
        doctors:doctor_id (
          id,
          company_id,
          first_name,
          last_name,
          full_name,
          specialization_id,
          doctor_specializations(name)
        )
      `)
      .in("user_id", userIds);

    if (accessError) {
      console.error("Doctor access lookup error:", accessError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch accessible doctors" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Filter and format accessible doctors
    const accessibleDoctors = (doctorAccess || [])
      .filter((item: any) => item.doctors && companyIds.includes(item.doctors.company_id))
      .map((item: any) => {
        const doctor = item.doctors;
        const doctorName = doctor.full_name ||
                          `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() ||
                          'Unknown Doctor';
        const specialization = doctor.doctor_specializations?.name || 'N/A';

        return {
          id: doctor.id,
          name: doctorName,
          specialization: specialization
        };
      });

    return new Response(
      JSON.stringify({
        doctors: accessibleDoctors,
        total: accessibleDoctors.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});