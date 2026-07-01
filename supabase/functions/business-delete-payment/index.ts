import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// business-delete-payment
// -----------------------------------------------------------------------------
// Delete a single invoice payment for the RECEPTIONIST statement screen. A DB
// trigger recomputes the parent invoice's paid_amount / balance_due /
// payment_status after the row is removed.
//
// Authorization: the payment's invoice's doctor must be assigned to this
// receptionist (user_doctor_access).
//
// Request: { user_id, payment_id }
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
    const paymentId: string | null = body.payment_id?.trim() || body.paymentId?.trim() || null;

    if (!userId || !paymentId) {
      return json({ success: false, error: "user_id and payment_id are required" }, 400);
    }

    // Resolve the payment -> invoice -> doctor for authorization.
    const { data: payment, error: payErr } = await supabase
      .from("invoice_payments")
      .select("id, invoice_id, invoice_headers:invoice_id ( doctor_id )")
      .eq("id", paymentId)
      .single();
    if (payErr || !payment) {
      return json({ success: false, error: "Payment not found" }, 404);
    }

    const doctorId = (payment as any).invoice_headers?.doctor_id;
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

    const { error: delErr } = await supabase.from("invoice_payments").delete().eq("id", paymentId);
    if (delErr) {
      console.error("delete payment error:", delErr.message);
      return json({ success: false, error: "Failed to delete payment", details: delErr.message }, 500);
    }

    return json({ success: true });
  } catch (error: any) {
    console.error("Error in business-delete-payment:", error);
    return json({ success: false, error: "Internal server error", details: error?.message || String(error) }, 500);
  }
});
