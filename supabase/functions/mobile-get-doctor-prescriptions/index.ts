import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const globalId = url.searchParams.get("global_id");
    const companyId = url.searchParams.get("company_id");
    const doctorId = url.searchParams.get("doctor_id");
    const patientMedicalId = url.searchParams.get("patient_medical_id");

    if (!globalId) {
      return new Response(
        JSON.stringify({ error: "Missing global_id parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Prescriptions params:', { globalId, companyId, doctorId, patientMedicalId });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user records with this global_id (optionally filtered by company_id)
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
      console.error("User lookup error:", userError);
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

    // Get doctors from user_doctor_access
    const { data: doctorAccess, error: doctorsError } = await supabase
      .from("user_doctor_access")
      .select(`
        doctors:doctor_id (
          id,
          company_id,
          first_name,
          last_name,
          full_name,
          specialization_id,
          doctor_specializations(name)
        )
      `)
      .in("user_id", userIds);

    if (doctorsError) {
      console.error("Doctors lookup error:", doctorsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch doctors" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const doctorsData = (doctorAccess || [])
      .filter((item: any) => item.doctors && companyIds.includes(item.doctors.company_id))
      .map((item: any) => item.doctors);

    if (!doctorsData || doctorsData.length === 0) {
      return new Response(
        JSON.stringify({ error: "No doctors found for this user" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Format all accessible doctors for the filter
    const accessibleDoctors = doctorsData.map((doctor: any) => {
      const doctorName = doctor.full_name ||
                        `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() ||
                        'Unknown Doctor';
      const specialization = doctor.doctor_specializations?.name || 'N/A';

      return {
        id: doctor.id,
        name: doctorName,
        specialization: specialization
      };
    });

    // If doctor_id or patient_medical_id is missing, just return the doctors list
    if (!doctorId || !patientMedicalId) {
      return new Response(
        JSON.stringify({
          prescriptions: [],
          total: 0,
          accessible_doctors: accessibleDoctors,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Find the doctor and verify access
    const selectedDoctor = doctorsData.find((d: any) => d.id === doctorId);
    if (!selectedDoctor) {
      return new Response(
        JSON.stringify({ error: "Doctor not found or access denied" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // First, get the patient by medical_id in the doctor's company
    const { data: patientData, error: patientError } = await supabase
      .from("patients")
      .select("id, medical_id, first_name, last_name")
      .eq("is_deleted", false)
      .eq("medical_id", patientMedicalId)
      .eq("company_id", selectedDoctor.company_id)
      .maybeSingle();

    if (patientError || !patientData) {
      console.error("Patient lookup error:", patientError);
      return new Response(
        JSON.stringify({ error: "Patient not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch prescriptions for specific doctor and patient
    const { data: prescriptionsData, error: prescriptionsError } = await supabase
      .from("patient_prescriptions")
      .select(`
        id,
        doctor_id,
        patient_id,
        prescription_date,
        notes,
        created_at,
        doctors!patient_prescriptions_doctor_id_fkey(
          id,
          full_name,
          first_name,
          last_name,
          doctor_specializations!doctors_specialization_id_fkey(
            name
          )
        )
      `)
      .eq("company_id", selectedDoctor.company_id)
      .eq("doctor_id", doctorId)
      .eq("patient_id", patientData.id)
      .order("prescription_date", { ascending: false });

    if (prescriptionsError) {
      console.error("Prescriptions fetch error:", prescriptionsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch prescriptions" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch prescription items for all prescriptions
    const prescriptionIds = prescriptionsData?.map((p) => p.id) || [];

    let prescriptionItems = [];
    if (prescriptionIds.length > 0) {
      const { data: itemsData, error: itemsError } = await supabase
        .from("prescription_items")
        .select("*")
        .in("patient_prescription_id", prescriptionIds)
        .order("created_at", { ascending: true });

      if (itemsError) {
        console.error("Prescription items fetch error:", itemsError);
      } else {
        prescriptionItems = itemsData || [];
      }
    }

    // Group items by prescription
    const prescriptions = prescriptionsData?.map((prescription: any) => {
      const items = prescriptionItems.filter(
        (item: any) => item.patient_prescription_id === prescription.id
      );

      const doctorInfo = prescription.doctors;
      const doctorName = doctorInfo?.full_name ||
                         `${doctorInfo?.first_name || ''} ${doctorInfo?.last_name || ''}`.trim() ||
                         'Unknown Doctor';
      const doctorSpec = doctorInfo?.doctor_specializations?.name || 'N/A';

      return {
        id: prescription.id,
        doctor_id: prescription.doctor_id,
        doctor_name: doctorName,
        doctor_specialization: doctorSpec,
        patient_name: `${patientData.first_name} ${patientData.last_name}`,
        patient_medical_id: patientData.medical_id,
        prescription_date: prescription.prescription_date,
        notes: prescription.notes,
        created_at: prescription.created_at,
        items: items.map((item: any) => ({
          id: item.id,
          medicine_name: item.medicine_name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          notes: item.notes,
        })),
      };
    }) || [];

    return new Response(
      JSON.stringify({
        prescriptions,
        total: prescriptions.length,
        accessible_doctors: accessibleDoctors,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
