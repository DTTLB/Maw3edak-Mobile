import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// business-update-invoice
// -----------------------------------------------------------------------------
// Edit an existing invoice for the RECEPTIONIST flow: update the header fields
// (date, clinic, tax, discount, status, notes) and REPLACE all line items.
//
// The patient and doctor of an existing invoice are not changed here (payments
// are already tied to it). Server-owned columns (invoice_number, paid_amount,
// balance_due, payment_status) are never written.
//
// Authorization: the invoice's current doctor must be assigned to this
// receptionist (user_doctor_access).
//
// Request (POST):
//   { user_id, invoice_id, invoice_date, clinic_id?, tax_amount?, discount_amount?,
//     status?, notes?, items: [{ item_type, service_id?|medical_material_id?|package_id?,
//     description, quantity, unit_price }] }
// Response: { success, invoice }
// =============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type ItemType = "service" | "material" | "package";
const VALID_ITEM_TYPES: ItemType[] = ["service", "material", "package"];
const VALID_STATUSES = ["draft", "sent", "paid", "cancelled"];
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      return json({ success: false, error: "Server configuration error" }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const userId: string | null = body.user_id?.trim() || body.userId?.trim() || null;
    const invoiceId: string | null = body.invoice_id?.trim() || body.invoiceId?.trim() || null;
    const clinicId: string | null = body.clinic_id?.trim() || body.clinicId?.trim() || null;
    const invoiceDate: string | null = body.invoice_date || body.invoiceDate || null;
    const taxAmount = Number(body.tax_amount ?? body.taxAmount ?? 0) || 0;
    const discountAmount = Number(body.discount_amount ?? body.discountAmount ?? 0) || 0;
    const status: string = body.status && VALID_STATUSES.includes(body.status) ? body.status : "draft";
    const notes: string | null = typeof body.notes === "string" ? body.notes : null;
    const items: any[] = Array.isArray(body.items) ? body.items : [];

    if (!userId || !invoiceId) {
      return json({ success: false, error: "user_id and invoice_id are required" }, 400);
    }
    if (!invoiceDate) {
      return json({ success: false, error: "invoice_date is required" }, 400);
    }
    if (items.length === 0) {
      return json({ success: false, error: "At least one line item is required" }, 400);
    }

    // ---- Load + authorize ----------------------------------------------------
    const { data: header, error: headerErr } = await supabase
      .from("invoice_headers")
      .select("id, doctor_id")
      .eq("id", invoiceId)
      .single();
    if (headerErr || !header) {
      return json({ success: false, error: "Invoice not found" }, 404);
    }

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

    // ---- Validate + normalize the new line items ----------------------------
    const detailRows: any[] = [];
    let subtotal = 0;
    for (const raw of items) {
      const itemType: ItemType = raw.item_type;
      if (!VALID_ITEM_TYPES.includes(itemType)) {
        return json({ success: false, error: `Invalid item_type: ${raw.item_type}` }, 400);
      }
      const quantity = Number(raw.quantity ?? 0);
      const unitPrice = Number(raw.unit_price ?? raw.unitPrice ?? 0);
      if (!(quantity > 0)) {
        return json({ success: false, error: "Each item needs a quantity greater than 0" }, 400);
      }

      const serviceId = itemType === "service" ? raw.service_id || null : null;
      const materialId = itemType === "material" ? raw.medical_material_id || raw.material_id || null : null;
      const packageId = itemType === "package" ? raw.package_id || null : null;

      if (itemType === "service" && !serviceId) return json({ success: false, error: "service_id required for a service item" }, 400);
      if (itemType === "material" && !materialId) return json({ success: false, error: "medical_material_id required for a material item" }, 400);
      if (itemType === "package" && !packageId) return json({ success: false, error: "package_id required for a package item" }, 400);

      const lineTotal = round2(quantity * unitPrice);
      subtotal = round2(subtotal + lineTotal);
      detailRows.push({
        invoice_id: invoiceId,
        item_type: itemType,
        service_id: serviceId,
        medical_material_id: materialId,
        package_id: packageId,
        description: typeof raw.description === "string" ? raw.description : "",
        quantity,
        unit_price: round2(unitPrice),
        line_total: lineTotal,
      });
    }

    const totalAmount = round2(subtotal + taxAmount - discountAmount);

    // ---- Update header ------------------------------------------------------
    const { error: updErr } = await supabase
      .from("invoice_headers")
      .update({
        invoice_date: invoiceDate,
        clinic_id: clinicId,
        subtotal,
        tax_amount: round2(taxAmount),
        discount_amount: round2(discountAmount),
        total_amount: totalAmount,
        status,
        notes,
      })
      .eq("id", invoiceId);
    if (updErr) {
      console.error("update header error:", updErr.message);
      return json({ success: false, error: "Failed to update invoice", details: updErr.message }, 500);
    }

    // ---- Replace details: delete old, insert new ----------------------------
    const { error: delErr } = await supabase.from("invoice_details").delete().eq("invoice_id", invoiceId);
    if (delErr) {
      console.error("delete old details error:", delErr.message);
      return json({ success: false, error: "Failed to update invoice items", details: delErr.message }, 500);
    }
    const { error: insErr } = await supabase.from("invoice_details").insert(detailRows);
    if (insErr) {
      console.error("insert new details error:", insErr.message);
      return json({ success: false, error: "Failed to save invoice items", details: insErr.message }, 500);
    }

    const { data: refreshed } = await supabase
      .from("invoice_headers")
      .select("id, invoice_number, invoice_date, subtotal, tax_amount, discount_amount, total_amount, status")
      .eq("id", invoiceId)
      .single();

    return json({ success: true, invoice: refreshed });
  } catch (error: any) {
    console.error("Error in business-update-invoice:", error);
    return json({ success: false, error: "Internal server error", details: error?.message || String(error) }, 500);
  }
});
