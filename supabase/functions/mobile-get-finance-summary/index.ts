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
    const companyId = url.searchParams.get("company_id");
    const globalId = url.searchParams.get("global_id");
    const requestedDoctorId = url.searchParams.get("doctor_id");
    const dateFilter = url.searchParams.get("date_filter") || "alltime";

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: "company_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!globalId) {
      return new Response(
        JSON.stringify({ error: "global_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const emptyResponse = () =>
      new Response(
        JSON.stringify({
          summary: {
            totalRevenue: 0,
            totalPaid: 0,
            totalOutstanding: 0,
            totalInvoices: 0,
            paidInvoices: 0,
            unpaidInvoices: 0,
          },
          transactions: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    // Finance is scoped to the doctors the logged-in user is allowed to see:
    // their own record plus any doctors granted via user_doctor_access. The
    // accessible set is derived server-side from the authenticated global_id and
    // is never taken from the client, so the client cannot widen its own scope.
    const { data: userRows, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("is_deleted", false)
      .eq("global_id", globalId)
      .eq("company_id", companyId);

    if (userError) {
      return new Response(
        JSON.stringify({ error: userError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userIds = (userRows || []).map((u: any) => u.id);

    // Doctors explicitly granted to this user (within the current company).
    let grantedDoctorIds: string[] = [];
    if (userIds.length > 0) {
      const { data: accessRows, error: accessError } = await supabase
        .from("user_doctor_access")
        .select("doctor_id, doctors!inner(id, company_id)")
        .in("user_id", userIds)
        .eq("doctors.company_id", companyId);

      if (accessError) {
        return new Response(
          JSON.stringify({ error: accessError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      grantedDoctorIds = (accessRows || []).map((a: any) => a.doctor_id);
    }

    // Always include the user's own doctor record for this company, even if it
    // is not present in user_doctor_access.
    const { data: ownDoctor, error: ownError } = await supabase
      .from("doctors")
      .select("id")
      .eq("is_deleted", false)
      .eq("global_id", globalId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (ownError) {
      return new Response(
        JSON.stringify({ error: ownError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessibleDoctorIds = Array.from(
      new Set([
        ...grantedDoctorIds,
        ...(ownDoctor ? [ownDoctor.id] : []),
      ])
    );

    // Nothing accessible -> nothing to show.
    if (accessibleDoctorIds.length === 0) {
      return emptyResponse();
    }

    // Optional filter to a single doctor, but only if it is within the
    // accessible set. A request for a doctor outside the set returns nothing
    // rather than leaking another doctor's finances.
    let doctorIds = accessibleDoctorIds;
    if (requestedDoctorId) {
      if (!accessibleDoctorIds.includes(requestedDoctorId)) {
        return emptyResponse();
      }
      doctorIds = [requestedDoctorId];
    }

    let dateFrom: string | null = null;
    const now = new Date();

    if (dateFilter === "today") {
      dateFrom = now.toISOString().split("T")[0];
    } else if (dateFilter === "last7days") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      dateFrom = d.toISOString().split("T")[0];
    }

    let query = supabase
      .from("invoice_headers")
      .select(`
        id,
        invoice_number,
        invoice_date,
        doctor_id,
        patient_id,
        total_amount,
        paid_amount,
        balance_due,
        payment_status,
        status,
        created_at,
        patients!inner(full_name, medical_id),
        invoice_payments(amount, payment_date)
      `)
      .eq("company_id", companyId)
      .in("doctor_id", doctorIds);

    if (dateFrom) {
      query = query.gte("invoice_date", dateFrom);
    }

    query = query.order("created_at", { ascending: false });

    const { data: invoices, error } = await query;

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rows = invoices || [];

    let totalRevenue = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    for (const inv of rows) {
      totalRevenue += parseFloat(inv.total_amount || "0");

      const paymentsSum = (inv.invoice_payments || []).reduce(
        (sum: number, p: any) => sum + parseFloat(p.amount || "0"),
        0
      );
      totalCollected += paymentsSum;

      const balanceDue = parseFloat(inv.balance_due || "0");
      if (balanceDue > 0) {
        totalOutstanding += balanceDue;
      }

      if (inv.payment_status === "paid") {
        paidCount++;
      } else {
        unpaidCount++;
      }
    }

    const transactions = rows.map((inv: any) => {
      const actualPaid = (inv.invoice_payments || []).reduce(
        (sum: number, p: any) => sum + parseFloat(p.amount || "0"),
        0
      );
      return {
        id: inv.id,
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        patient_name: inv.patients?.full_name || "Unknown",
        medical_id: inv.patients?.medical_id || "",
        total_amount: parseFloat(inv.total_amount || "0"),
        paid_amount: actualPaid,
        balance_due: parseFloat(inv.balance_due || "0"),
        payment_status: inv.payment_status,
        status: inv.status,
      };
    });

    return new Response(
      JSON.stringify({
        summary: {
          totalRevenue,
          totalPaid: totalCollected,
          totalOutstanding,
          totalInvoices: rows.length,
          paidInvoices: paidCount,
          unpaidInvoices: unpaidCount,
        },
        transactions,
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
