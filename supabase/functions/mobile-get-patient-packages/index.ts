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
    const { medicalId, type } = body;

    if (!medicalId) {
      return new Response(
        JSON.stringify({ error: "Medical ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: patientRecords, error: patientError } = await supabase
      .from("patients")
      .select("id, company_id")
      .eq("is_deleted", false)
      .eq("medical_id", medicalId);

    if (patientError || !patientRecords || patientRecords.length === 0) {
      return new Response(
        JSON.stringify({ error: "Patient not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const patientIds = patientRecords.map(p => p.id);
    const companyIds = patientRecords.map(p => p.company_id);

    if (type === "available") {
      const { data: packages, error: packagesError } = await supabase
        .from("packages")
        .select(`
          id,
          name,
          price,
          company_id,
          companies (
            default_currency_id,
            currencies:default_currency_id (
              code,
              symbol
            )
          )
        `)
        .in("company_id", companyIds)
        .eq("is_active", true);

      if (packagesError) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch packages", details: packagesError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const availablePackages = await Promise.all(
        (packages || []).map(async (pkg: any) => {
          const { data: services } = await supabase
            .from("package_services")
            .select(`
              sessions_count,
              services (
                id,
                name
              )
            `)
            .eq("package_id", pkg.id);

          const currency = pkg.companies?.currencies || { code: "USD", symbol: "$" };

          return {
            package_id: pkg.id,
            package_name: pkg.name,
            description: "",
            price: parseFloat(pkg.price || 0),
            currency: {
              code: currency.code,
              symbol: currency.symbol,
            },
            services: (services || []).map((s: any) => ({
              service_name: s.services?.name || "",
              no_of_sessions: s.sessions_count,
            })),
          };
        })
      );

      return new Response(
        JSON.stringify(availablePackages),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      const { data: patientPackages, error: packagesError } = await supabase
        .from("patient_packages")
        .select(`
          id,
          buy_date,
          packages (
            id,
            name,
            price,
            company_id
          )
        `)
        .in("patient_id", patientIds)
        .order("buy_date", { ascending: false });

      if (packagesError) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch packages", details: packagesError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const purchasedPackages = await Promise.all(
        (patientPackages || []).map(async (pp: any) => {
          const pkg = pp.packages;

          const { data: company } = await supabase
            .from("companies")
            .select(`
              name,
              currencies:default_currency_id (
                code,
                symbol
              )
            `)
            .eq("id", pkg.company_id)
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
                .select("used_sessions")
                .eq("patient_package_id", pp.id)
                .eq("service_id", ps.service_id);

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
              };
            })
          );

          return {
            patient_package_id: pp.id,
            package_name: pkg.name,
            company_name: company?.name || "Unknown",
            services: services,
            buy_date: pp.buy_date,
            price_paid: parseFloat(pkg.price || 0),
            currency: {
              code: currencyData.code,
              symbol: currencyData.symbol,
            },
            payment_status: "paid",
          };
        })
      );

      return new Response(
        JSON.stringify(purchasedPackages),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
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