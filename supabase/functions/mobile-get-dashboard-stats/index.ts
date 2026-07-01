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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const medicalId = authHeader.replace("Bearer ", "").trim();
    console.log("Medical ID received:", medicalId);

    if (!medicalId || !medicalId.startsWith("MED-")) {
      return new Response(
        JSON.stringify({ error: "Invalid medical ID format" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: patientData } = await supabase
      .from("user_patients")
      .select("id, medical_id")
      .eq("is_deleted", false)
      .eq("medical_id", medicalId)
      .maybeSingle();

    console.log("Patient lookup:", { found: !!patientData, medical_id: patientData?.medical_id });

    if (!patientData) {
      return new Response(
        JSON.stringify({ error: "Patient not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Using medical_id:", medicalId);

    // Get next appointment from appointments table using medical_id
    console.log("Fetching appointments for medical_id:", medicalId);
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        doctors:doctor_id (
          first_name,
          last_name
        ),
        patients:patient_id!inner (
          medical_id
        )
      `)
      .eq("patients.medical_id", medicalId)
      .gte("appointment_date", new Date().toISOString().split("T")[0])
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true })
      .limit(1);

    console.log("Appointments query result:", {
      found: appointments?.length || 0,
      error: appointmentsError?.message
    });

    let nextAppointment = null;
    if (appointments && appointments.length > 0) {
      const apt = appointments[0];
      nextAppointment = {
        date: apt.appointment_date,
        time: apt.appointment_time,
        doctor: apt.doctors
          ? {
              name: `Dr. ${apt.doctors.first_name} ${apt.doctors.last_name}`,
              image: null,
            }
          : null,
      };
      console.log("Next appointment:", nextAppointment);
    } else {
      console.log("No upcoming appointments found");
    }

    // Get patient IDs from all patient records with this medical_id (for cross-company support)
    console.log("Fetching all patient records for medical_id:", medicalId);
    const { data: allPatientRecords, error: patientsError } = await supabase
      .from("patients")
      .select("id")
      .eq("is_deleted", false)
      .eq("medical_id", medicalId);

    const patientIds = allPatientRecords?.map(p => p.id) || [];
    console.log("Found patient_ids:", patientIds, "error:", patientsError?.message);

    // Get the last active nutrition plan from nutrition_documents using medical_id
    let lastActivePlan = null;
    if (patientIds.length > 0) {
      console.log("Fetching nutrition docs for patient_ids:", patientIds);
      const { data: nutritionDocs, error: nutritionError } = await supabase
        .from("nutrition_documents")
        .select("description, uploaded_at, file_name, patient_id")
        .in("patient_id", patientIds)
        .order("uploaded_at", { ascending: false })
        .limit(1);

      console.log("Nutrition docs found:", nutritionDocs?.length || 0, "error:", nutritionError?.message);

      if (nutritionDocs && nutritionDocs.length > 0) {
        lastActivePlan = {
          description: nutritionDocs[0].description,
          uploadedAt: nutritionDocs[0].uploaded_at,
          fileName: nutritionDocs[0].file_name,
        };
      }
    }

    // Get total appointments count using medical_id join
    console.log("Counting appointments for medical_id:", medicalId);
    const { count: totalAppointments, error: countApptError } = await supabase
      .from("appointments")
      .select("*, patients!inner(medical_id)", { count: "exact", head: true })
      .eq("patients.medical_id", medicalId);

    console.log("Total appointments count:", totalAppointments, "error:", countApptError?.message);

    // Get total prescriptions count using patient_ids
    console.log("Counting prescriptions for patient_ids:", patientIds);
    const { count: totalPrescriptionsData, error: countPrescError } = await supabase
      .from("patient_prescriptions")
      .select("id", { count: "exact", head: true })
      .in("patient_id", patientIds);

    console.log("Total prescriptions count:", totalPrescriptionsData, "error:", countPrescError?.message);

    // Get total orders count using patient_ids
    console.log("Counting orders for patient_ids:", patientIds);
    const { count: totalOrdersData, error: countOrdersError } = await supabase
      .from("doctor_orders")
      .select("id", { count: "exact", head: true })
      .in("patient_id", patientIds);

    console.log("Total orders count:", totalOrdersData, "error:", countOrdersError?.message);

    // Calculate total spent from invoice_payments using patient_ids
    let totalSpent = 0;
    if (patientIds.length > 0) {
      console.log("Fetching invoices for patient_ids:", patientIds);
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoice_headers")
        .select("id")
        .in("patient_id", patientIds);

      console.log("Invoices found:", invoices?.length || 0, "error:", invoicesError?.message);

      if (invoices && invoices.length > 0) {
        const invoiceIds = invoices.map(inv => inv.id);
        console.log("Fetching payments for invoice_ids:", invoiceIds);
        const { data: payments, error: paymentsError } = await supabase
          .from("invoice_payments")
          .select("amount")
          .in("invoice_id", invoiceIds);

        console.log("Payments found:", payments?.length || 0, "error:", paymentsError?.message);

        if (payments && payments.length > 0) {
          totalSpent = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
          console.log("Total spent calculated:", totalSpent);
        }
      }
    }

    const finalStats = {
      nextAppointment,
      lastActivePlan,
      totalAppointments: totalAppointments || 0,
      totalPrescriptions: totalPrescriptionsData || 0,
      totalOrders: totalOrdersData || 0,
      totalSpent: totalSpent,
    };

    console.log("Returning final stats:", JSON.stringify(finalStats, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        stats: finalStats,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-dashboard-stats:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});