import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const invoiceId = url.searchParams.get("invoice_id");

    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: "invoice_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoice_headers")
      .select(`
        id,
        invoice_number,
        invoice_date,
        total_amount,
        paid_amount,
        balance_due,
        payment_status,
        status,
        notes,
        created_at,
        patients(full_name, medical_id, phone),
        doctors(full_name)
      `)
      .eq("id", invoiceId)
      .maybeSingle();

    if (invoiceError) {
      return new Response(
        JSON.stringify({ error: invoiceError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!invoice) {
      return new Response(
        JSON.stringify({ error: "Invoice not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: items, error: itemsError } = await supabase
      .from("invoice_details")
      .select("id, description, item_type, quantity, unit_price, line_total, service_id, medical_material_id, package_id")
      .eq("invoice_id", invoiceId)
      .order("created_at", { ascending: true });

    if (itemsError) {
      return new Response(
        JSON.stringify({ error: itemsError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: payments, error: paymentsError } = await supabase
      .from("invoice_payments")
      .select("id, payment_date, amount, payment_method, reference_number, notes")
      .eq("invoice_id", invoiceId)
      .order("payment_date", { ascending: true });

    if (paymentsError) {
      return new Response(
        JSON.stringify({ error: paymentsError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const totalPaid = (payments || []).reduce(
      (sum: number, p: any) => sum + parseFloat(p.amount || "0"),
      0
    );

    return new Response(
      JSON.stringify({
        invoice: {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          invoice_date: invoice.invoice_date,
          total_amount: parseFloat(invoice.total_amount || "0"),
          paid_amount: totalPaid,
          balance_due: parseFloat(invoice.balance_due || "0"),
          payment_status: invoice.payment_status,
          status: invoice.status,
          notes: invoice.notes,
          patient_name: (invoice as any).patients?.full_name || "Unknown",
          patient_medical_id: (invoice as any).patients?.medical_id || "",
          patient_phone: (invoice as any).patients?.phone || "",
          doctor_name: (invoice as any).doctors?.full_name || "",
          doctor_specialization: "",
        },
        items: (items || []).map((item: any) => ({
          id: item.id,
          description: item.description,
          item_type: item.item_type || "service",
          quantity: parseFloat(item.quantity || "1"),
          unit_price: parseFloat(item.unit_price || "0"),
          line_total: parseFloat(item.line_total || "0"),
        })),
        payments: (payments || []).map((p: any) => ({
          id: p.id,
          payment_date: p.payment_date,
          amount: parseFloat(p.amount || "0"),
          payment_method: p.payment_method || "",
          reference_number: p.reference_number || "",
          notes: p.notes || "",
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
