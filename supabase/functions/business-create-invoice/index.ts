import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// business-create-invoice
// -----------------------------------------------------------------------------
// NEW, dedicated endpoint for the RECEPTIONIST invoicing flow. Replicates the
// web InvoicesPage save logic: build an invoice header + its line-item details
// in one call.
//
// Authorization mirrors the booking endpoints — the chosen doctor must be one
// assigned to this receptionist (user_doctor_access) and the patient must be
// linked to that doctor (patient_doctor_access). The invoice's company_id is
// resolved server-side from the patient record (authoritative), never trusted
// from the client.
//
// SERVER-OWNED, never set here: invoice_number (auto-generated), paid_amount,
// balance_due, payment_status (all recomputed by DB triggers).
//
// Request (POST body):
//   { user_id, patient_id, doctor_id, clinic_id?, invoice_date,
//     tax_amount?, discount_amount?, status?, notes?,
//     items: [{ item_type:'service'|'material'|'package',
//               service_id?|medical_material_id?|package_id?,
//               description, quantity, unit_price }] }
// Response: { success, invoice, invoice_number }
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
    const patientId: string | null = body.patient_id?.trim() || body.patientId?.trim() || null;
    const doctorId: string | null = body.doctor_id?.trim() || body.doctorId?.trim() || null;
    const clinicId: string | null = body.clinic_id?.trim() || body.clinicId?.trim() || null;
    const invoiceDate: string | null = body.invoice_date || body.invoiceDate || null;
    const taxAmount = Number(body.tax_amount ?? body.taxAmount ?? 0) || 0;
    const discountAmount = Number(body.discount_amount ?? body.discountAmount ?? 0) || 0;
    const status: string = body.status && VALID_STATUSES.includes(body.status) ? body.status : "draft";
    const notes: string | null = typeof body.notes === "string" ? body.notes : null;
    const items: any[] = Array.isArray(body.items) ? body.items : [];

    if (!userId || !patientId || !doctorId) {
      return json({ success: false, error: "user_id, patient_id and doctor_id are required" }, 400);
    }
    if (!invoiceDate) {
      return json({ success: false, error: "invoice_date is required" }, 400);
    }
    if (items.length === 0) {
      return json({ success: false, error: "At least one line item is required" }, 400);
    }

    // ---- Authorize: doctor assigned to this receptionist ---------------------
    const { data: uda } = await supabase
      .from("user_doctor_access")
      .select("doctor_id")
      .eq("user_id", userId)
      .eq("doctor_id", doctorId)
      .limit(1);
    if (!uda || uda.length === 0) {
      return json(
        { success: false, error: "Unauthorized access: selected item is not linked to this doctor or user." },
        403
      );
    }

    // ---- Authorize: patient linked to that doctor ---------------------------
    const { data: pda } = await supabase
      .from("patient_doctor_access")
      .select("doctor_id")
      .eq("patient_id", patientId)
      .eq("doctor_id", doctorId)
      .limit(1);
    if (!pda || pda.length === 0) {
      return json(
        { success: false, error: "Unauthorized access: selected item is not linked to this doctor or user." },
        403
      );
    }

    // ---- Resolve the patient's company (authoritative) ----------------------
    const { data: patientRow, error: patientErr } = await supabase
      .from("patients")
      .select("id, company_id")
      .eq("id", patientId)
      .eq("is_deleted", false)
      .single();
    if (patientErr || !patientRow) {
      return json({ success: false, error: "Patient not found" }, 404);
    }
    const companyId = patientRow.company_id;

    // ---- Validate + normalize line items ------------------------------------
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

      // Honor the CHECK constraint: exactly the id column matching item_type is
      // set; the other two are NULL.
      const serviceId = itemType === "service" ? raw.service_id || null : null;
      const materialId = itemType === "material" ? raw.medical_material_id || raw.material_id || null : null;
      const packageId = itemType === "package" ? raw.package_id || null : null;

      if (itemType === "service" && !serviceId) {
        return json({ success: false, error: "service_id required for a service item" }, 400);
      }
      if (itemType === "material" && !materialId) {
        return json({ success: false, error: "medical_material_id required for a material item" }, 400);
      }
      if (itemType === "package" && !packageId) {
        return json({ success: false, error: "package_id required for a package item" }, 400);
      }

      const lineTotal = round2(quantity * unitPrice);
      subtotal = round2(subtotal + lineTotal);

      detailRows.push({
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

    // ---- Insert the header (no server-owned columns) ------------------------
    const { data: header, error: headerErr } = await supabase
      .from("invoice_headers")
      .insert({
        invoice_date: invoiceDate,
        company_id: companyId,
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
        subtotal,
        tax_amount: round2(taxAmount),
        discount_amount: round2(discountAmount),
        total_amount: totalAmount,
        status,
        notes,
        created_by: userId,
      })
      .select("id, invoice_number, invoice_date, total_amount, subtotal, tax_amount, discount_amount, status")
      .single();

    if (headerErr || !header) {
      console.error("invoice_headers insert error:", headerErr?.message);
      return json({ success: false, error: "Failed to create invoice", details: headerErr?.message }, 500);
    }

    // ---- Insert the details; roll back the header on failure ----------------
    const detailsPayload = detailRows.map((d) => ({ ...d, invoice_id: header.id }));
    const { error: detailsErr } = await supabase.from("invoice_details").insert(detailsPayload);

    if (detailsErr) {
      console.error("invoice_details insert error:", detailsErr.message);
      // Delete the orphan header so no header survives without its line items.
      await supabase.from("invoice_headers").delete().eq("id", header.id);
      return json({ success: false, error: "Failed to create invoice items", details: detailsErr.message }, 500);
    }

    return json({
      success: true,
      invoice_number: header.invoice_number,
      invoice: {
        id: header.id,
        invoice_number: header.invoice_number,
        invoice_date: header.invoice_date,
        subtotal: header.subtotal,
        tax_amount: header.tax_amount,
        discount_amount: header.discount_amount,
        total_amount: header.total_amount,
        status: header.status,
      },
    });
  } catch (error: any) {
    console.error("Error in business-create-invoice:", error);
    return json({ success: false, error: "Internal server error", details: error?.message || String(error) }, 500);
  }
});
