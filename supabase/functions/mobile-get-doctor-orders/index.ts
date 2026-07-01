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

    const url = new URL(req.url);
    const globalId = url.searchParams.get("global_id");
    const companyId = url.searchParams.get("company_id");
    const doctorId = url.searchParams.get("doctor_id");
    const patientMedicalId = url.searchParams.get("patient_medical_id");

    if (!globalId) {
      return new Response(
        JSON.stringify({ error: "global_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Doctor orders params:', { globalId, companyId, doctorId, patientMedicalId });

    let userQuery = supabase
      .from("users")
      .select("id, company_id")
      .eq("is_deleted", false)
      .eq("global_id", globalId);

    if (companyId) {
      userQuery = userQuery.eq("company_id", companyId);
    }

    const { data: allUserData, error: userError } = await userQuery;

    if (userError || !allUserData || allUserData.length === 0) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userIds = allUserData.map((user: any) => user.id);
    const companyIds = allUserData.map((user: any) => user.company_id);

    if (!doctorId && !patientMedicalId) {
      const { data: doctorAccess, error: accessError } = await supabase
        .from("user_doctor_access")
        .select(`
          doctors:doctor_id (
            id,
            first_name,
            last_name,
            company_id,
            doctor_specializations(name)
          )
        `)
        .in("user_id", userIds);

      if (accessError) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch doctors" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const doctors = (doctorAccess || [])
        .filter((item: any) => item.doctors && companyIds.includes(item.doctors.company_id))
        .map((item: any) => ({
          id: item.doctors.id,
          name: `${item.doctors.first_name} ${item.doctors.last_name}`,
          specialization: item.doctors.doctor_specializations?.name || "N/A",
        }));

      return new Response(
        JSON.stringify({
          success: true,
          accessible_doctors: doctors,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (doctorId && patientMedicalId) {
      // Verify user has access to this doctor through user_doctor_access
      const { data: access, error: accessError } = await supabase
        .from("user_doctor_access")
        .select("*")
        .in("user_id", userIds)
        .eq("doctor_id", doctorId)
        .maybeSingle();

      if (accessError || !access) {
        return new Response(
          JSON.stringify({ error: "Access denied to this doctor" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: doctorData, error: doctorError } = await supabase
        .from("doctors")
        .select("company_id")
        .eq("is_deleted", false)
        .eq("id", doctorId)
        .maybeSingle();

      if (doctorError || !doctorData) {
        return new Response(
          JSON.stringify({ error: "Doctor not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!companyIds.includes(doctorData.company_id)) {
        return new Response(
          JSON.stringify({ error: "Access denied to this doctor's company" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("id")
        .eq("is_deleted", false)
        .eq("medical_id", patientMedicalId)
        .eq("company_id", doctorData.company_id)
        .maybeSingle();

      if (patientError || !patientData) {
        return new Response(
          JSON.stringify({ error: "Patient not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from("doctor_orders")
        .select(`
          id,
          order_id,
          description,
          file_path,
          created_at,
          doctor_id,
          patient_id,
          orders(description),
          doctors(first_name, last_name, doctor_specializations(name)),
          patients(medical_id, full_name),
          doctor_order_files!doctor_order_files_doctor_order_id_fkey(id, file_path, file_name, created_at)
        `)
        .eq("doctor_id", doctorId)
        .eq("patient_id", patientData.id)
        .order("created_at", { ascending: false });

      if (ordersError) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch orders" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const orders = ordersData?.map((order: any) => ({
        id: order.id,
        order_type: order.orders?.description || "N/A",
        doctor_notes: order.description || "",
        file_path: order.file_path,
        files: (order.doctor_order_files || []).map((f: any) => ({
          id: f.id,
          file_path: f.file_path,
          file_name: f.file_name || f.file_path,
        })),
        created_at: order.created_at,
        doctor_id: order.doctor_id,
        doctor_name: order.doctors
          ? `${order.doctors.first_name} ${order.doctors.last_name}`
          : "N/A",
        doctor_specialization: order.doctors?.doctor_specializations?.name || "N/A",
        patient_name: order.patients?.full_name || "N/A",
        patient_medical_id: order.patients?.medical_id || "N/A",
      })) || [];

      return new Response(
        JSON.stringify({
          success: true,
          orders,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid parameters" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-doctor-orders:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
