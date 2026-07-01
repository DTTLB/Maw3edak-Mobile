import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// business-delete-invoice
// -----------------------------------------------------------------------------
// Delete an invoice and all of its line items and payments, for the
// RECEPTIONIST statement screen. Authorization: the invoice's doctor must be
// assigned to this receptionist (user_doctor_access).
//
// Children are removed explicitly (payments + details) before the header, so the
// operation does not rely on ON DELETE CASCADE being configured.
//
// Request: { user_id, invoice_id }
// Response: { success }
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

    if (!userId || !invoiceId) {
      return json({ success: false, error: "user_id and invoice_id are required" }, 400);
    }

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

    // Remove children first, then the header.
    const { error: payErr } = await supabase.from("invoice_payments").delete().eq("invoice_id", invoiceId);
    if (payErr) {
      console.error("delete payments error:", payErr.message);
      return json({ success: false, error: "Failed to delete invoice payments", details: payErr.message }, 500);
    }
    const { error: detErr } = await supabase.from("invoice_details").delete().eq("invoice_id", invoiceId);
    if (detErr) {
      console.error("delete details error:", detErr.message);
      return json({ success: false, error: "Failed to delete invoice items", details: detErr.message }, 500);
    }
    const { error: hdrErr } = await supabase.from("invoice_headers").delete().eq("id", invoiceId);
    if (hdrErr) {
      console.error("delete header error:", hdrErr.message);
      return json({ success: false, error: "Failed to delete invoice", details: hdrErr.message }, 500);
    }

    return json({ success: true });
  } catch (error: any) {
    console.error("Error in business-delete-invoice:", error);
    return json({ success: false, error: "Internal server error", details: error?.message || String(error) }, 500);
  }
});
