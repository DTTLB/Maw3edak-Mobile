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
    const { medicalId, invoice_id } = body;

    if (!medicalId) {
      return new Response(
        JSON.stringify({ error: "Medical ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Fetching invoices for medical_id:", medicalId);

    // Get ALL patient records across ALL companies using medical_id
    const { data: patientRecords, error: patientError } = await supabase
      .from("patients")
      .select("id, company_id")
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

    // If invoice_id is provided, return specific invoice details
    if (invoice_id) {
      console.log("Fetching invoice details for invoice_id:", invoice_id);
      console.log("Patient IDs:", patientIds);

      const { data: invoice, error: invoiceError } = await supabase
        .from("invoice_headers")
        .select(`
          id,
          invoice_number,
          invoice_date,
          due_date,
          status,
          subtotal,
          tax_amount,
          discount_amount,
          total_amount,
          paid_amount,
          notes,
          doctor_id,
          doctors:doctor_id (
            id,
            first_name,
            last_name,
            full_name
          ),
          companies (
            name,
            address,
            mobile,
            email
          )
        `)
        .eq("id", invoice_id)
        .in("patient_id", patientIds)
        .maybeSingle();

      if (invoiceError) {
        console.error("Invoice query error:", invoiceError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch invoice", details: invoiceError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!invoice) {
        console.log("Invoice not found for invoice_id:", invoice_id);
        return new Response(
          JSON.stringify({ error: "Invoice not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get invoice items
      const { data: items, error: itemsError } = await supabase
        .from("invoice_details")
        .select(`
          id,
          description,
          quantity,
          unit_price,
          line_total,
          service_id,
          item_type,
          services:service_id (
            name,
            description
          )
        `)
        .eq("invoice_id", invoice_id)
        .order("created_at", { ascending: true });

      if (itemsError) {
        console.error("Error fetching invoice items:", itemsError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch invoice items", details: itemsError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get invoice payments
      const { data: payments, error: paymentsError } = await supabase
        .from("invoice_payments")
        .select(`
          id,
          payment_date,
          amount,
          payment_method,
          notes
        `)
        .eq("invoice_id", invoice_id)
        .order("payment_date", { ascending: true });

      if (paymentsError) {
        console.error("Error fetching payments:", paymentsError);
      }

      // Format invoice items
      const formattedItems = (items || []).map(item => ({
        id: item.id,
        item_type: item.item_type || 'service',
        service_name: item.services?.name || item.description || '',
        description: item.description || item.services?.description || '',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total_price: item.line_total || 0,
        notes: '',
      }));

      // Format payments
      const formattedPayments = (payments || []).map(payment => ({
        id: payment.id,
        payment_date: payment.payment_date,
        amount: payment.amount || 0,
        payment_method: payment.payment_method || 'Cash',
        notes: payment.notes || '',
      }));

      return new Response(
        JSON.stringify({
          success: true,
          invoice: {
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            invoice_date: invoice.invoice_date,
            due_date: invoice.due_date,
            status: invoice.status,
            subtotal: invoice.subtotal || 0,
            tax_amount: invoice.tax_amount || 0,
            discount_amount: invoice.discount_amount || 0,
            total_amount: invoice.total_amount || 0,
            paid_amount: invoice.paid_amount || 0,
            balance: (invoice.total_amount || 0) - (invoice.paid_amount || 0),
            notes: invoice.notes || '',
            doctor: {
              id: invoice.doctors?.id || '',
              name: invoice.doctors?.full_name || `${invoice.doctors?.first_name || ''} ${invoice.doctors?.last_name || ''}`.trim(),
            },
            clinic: {
              id: '',
              name: invoice.companies?.name || '',
            },
            company: {
              name: invoice.companies?.name || '',
              address: invoice.companies?.address || '',
              phone: invoice.companies?.mobile || '',
              email: invoice.companies?.email || '',
            },
          },
          items: formattedItems,
          payments: formattedPayments,
          total_items: formattedItems.length,
          total_payments: formattedPayments.length,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Otherwise, return list of invoices
    const { data: invoices, error: invoicesError } = await supabase
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
        clinic_id,
        doctors:doctor_id (
          id,
          first_name,
          last_name,
          full_name
        ),
        clinics:clinic_id (
          id,
          name
        )
      `)
      .in("patient_id", patientIds)
      .order("invoice_date", { ascending: false });

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

    // Format invoices
    const formattedInvoices = (invoices || []).map(invoice => ({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      status: invoice.status,
      total_amount: invoice.total_amount || 0,
      paid_amount: invoice.paid_amount || 0,
      balance: (invoice.total_amount || 0) - (invoice.paid_amount || 0),
      doctor: {
        id: invoice.doctors?.id || '',
        name: invoice.doctors?.full_name || `${invoice.doctors?.first_name || ''} ${invoice.doctors?.last_name || ''}`.trim(),
      },
      clinic: {
        id: invoice.clinics?.id || '',
        name: invoice.clinics?.name || '',
      },
    }));

    // Get unique doctors from invoices
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

    // Calculate summary
    const summary = {
      total_charges: formattedInvoices.reduce((sum, inv) => sum + inv.total_amount, 0),
      total_paid: formattedInvoices.reduce((sum, inv) => sum + inv.paid_amount, 0),
      total_balance: formattedInvoices.reduce((sum, inv) => sum + inv.balance, 0),
    };

    return new Response(
      JSON.stringify({
        success: true,
        invoices: formattedInvoices,
        summary: summary,
        doctors: doctors,
        total_invoices: formattedInvoices.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-patient-invoices:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});