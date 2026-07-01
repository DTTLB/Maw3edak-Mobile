import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// business-get-invoice-detail
// -----------------------------------------------------------------------------
// Full invoice for the RECEPTIONIST edit screen: the header plus every line item
// WITH its id references (service_id / medical_material_id / package_id) so the
// edit form can re-save honoring the invoice_details CHECK constraint.
//
// Authorization: the invoice's doctor must be assigned to this receptionist
// (user_doctor_access).
//
// Request: { user_id, invoice_id }
// Response: { success, invoice }
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

const num = (v: unknown) => Number(v ?? 0) || 0;

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
    let invoiceId: string | null = null;
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      userId = body.user_id?.trim() || body.userId?.trim() || null;
      invoiceId = body.invoice_id?.trim() || body.invoiceId?.trim() || null;
    } else {
      const url = new URL(req.url);
      userId = url.searchParams.get("user_id");
      invoiceId = url.searchParams.get("invoice_id");
    }

    if (!userId || !invoiceId) {
      return json({ success: false, error: "user_id and invoice_id are required" }, 400);
    }

    const { data: header, error: headerErr } = await supabase
      .from("invoice_headers")
      .select(`
        id, invoice_number, invoice_date, status, payment_status, notes,
        subtotal, tax_amount, discount_amount, total_amount, paid_amount, balance_due,
        doctor_id, clinic_id, patient_id,
        doctors:doctor_id ( first_name, last_name, full_name ),
        patients:patient_id ( first_name, last_name, full_name, medical_id )
      `)
      .eq("id", invoiceId)
      .single();
    if (headerErr || !header) {
      return json({ success: false, error: "Invoice not found" }, 404);
    }

    // Authorize via the invoice's doctor.
    const { data: uda } = await supabase
      .from("user_doctor_access")
      .select("doctor_id")
      .eq("user_id", userId)
      .eq("doctor_id", header.doctor_id)
      .limit(1);
    if (!uda || uda.length === 0) {
      return json(
        { success: false, error: "Unauthorized access: selected item is not linked to this doctor or user." },
        403
      );
    }

    const { data: details } = await supabase
      .from("invoice_details")
      .select(`
        id, item_type, service_id, medical_material_id, package_id,
        description, quantity, unit_price, line_total,
        services:service_id ( name ),
        medical_materials:medical_material_id ( name ),
        packages:package_id ( name )
      `)
      .eq("invoice_id", invoiceId);

    const items = (details || []).map((d: any) => ({
      id: d.id,
      item_type: d.item_type,
      service_id: d.service_id,
      medical_material_id: d.medical_material_id,
      package_id: d.package_id,
      name: d.services?.name || d.medical_materials?.name || d.packages?.name || d.description || "",
      description: d.description || "",
      quantity: num(d.quantity),
      unit_price: num(d.unit_price),
      line_total: num(d.line_total),
    }));

    const dName = header.doctors?.full_name ||
      `${header.doctors?.first_name || ""} ${header.doctors?.last_name || ""}`.trim();
    const pName = header.patients?.full_name ||
      `${header.patients?.first_name || ""} ${header.patients?.last_name || ""}`.trim();

    return json({
      success: true,
      invoice: {
        id: header.id,
        invoice_number: header.invoice_number,
        invoice_date: header.invoice_date,
        status: header.status,
        payment_status: header.payment_status,
        notes: header.notes || "",
        subtotal: num(header.subtotal),
        tax_amount: num(header.tax_amount),
        discount_amount: num(header.discount_amount),
        total_amount: num(header.total_amount),
        paid_amount: num(header.paid_amount),
        balance_due: num(header.balance_due),
        doctor_id: header.doctor_id,
        doctor_name: dName,
        clinic_id: header.clinic_id,
        patient_id: header.patient_id,
        patient_name: pName,
        patient_medical_id: header.patients?.medical_id || "",
        items,
      },
    });
  } catch (error: any) {
    console.error("Error in business-get-invoice-detail:", error);
    return json({ success: false, error: "Internal server error", details: error?.message || String(error) }, 500);
  }
});
