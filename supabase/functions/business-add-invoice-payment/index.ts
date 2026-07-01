import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// business-add-invoice-payment
// -----------------------------------------------------------------------------
// NEW, dedicated endpoint for the RECEPTIONIST invoicing flow. Records a payment
// against an existing invoice. Mirrors the web InvoicesPage add-payment insert.
//
// A DB trigger recomputes the parent invoice's paid_amount / balance_due /
// payment_status, so this function NEVER touches those columns — it only inserts
// the payment row, then returns the refreshed header.
//
// Authorization: the invoice's doctor must be one assigned to this receptionist
// (user_doctor_access).
//
// Request (POST body):
//   { user_id, invoice_id, payment_date, amount, payment_method,
//     reference_number?, notes? }
// Response: { success, header }
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

const VALID_METHODS = ["cash", "card", "bank_transfer", "check", "mobile_payment", "other"];

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
    const paymentDate: string | null = body.payment_date || body.paymentDate || null;
    const amount = Number(body.amount ?? 0);
    const paymentMethod: string = body.payment_method || body.paymentMethod || "";
    const referenceNumber: string | null = body.reference_number || body.referenceNumber || null;
    const notes: string | null = typeof body.notes === "string" ? body.notes : null;

    if (!userId || !invoiceId) {
      return json({ success: false, error: "user_id and invoice_id are required" }, 400);
    }
    if (!paymentDate) {
      return json({ success: false, error: "payment_date is required" }, 400);
    }
    if (!(amount > 0)) {
      return json({ success: false, error: "amount must be greater than 0" }, 400);
    }
    if (!VALID_METHODS.includes(paymentMethod)) {
      return json({ success: false, error: `Invalid payment_method: ${paymentMethod}` }, 400);
    }

    // ---- Load the invoice and authorize via its doctor ----------------------
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

    // ---- Insert the payment (server-owned header columns untouched) ---------
    const { error: paymentErr } = await supabase.from("invoice_payments").insert({
      invoice_id: invoiceId,
      payment_date: paymentDate,
      amount: Math.round((amount + Number.EPSILON) * 100) / 100,
      payment_method: paymentMethod,
      reference_number: referenceNumber,
      notes,
      created_by: userId,
    });

    if (paymentErr) {
      console.error("invoice_payments insert error:", paymentErr.message);
      return json({ success: false, error: "Failed to record payment", details: paymentErr.message }, 500);
    }

    // ---- Return the trigger-refreshed header --------------------------------
    const { data: refreshed, error: refreshErr } = await supabase
      .from("invoice_headers")
      .select(
        "id, invoice_number, invoice_date, total_amount, paid_amount, balance_due, payment_status, status"
      )
      .eq("id", invoiceId)
      .single();

    if (refreshErr || !refreshed) {
      // Payment succeeded; only the re-read failed. Report success without it.
      return json({ success: true, header: null });
    }

    return json({
      success: true,
      header: {
        id: refreshed.id,
        invoice_number: refreshed.invoice_number,
        invoice_date: refreshed.invoice_date,
        total_amount: Number(refreshed.total_amount ?? 0),
        paid_amount: Number(refreshed.paid_amount ?? 0),
        balance_due: Number(refreshed.balance_due ?? 0),
        payment_status: refreshed.payment_status,
        status: refreshed.status,
      },
    });
  } catch (error: any) {
    console.error("Error in business-add-invoice-payment:", error);
    return json({ success: false, error: "Internal server error", details: error?.message || String(error) }, 500);
  }
});
