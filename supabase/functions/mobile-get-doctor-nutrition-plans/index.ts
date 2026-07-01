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

    if (!doctorId) {
      return new Response(
        JSON.stringify({ error: "doctor_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!patientMedicalId) {
      return new Response(
        JSON.stringify({ error: "patient_medical_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Fetching nutrition plans for doctor ${doctorId} and patient ${patientMedicalId}`);

    // Get patient records for the medical ID
    let patientQuery = supabase
      .from("patients")
      .select("id, full_name, medical_id, company_id")
      .eq("is_deleted", false)
      .eq("medical_id", patientMedicalId);

    if (companyId) {
      patientQuery = patientQuery.eq("company_id", companyId);
    }

    const { data: patientRecords, error: patientError } = await patientQuery;

    if (patientError || !patientRecords || patientRecords.length === 0) {
      console.error("Patient lookup error:", patientError);
      return new Response(
        JSON.stringify({ error: "Patient not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const patientIds = patientRecords.map(p => p.id);
    const patient = patientRecords[0];

    // Fetch nutrition assessments
    let assessmentsQuery = supabase
      .from("nutrition_assessment")
      .select(`
        *,
        doctors(
          id,
          first_name,
          last_name,
          full_name,
          doctor_specializations(name)
        ),
        companies(name)
      `)
      .in("patient_id", patientIds)
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false });

    // Fetch nutrition goals
    let goalsQuery = supabase
      .from("nutrition_goal")
      .select(`
        id,
        goal_type,
        start_value,
        target_value,
        unit,
        target_date,
        status,
        notes,
        created_at
      `)
      .in("patient_id", patientIds)
      .eq("created_by_doctor_id", doctorId)
      .order("created_at", { ascending: false });

    // Fetch body measurements
    let measurementsQuery = supabase
      .from("body_measurement")
      .select(`
        id,
        measurement_date,
        weight_kg,
        height_cm,
        bmi,
        body_fat_pct,
        muscle_pct,
        waist_cm,
        hip_cm,
        chest_cm,
        arm_cm,
        notes,
        doctor_id
      `)
      .in("patient_id", patientIds)
      .eq("doctor_id", doctorId)
      .order("measurement_date", { ascending: false })
      .limit(10);

    // Fetch follow-ups
    let followUpsQuery = supabase
      .from("nutrition_follow_up")
      .select(`
        id,
        followup_date,
        current_weight_kg,
        adherence_10,
        symptoms_update,
        plan_changes,
        next_check_in,
        doctors:doctor_id (
          id,
          full_name
        )
      `)
      .in("patient_id", patientIds)
      .eq("doctor_id", doctorId)
      .order("followup_date", { ascending: false })
      .limit(10);

    // Fetch meal plans
    let mealPlansQuery = supabase
      .from("patient_meal_plan")
      .select(`
        id,
        assigned_date,
        start_date,
        end_date,
        status,
        notes,
        meal_plan:meal_plan_id (
          id,
          plan_title,
          daily_calories,
          macros
        ),
        doctors:doctor_id (
          id,
          full_name
        )
      `)
      .in("patient_id", patientIds)
      .eq("doctor_id", doctorId)
      .order("assigned_date", { ascending: false })
      .limit(5);

    // Fetch nutrition documents
    let documentsQuery = supabase
      .from("nutrition_documents")
      .select(`
        id,
        description,
        file_name,
        file_url,
        file_size,
        uploaded_at
      `)
      .in("patient_id", patientIds)
      .eq("doctor_id", doctorId)
      .order("uploaded_at", { ascending: false })
      .limit(10);

    const [
      assessmentsResult,
      goalsResult,
      measurementsResult,
      followUpsResult,
      mealPlansResult,
      documentsResult
    ] = await Promise.all([
      assessmentsQuery,
      goalsQuery,
      measurementsQuery,
      followUpsQuery,
      mealPlansQuery,
      documentsQuery
    ]);

    if (assessmentsResult.error) {
      console.error("Error fetching nutrition assessments:", assessmentsResult.error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch nutrition plans", details: assessmentsResult.error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const assessments = assessmentsResult.data;
    const documents = documentsResult.data || [];
    const goals = goalsResult.data || [];
    const measurements = measurementsResult.data || [];
    const followUps = followUpsResult.data || [];
    const mealPlans = mealPlansResult.data || [];

    console.log(`Found ${assessments?.length || 0} assessments, ${goals.length} goals, ${measurements.length} measurements, ${followUps.length} follow-ups, ${mealPlans.length} meal plans, ${documents.length} documents`);

    // Format current status (latest assessment)
    const currentStatus = assessments && assessments.length > 0 ? {
      id: assessments[0].id,
      assessment_date: assessments[0].assessment_date,
      program_type: assessments[0].program_type || '',
      chief_goal: assessments[0].chief_goal || '',
      current_weight: assessments[0].current_weight_kg || 0,
      target_weight: assessments[0].target_weight_kg || 0,
      activity_level: assessments[0].activity_level || '',
      dietary_restrictions: assessments[0].dietary_restrictions || '',
      medical_conditions: assessments[0].medical_conditions || '',
      doctor: {
        id: assessments[0].doctors?.id || '',
        name: assessments[0].doctors?.full_name || ''
      }
    } : null;

    // Format goals
    const formattedGoals = goals.map((goal: any) => ({
      id: goal.id,
      goal_type: goal.goal_type,
      start_value: goal.start_value || 0,
      target_value: goal.target_value || 0,
      unit: goal.unit || '',
      target_date: goal.target_date,
      status: goal.status || 'active',
      notes: goal.notes || '',
    }));

    // Format measurements
    const formattedMeasurements = measurements.map((m: any) => ({
      id: m.id,
      date: m.measurement_date,
      weight: m.weight_kg || 0,
      height: m.height_cm || 0,
      bmi: m.bmi || 0,
      body_fat: m.body_fat_pct || 0,
      muscle: m.muscle_pct || 0,
      waist: m.waist_cm || 0,
      hip: m.hip_cm || 0,
      chest: m.chest_cm || 0,
      arm: m.arm_cm || 0,
      notes: m.notes || ''
    }));

    // Format follow-ups
    const formattedFollowUps = followUps.map((fu: any) => ({
      id: fu.id,
      date: fu.followup_date,
      weight: fu.current_weight_kg || 0,
      adherence: fu.adherence_10 || 0,
      symptoms: fu.symptoms_update || '',
      plan_changes: fu.plan_changes || '',
      next_check_in: fu.next_check_in,
      doctor: {
        id: fu.doctors?.id || '',
        name: fu.doctors?.full_name || ''
      }
    }));

    // Format meal plans
    const formattedMealPlans = mealPlans.map((mp: any) => ({
      id: mp.id,
      assigned_date: mp.assigned_date,
      start_date: mp.start_date,
      end_date: mp.end_date,
      status: mp.status || 'active',
      notes: mp.notes || '',
      plan_title: mp.meal_plan?.plan_title || '',
      daily_calories: mp.meal_plan?.daily_calories || 0,
      macros: mp.meal_plan?.macros || {},
      doctor: {
        id: mp.doctors?.id || '',
        name: mp.doctors?.full_name || ''
      }
    }));

    // Format documents
    const formattedDocuments = documents.map((doc: any) => ({
      id: doc.id,
      description: doc.description || '',
      file_name: doc.file_name || '',
      file_url: doc.file_url || '',
      file_size: doc.file_size || 0,
      uploaded_at: doc.uploaded_at,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        current_status: currentStatus,
        goals: formattedGoals,
        measurements: formattedMeasurements,
        follow_ups: formattedFollowUps,
        meal_plans: formattedMealPlans,
        documents: formattedDocuments,
        total_goals: formattedGoals.length,
        total_measurements: formattedMeasurements.length,
        total_follow_ups: formattedFollowUps.length,
        total_meal_plans: formattedMealPlans.length,
        total_documents: formattedDocuments.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-doctor-nutrition-plans:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
