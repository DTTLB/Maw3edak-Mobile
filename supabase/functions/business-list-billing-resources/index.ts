import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// business-list-billing-resources
// -----------------------------------------------------------------------------
// NEW, dedicated endpoint for the RECEPTIONIST invoicing flow. Returns the
// billable items a receptionist can put on an invoice — services, medical
// materials ("medications"/consumables) and packages.
//
// When a doctor_id is supplied, the lists are scoped to THAT doctor's assigned
// items via the doctor_service_access / doctor_material_access /
// doctor_package_access junctions (queried by doctor_id only — these tables are
// doctor-scoped and a company filter would wrongly return nothing). This mirrors
// business-get-booking-options. Without a doctor_id, it falls back to every
// ACTIVE item in the staff member's company.
//
// Request (POST body or GET query): { user_id, doctor_id?, company_id? }
// Response: { success, services:[{id,name,price}],
//             materials:[{id,name,price,unit}], packages:[{id,name,price}] }
// =============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      return json({ success: false, error: "Server configuration error" }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    let userId: string | null = null;
    let companyId: string | null = null;
    let doctorId: string | null = null;
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      userId = body.user_id?.trim() || body.userId?.trim() || null;
      companyId = body.company_id?.trim() || body.companyId?.trim() || null;
      doctorId = body.doctor_id?.trim() || body.doctorId?.trim() || null;
    } else {
      const url = new URL(req.url);
      userId = url.searchParams.get("user_id");
      companyId = url.searchParams.get("company_id");
      doctorId = url.searchParams.get("doctor_id");
    }

    if (!userId) {
      return json({ success: false, error: "user_id is required" }, 400);
    }

    // Authorize: the caller must be staff. Resolve the set of companies whose
    // billing resources they may see — from their assigned-doctor rows, falling
    // back to their own user record when those rows carry no company_id.
    const { data: accessRows, error: accessError } = await supabase
      .from("user_doctor_access")
      .select("company_id")
      .eq("user_id", userId);
    if (accessError) {
      console.error("user_doctor_access error:", accessError.message);
      return json({ success: false, error: "Failed to resolve access" }, 500);
    }

    const allowedCompanyIds = new Set<string>(
      (accessRows || []).map((r: any) => r.company_id).filter(Boolean)
    );

    // Fallback: derive the staff member's own company from the users table.
    if (allowedCompanyIds.size === 0) {
      const { data: userRow } = await supabase
        .from("users")
        .select("company_id")
        .eq("id", userId)
        .maybeSingle();
      if (userRow?.company_id) allowedCompanyIds.add(userRow.company_id);
    }

    // The requested company (from the session) is authoritative when present —
    // honor it even if it isn't reflected in the access rows above.
    if (companyId) allowedCompanyIds.add(companyId);

    if (allowedCompanyIds.size === 0) {
      return json({ success: false, error: "Unauthorized: no company resolved for this user" }, 403);
    }

    // Scope to the requested company when supplied, else every company the staff
    // can reach.
    const companyIds = companyId ? [companyId] : [...allowedCompanyIds];

    // ---- Doctor-scoped path -------------------------------------------------
    // When a doctor is chosen, return ONLY the items that doctor is assigned to
    // (doctor_*_access). These junctions are doctor-scoped, so they are queried
    // by doctor_id alone (a company filter would wrongly exclude valid rows).
    if (doctorId) {
      // The doctor must be one this receptionist can act for.
      const { data: udaDoc } = await supabase
        .from("user_doctor_access")
        .select("doctor_id")
        .eq("user_id", userId)
        .eq("doctor_id", doctorId)
        .limit(1);
      if (!udaDoc || udaDoc.length === 0) {
        return json(
          { success: false, error: "Unauthorized access: selected item is not linked to this doctor or user." },
          403
        );
      }

      const [svcAcc, matAcc, pkgAcc] = await Promise.all([
        supabase.from("doctor_service_access").select("service_id").eq("doctor_id", doctorId),
        supabase.from("doctor_material_access").select("material_id").eq("doctor_id", doctorId),
        supabase.from("doctor_package_access").select("package_id").eq("doctor_id", doctorId),
      ]);

      const serviceIds = [...new Set((svcAcc.data || []).map((r: any) => r.service_id).filter(Boolean))];
      const materialIds = [...new Set((matAcc.data || []).map((r: any) => r.material_id).filter(Boolean))];
      const packageIds = [...new Set((pkgAcc.data || []).map((r: any) => r.package_id).filter(Boolean))];

      const [svcRows, matRows, pkgRows] = await Promise.all([
        serviceIds.length
          ? supabase.from("services").select("id, name, price, is_active").in("id", serviceIds)
          : Promise.resolve({ data: [] as any[] }),
        materialIds.length
          ? supabase.from("medical_materials").select("id, name, price, unit, is_active").in("id", materialIds)
          : Promise.resolve({ data: [] as any[] }),
        packageIds.length
          ? supabase.from("packages").select("id, name, price, is_active").in("id", packageIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      // Only ACTIVE items are billable — an inactive item is hidden even when
      // the doctor is still assigned to it. (is_active may be NULL on legacy
      // rows; only an explicit `false` hides a row.)
      const services = (svcRows.data || [])
        .filter((s: any) => s.is_active !== false)
        .map((s: any) => ({ id: s.id, name: s.name, price: Number(s.price ?? 0) }))
        .sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
      const materials = (matRows.data || [])
        .filter((m: any) => m.is_active !== false)
        .map((m: any) => ({ id: m.id, name: m.name, price: Number(m.price ?? 0), unit: m.unit || "" }))
        .sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
      const packages = (pkgRows.data || [])
        .filter((p: any) => p.is_active !== false)
        .map((p: any) => ({ id: p.id, name: p.name, price: Number(p.price ?? 0) }))
        .sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));

      return json({ success: true, services, materials, packages });
    }

    // ---- Company-wide fallback (no doctor chosen) ---------------------------
    const [servicesRes, materialsRes, packagesRes] = await Promise.all([
      supabase
        .from("services")
        .select("id, name, price, is_active")
        .in("company_id", companyIds)
        .order("name", { ascending: true }),
      supabase
        .from("medical_materials")
        .select("id, name, price, unit, is_active")
        .in("company_id", companyIds)
        .order("name", { ascending: true }),
      supabase
        .from("packages")
        .select("id, name, price, is_active")
        .in("company_id", companyIds)
        .order("name", { ascending: true }),
    ]);

    if (servicesRes.error) {
      console.error("services error:", servicesRes.error.message);
      return json({ success: false, error: "Failed to fetch services", details: servicesRes.error.message }, 500);
    }
    if (materialsRes.error) {
      console.error("materials error:", materialsRes.error.message);
      return json({ success: false, error: "Failed to fetch materials", details: materialsRes.error.message }, 500);
    }
    if (packagesRes.error) {
      console.error("packages error:", packagesRes.error.message);
      return json({ success: false, error: "Failed to fetch packages", details: packagesRes.error.message }, 500);
    }

    // `is_active` may be NULL on legacy rows — treat NULL as active (only an
    // explicit `false` hides a row), mirroring business-get-booking-options.
    const services = (servicesRes.data || [])
      .filter((s: any) => s.is_active !== false)
      .map((s: any) => ({ id: s.id, name: s.name, price: Number(s.price ?? 0) }));
    const materials = (materialsRes.data || [])
      .filter((m: any) => m.is_active !== false)
      .map((m: any) => ({ id: m.id, name: m.name, price: Number(m.price ?? 0), unit: m.unit || "" }));
    const packages = (packagesRes.data || [])
      .filter((p: any) => p.is_active !== false)
      .map((p: any) => ({ id: p.id, name: p.name, price: Number(p.price ?? 0) }));

    return json({ success: true, services, materials, packages });
  } catch (error: any) {
    console.error("Error in business-list-billing-resources:", error);
    return json({ success: false, error: "Internal server error", details: error?.message || String(error) }, 500);
  }
});
