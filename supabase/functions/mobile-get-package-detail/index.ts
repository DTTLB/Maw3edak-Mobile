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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { patientPackageId } = body;

    if (!patientPackageId) {
      return new Response(
        JSON.stringify({ error: "Patient package ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: patientPackage, error: packageError } = await supabase
      .from("patient_packages")
      .select(`
        id,
        buy_date,
        company_id,
        packages (
          id,
          name,
          price
        )
      `)
      .eq("id", patientPackageId)
      .single();

    if (packageError || !patientPackage) {
      return new Response(
        JSON.stringify({ error: "Package not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const pkg = patientPackage.packages;

    const { data: company } = await supabase
      .from("companies")
      .select(`
        name,
        currencies:default_currency_id (
          code,
          symbol
        )
      `)
      .eq("id", patientPackage.company_id)
      .single();

    const currencyData = company?.currencies || { code: "USD", symbol: "$" };

    const { data: packageServices } = await supabase
      .from("package_services")
      .select(`
        sessions_count,
        service_id,
        services (
          id,
          name
        )
      `)
      .eq("package_id", pkg.id);

    const services = await Promise.all(
      (packageServices || []).map(async (ps: any) => {
        const { data: usageData } = await supabase
          .from("package_usage_log")
          .select("used_sessions, usage_date, notes")
          .eq("patient_package_id", patientPackageId)
          .eq("service_id", ps.service_id)
          .order("usage_date", { ascending: false });

        const usedSessions = (usageData || []).reduce(
          (sum: number, item: any) => sum + (item.used_sessions || 0),
          0
        );

        return {
          service_id: ps.services?.id || "",
          service_name: ps.services?.name || "",
          total_sessions: ps.sessions_count,
          used_sessions: usedSessions,
          remaining_sessions: ps.sessions_count - usedSessions,
          usage_history: (usageData || []).map((usage: any) => ({
            usage_date: usage.usage_date,
            used_sessions: usage.used_sessions,
            notes: usage.notes || "",
          })),
        };
      })
    );

    const packageDetail = {
      patient_package_id: patientPackage.id,
      package_name: pkg.name,
      company_name: company?.name || "Unknown",
      buy_date: patientPackage.buy_date,
      price_paid: parseFloat(pkg.price || 0),
      currency: {
        code: currencyData.code,
        symbol: currencyData.symbol,
      },
      payment_status: "paid",
      services: services,
    };

    return new Response(
      JSON.stringify(packageDetail),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});