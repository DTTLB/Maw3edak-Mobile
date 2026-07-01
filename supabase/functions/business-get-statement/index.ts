import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// business-get-statement
// -----------------------------------------------------------------------------
// NEW, dedicated endpoint for the RECEPTIONIST statement screen. Returns a staff
// financial statement across every invoice belonging to the doctors this
// receptionist is assigned to (user_doctor_access), with optional combinable
// filters by doctor AND by patient.
//
// Adapts mobile-get-patient-statement, but scoped to STAFF rather than a single
// patient: it returns a company-scoped summary, per-doctor and per-patient
// breakdowns, and a full invoice list with resolved doctor/patient names and
// line-item names.
//
// Request (POST body or GET query): { user_id, company_id?, doctor_id?, patient_id? }
// Response: { success, summary, by_doctor[], by_patient[], invoices[], doctors[], patients[] }
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
    let companyId: string | null = null;
    let doctorFilter: string | null = null;
    let patientFilter: string | null = null;
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      userId = body.user_id?.trim() || body.userId?.trim() || null;
      companyId = body.company_id?.trim() || body.companyId?.trim() || null;
      doctorFilter = body.doctor_id?.trim() || body.doctorId?.trim() || null;
      patientFilter = body.patient_id?.trim() || body.patientId?.trim() || null;
    } else {
      const url = new URL(req.url);
      userId = url.searchParams.get("user_id");
      companyId = url.searchParams.get("company_id");
      doctorFilter = url.searchParams.get("doctor_id");
      patientFilter = url.searchParams.get("patient_id");
    }

    if (!userId) {
      return json({ success: false, error: "user_id is required" }, 400);
    }

    // ---- Resolve the doctors this receptionist may see ----------------------
    let accessQuery = supabase
      .from("user_doctor_access")
      .select("doctor_id, company_id")
      .eq("user_id", userId);
    if (companyId) accessQuery = accessQuery.eq("company_id", companyId);
    const { data: accessRows, error: accessError } = await accessQuery;
    if (accessError) {
      console.error("user_doctor_access error:", accessError.message);
      return json({ success: false, error: "Failed to resolve access" }, 500);
    }

    let assignedDoctorIds = [...new Set((accessRows || []).map((r: any) => r.doctor_id).filter(Boolean))];
    const allowedCompanyIds = [...new Set((accessRows || []).map((r: any) => r.company_id).filter(Boolean))];

    // Apply the optional doctor filter — but only to doctors the staff can see.
    if (doctorFilter) {
      if (!assignedDoctorIds.includes(doctorFilter)) {
        return json(
          { success: false, error: "Unauthorized access: selected item is not linked to this doctor or user." },
          403
        );
      }
      assignedDoctorIds = [doctorFilter];
    }

    const emptyResponse = {
      success: true,
      summary: { total_charges: 0, total_paid: 0, total_balance: 0, total_invoices: 0 },
      by_doctor: [],
      by_patient: [],
      invoices: [],
      doctors: [],
      patients: [],
    };

    if (assignedDoctorIds.length === 0) {
      return json(emptyResponse);
    }

    // ---- Fetch invoice headers (scoped to those doctors) --------------------
    let invoiceQuery = supabase
      .from("invoice_headers")
      .select(`
        id,
        invoice_number,
        invoice_date,
        status,
        payment_status,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
        paid_amount,
        balance_due,
        doctor_id,
        patient_id,
        company_id,
        doctors:doctor_id ( id, first_name, last_name, full_name ),
        patients:patient_id ( id, first_name, last_name, full_name, medical_id )
      `)
      .in("doctor_id", assignedDoctorIds)
      .order("invoice_date", { ascending: false });

    if (companyId) {
      invoiceQuery = invoiceQuery.eq("company_id", companyId);
    } else if (allowedCompanyIds.length > 0) {
      invoiceQuery = invoiceQuery.in("company_id", allowedCompanyIds);
    }
    if (patientFilter) {
      invoiceQuery = invoiceQuery.eq("patient_id", patientFilter);
    }

    const { data: headers, error: invoicesError } = await invoiceQuery;
    if (invoicesError) {
      console.error("invoice_headers error:", invoicesError.message);
      return json({ success: false, error: "Failed to fetch invoices", details: invoicesError.message }, 500);
    }

    if (!headers || headers.length === 0) {
      return json(emptyResponse);
    }

    // ---- Resolve line-item names for each invoice ---------------------------
    const invoiceIds = headers.map((h: any) => h.id);
    const { data: details } = await supabase
      .from("invoice_details")
      .select(`
        invoice_id,
        item_type,
        description,
        quantity,
        unit_price,
        line_total,
        services:service_id ( name ),
        medical_materials:medical_material_id ( name ),
        packages:package_id ( name )
      `)
      .in("invoice_id", invoiceIds);

    const itemsByInvoice = new Map<string, any[]>();
    for (const d of details || []) {
      const resolvedName =
        d.services?.name || d.medical_materials?.name || d.packages?.name || d.description || "";
      const arr = itemsByInvoice.get(d.invoice_id) || [];
      arr.push({
        item_type: d.item_type,
        name: resolvedName,
        description: d.description || "",
        quantity: num(d.quantity),
        unit_price: num(d.unit_price),
        line_total: num(d.line_total),
      });
      itemsByInvoice.set(d.invoice_id, arr);
    }

    // ---- Resolve payments per invoice ---------------------------------------
    const { data: paymentRows } = await supabase
      .from("invoice_payments")
      .select("id, invoice_id, payment_date, amount, payment_method, reference_number")
      .in("invoice_id", invoiceIds)
      .order("payment_date", { ascending: false });

    const paymentsByInvoice = new Map<string, any[]>();
    for (const p of paymentRows || []) {
      const arr = paymentsByInvoice.get(p.invoice_id) || [];
      arr.push({
        id: p.id,
        payment_date: p.payment_date,
        amount: num(p.amount),
        payment_method: p.payment_method || "",
        reference_number: p.reference_number || "",
      });
      paymentsByInvoice.set(p.invoice_id, arr);
    }

    const doctorName = (d: any) =>
      d?.full_name || `${d?.first_name || ""} ${d?.last_name || ""}`.trim();
    const patientName = (p: any) =>
      p?.full_name || `${p?.first_name || ""} ${p?.last_name || ""}`.trim();

    // ---- Format invoices + accumulate breakdowns ----------------------------
    const byDoctor = new Map<string, { id: string; name: string; charges: number; paid: number; balance: number; count: number }>();
    const byPatient = new Map<string, { id: string; name: string; medical_id: string; charges: number; paid: number; balance: number; count: number }>();
    const doctorOpts = new Map<string, { id: string; name: string }>();
    const patientOpts = new Map<string, { id: string; name: string; medical_id: string }>();

    let totalCharges = 0;
    let totalPaid = 0;

    const invoices = (headers || []).map((h: any) => {
      const charges = num(h.total_amount);
      const paid = num(h.paid_amount);
      const balance = h.balance_due != null ? num(h.balance_due) : charges - paid;
      totalCharges += charges;
      totalPaid += paid;

      const dId = h.doctor_id || "";
      const dName = doctorName(h.doctors) || "—";
      const pId = h.patient_id || "";
      const pName = patientName(h.patients) || "—";
      const pMedical = h.patients?.medical_id || "";

      if (dId) {
        if (!doctorOpts.has(dId)) doctorOpts.set(dId, { id: dId, name: dName });
        const agg = byDoctor.get(dId) || { id: dId, name: dName, charges: 0, paid: 0, balance: 0, count: 0 };
        agg.charges += charges; agg.paid += paid; agg.balance += balance; agg.count += 1;
        byDoctor.set(dId, agg);
      }
      if (pId) {
        if (!patientOpts.has(pId)) patientOpts.set(pId, { id: pId, name: pName, medical_id: pMedical });
        const agg = byPatient.get(pId) || { id: pId, name: pName, medical_id: pMedical, charges: 0, paid: 0, balance: 0, count: 0 };
        agg.charges += charges; agg.paid += paid; agg.balance += balance; agg.count += 1;
        byPatient.set(pId, agg);
      }

      return {
        id: h.id,
        invoice_number: h.invoice_number,
        invoice_date: h.invoice_date,
        status: h.status,
        payment_status: h.payment_status,
        subtotal: num(h.subtotal),
        tax_amount: num(h.tax_amount),
        discount_amount: num(h.discount_amount),
        total_amount: charges,
        paid_amount: paid,
        balance_due: balance,
        doctor_id: dId,
        doctor_name: dName,
        patient_id: pId,
        patient_name: pName,
        patient_medical_id: pMedical,
        items: itemsByInvoice.get(h.id) || [],
        payments: paymentsByInvoice.get(h.id) || [],
      };
    });

    return json({
      success: true,
      summary: {
        total_charges: Math.round((totalCharges + Number.EPSILON) * 100) / 100,
        total_paid: Math.round((totalPaid + Number.EPSILON) * 100) / 100,
        total_balance: Math.round((totalCharges - totalPaid + Number.EPSILON) * 100) / 100,
        total_invoices: invoices.length,
      },
      by_doctor: Array.from(byDoctor.values()),
      by_patient: Array.from(byPatient.values()),
      invoices,
      doctors: Array.from(doctorOpts.values()),
      patients: Array.from(patientOpts.values()),
    });
  } catch (error: any) {
    console.error("Error in business-get-statement:", error);
    return json({ success: false, error: "Internal server error", details: error?.message || String(error) }, 500);
  }
});
