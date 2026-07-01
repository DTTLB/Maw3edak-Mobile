import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { resolveAccessUserIds } from "../_shared/resolve-access.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

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

    if (!globalId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing global_id parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Resolve user_ids from `global_id` (doctor global_id OR receptionist
    // user_id UUID). Doctors may span multiple companies; a receptionist has one.
    const { userIds } = await resolveAccessUserIds(supabase, globalId, null);

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: users } = await supabase
      .from("users")
      .select("company_id")
      .in("id", userIds);

    const companyIds = [...new Set((users || []).map((u: any) => u.company_id))];

    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("id, name, slug")
      .in("id", companyIds);

    if (companiesError) {
      throw new Error("Failed to fetch companies");
    }

    return new Response(
      JSON.stringify({
        success: true,
        clinics: (companies || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        })),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-doctor-clinics:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
