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
    const { medicalId } = body;

    if (!medicalId) {
      return new Response(
        JSON.stringify({ error: "Medical ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Fetching orders for medical_id:", medicalId);

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
        JSON.stringify({
          success: true,
          doctors: [],
          orders: []
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const patientIds = patientRecords.map(p => p.id);
    console.log("Patient IDs:", patientIds);

    const { data: doctorAccessData, error: doctorError } = await supabase
      .from("patient_doctor_access")
      .select(`
        doctor_id,
        doctors!inner(
          id,
          first_name,
          last_name,
          doctor_specializations(name),
          companies(name)
        )
      `)
      .in("patient_id", patientIds);

    if (doctorError) {
      console.error("Doctor access error:", doctorError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch doctors", details: doctorError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const uniqueDoctors = new Map();
    doctorAccessData?.forEach((item: any) => {
      const doctor = item.doctors;
      if (doctor && !uniqueDoctors.has(doctor.id)) {
        uniqueDoctors.set(doctor.id, {
          id: doctor.id,
          name: `${doctor.first_name} ${doctor.last_name}`,
          specialization: doctor.doctor_specializations?.name || "N/A",
          company_name: doctor.companies?.name || "N/A",
        });
      }
    });

    const doctors = Array.from(uniqueDoctors.values());
    console.log("Doctors found:", doctors.length);

    const { data: ordersData, error: ordersError } = await supabase
      .from("doctor_orders")
      .select(`
        id,
        order_id,
        description,
        file_path,
        created_at,
        doctor_id,
        orders(description),
        doctors(first_name, last_name, companies(name)),
        doctor_order_files!doctor_order_files_doctor_order_id_fkey(id, file_path, file_name, created_at)
      `)
      .in("patient_id", patientIds)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Orders error:", ordersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch orders", details: ordersError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const orders = ordersData?.map((order: any) => {
      const extraFiles: { id: string; file_path: string; file_name: string }[] =
        (order.doctor_order_files || []).map((f: any) => ({
          id: f.id,
          file_path: f.file_path,
          file_name: f.file_name || f.file_path,
        }));

      return {
        id: order.id,
        order_type: order.orders?.description || "N/A",
        doctor_notes: order.description || "",
        file_path: order.file_path,
        files: extraFiles,
        created_at: order.created_at,
        doctor_id: order.doctor_id,
        doctor_name: order.doctors
          ? `${order.doctors.first_name} ${order.doctors.last_name}`
          : "N/A",
        company_name: order.doctors?.companies?.name || "N/A",
      };
    }) || [];

    console.log("Orders found:", orders.length);

    return new Response(
      JSON.stringify({
        success: true,
        doctors,
        orders,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-orders:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
