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
    const { medicalId, doctor_id } = body;

    if (!medicalId) {
      return new Response(
        JSON.stringify({ error: "Medical ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Fetching statement for medical_id:", medicalId, "doctor_id:", doctor_id);

    // Get ALL patient records across ALL companies using medical_id
    const { data: patientRecords, error: patientError } = await supabase
      .from("patients")
      .select("id, company_id, first_name, last_name")
      .eq("is_deleted", false)
      .eq("medical_id", medicalId);

    if (patientError) {
      console.error("Patient lookup error:", patientError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch patient records", details: patientError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!patientRecords || patientRecords.length === 0) {
      console.log("No patient records found for medical_id:", medicalId);
      return new Response(
        JSON.stringify({ error: "Patient not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${patientRecords.length} patient records across companies`);

    // Get all patient IDs
    const patientIds = patientRecords.map(p => p.id);

    // Build invoice query
    let invoiceQuery = supabase
      .from("invoice_headers")
      .select(`
        id,
        invoice_number,
        invoice_date,
        due_date,
        status,
        total_amount,
        paid_amount,
        doctor_id,
        doctors:doctor_id (
          id,
          first_name,
          last_name,
          full_name
        )
      `)
      .in("patient_id", patientIds)
      .order("invoice_date", { ascending: false });

    // Filter by doctor if provided
    if (doctor_id) {
      invoiceQuery = invoiceQuery.eq("doctor_id", doctor_id);
    }

    const { data: invoices, error: invoicesError } = await invoiceQuery;

    if (invoicesError) {
      console.error("Error fetching invoices:", invoicesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch invoices", details: invoicesError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${invoices?.length || 0} invoices`);

    // Get all invoice IDs for the patients
    const invoiceIds = (invoices || []).map(inv => inv.id);

    // Only query payments when the patient actually has invoices. Querying
    // with a placeholder id (e.g. "no-match") against the uuid invoice_id
    // column throws a DB error, which surfaced as a misleading
    // "Failed to fetch payments" instead of the empty/no-records state.
    let payments: any[] = [];
    if (invoiceIds.length > 0) {
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("invoice_payments")
        .select(`
          id,
          payment_date,
          amount,
          payment_method,
          reference_number,
          notes,
          invoice_id,
          invoice_headers:invoice_id (
            invoice_number,
            doctor_id
          )
        `)
        .in("invoice_id", invoiceIds)
        .order("payment_date", { ascending: false });

      if (paymentsError) {
        console.error("Error fetching payments:", paymentsError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch payments", details: paymentsError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      payments = paymentsData || [];
    }

    console.log(`Found ${payments?.length || 0} payments`);

    // Format invoices
    const formattedInvoices = (invoices || []).map(invoice => ({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      date: invoice.invoice_date,
      due_date: invoice.due_date,
      status: invoice.status,
      total_amount: invoice.total_amount || 0,
      paid_amount: invoice.paid_amount || 0,
      balance: (invoice.total_amount || 0) - (invoice.paid_amount || 0),
      doctor: {
        id: invoice.doctors?.id || '',
        name: invoice.doctors?.full_name || `${invoice.doctors?.first_name || ''} ${invoice.doctors?.last_name || ''}`.trim(),
      },
    }));

    // Format payments
    const formattedPayments = (payments || []).map(payment => ({
      id: payment.id,
      date: payment.payment_date,
      amount: payment.amount || 0,
      payment_method: payment.payment_method || '',
      reference_number: payment.reference_number || '',
      notes: payment.notes || '',
      invoice_number: payment.invoice_headers?.invoice_number || '',
    }));

    // Calculate totals
    const totalCharges = formattedInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const totalPayments = formattedPayments.reduce((sum, pay) => sum + pay.amount, 0);
    const totalBalance = totalCharges - totalPayments;

    // Get unique doctors for filter
    const uniqueDoctorsMap = new Map();
    formattedInvoices.forEach(invoice => {
      if (invoice.doctor.id && !uniqueDoctorsMap.has(invoice.doctor.id)) {
        uniqueDoctorsMap.set(invoice.doctor.id, {
          id: invoice.doctor.id,
          name: invoice.doctor.name,
        });
      }
    });
    const doctors = Array.from(uniqueDoctorsMap.values());

    // Patient info
    const patientInfo = {
      medical_id: medicalId,
      name: `${patientRecords[0].first_name || ''} ${patientRecords[0].last_name || ''}`.trim(),
    };

    return new Response(
      JSON.stringify({
        success: true,
        patient: patientInfo,
        summary: {
          total_charges: totalCharges,
          total_paid: totalPayments,
          total_balance: totalBalance,
          total_invoices: formattedInvoices.length,
        },
        invoices: formattedInvoices,
        payments: formattedPayments,
        doctors: doctors,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-patient-statement:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
