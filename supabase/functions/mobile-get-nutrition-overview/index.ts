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
    const { medicalId, doctorId, startDate, endDate } = body;

    if (!medicalId) {
      return new Response(
        JSON.stringify({ error: "Medical ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: patientRecords, error: patientError } = await supabase
      .from("patients")
      .select("id, company_id")
      .eq("is_deleted", false)
      .eq("medical_id", medicalId);

    if (patientError || !patientRecords || patientRecords.length === 0) {
      return new Response(
        JSON.stringify({ error: "Patient not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const patientIds = patientRecords.map(p => p.id);

    const { data: availableDoctors } = await supabase
      .from("nutrition_assessment")
      .select("doctor_id, doctors:doctor_id(id, full_name)")
      .in("patient_id", patientIds)
      .not("doctor_id", "is", null);

    let assessmentQuery = supabase
      .from("nutrition_assessment")
      .select(`
        id,
        assessment_date,
        chief_goal,
        program_type,
        current_weight_kg,
        target_weight_kg,
        activity_level,
        dietary_restrictions,
        medical_conditions,
        doctors:doctor_id (
          id,
          full_name
        )
      `)
      .in("patient_id", patientIds);

    if (doctorId) {
      assessmentQuery = assessmentQuery.eq("doctor_id", doctorId);
    }
    if (startDate) {
      assessmentQuery = assessmentQuery.gte("assessment_date", startDate);
    }
    if (endDate) {
      assessmentQuery = assessmentQuery.lte("assessment_date", endDate);
    }

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
      .in("patient_id", patientIds);

    if (doctorId) {
      goalsQuery = goalsQuery.eq("created_by_doctor_id", doctorId);
    }
    if (startDate) {
      goalsQuery = goalsQuery.gte("created_at", startDate);
    }
    if (endDate) {
      goalsQuery = goalsQuery.lte("created_at", endDate);
    }

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
      .in("patient_id", patientIds);

    if (doctorId) {
      measurementsQuery = measurementsQuery.eq("doctor_id", doctorId);
    }
    if (startDate) {
      measurementsQuery = measurementsQuery.gte("measurement_date", startDate);
    }
    if (endDate) {
      measurementsQuery = measurementsQuery.lte("measurement_date", endDate);
    }

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
      .in("patient_id", patientIds);

    if (doctorId) {
      followUpsQuery = followUpsQuery.eq("doctor_id", doctorId);
    }
    if (startDate) {
      followUpsQuery = followUpsQuery.gte("followup_date", startDate);
    }
    if (endDate) {
      followUpsQuery = followUpsQuery.lte("followup_date", endDate);
    }

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
      .in("patient_id", patientIds);

    if (doctorId) {
      mealPlansQuery = mealPlansQuery.eq("doctor_id", doctorId);
    }
    if (startDate) {
      mealPlansQuery = mealPlansQuery.gte("assigned_date", startDate);
    }
    if (endDate) {
      mealPlansQuery = mealPlansQuery.lte("assigned_date", endDate);
    }

    let documentsQuery = supabase
      .from("nutrition_documents")
      .select(`
        id,
        description,
        file_name,
        file_url,
        file_size,
        uploaded_at,
        doctors:doctor_id (
          id,
          full_name
        )
      `)
      .in("patient_id", patientIds);

    if (doctorId) {
      documentsQuery = documentsQuery.eq("doctor_id", doctorId);
    }
    if (startDate) {
      documentsQuery = documentsQuery.gte("uploaded_at", startDate);
    }
    if (endDate) {
      documentsQuery = documentsQuery.lte("uploaded_at", endDate);
    }

    const [
      assessmentResult,
      goalsResult,
      measurementsResult,
      followUpsResult,
      mealPlansResult,
      documentsResult
    ] = await Promise.all([
      assessmentQuery.order("assessment_date", { ascending: false }).limit(1).maybeSingle(),
      goalsQuery.order("created_at", { ascending: false }),
      measurementsQuery.order("measurement_date", { ascending: false }).limit(10),
      followUpsQuery.order("followup_date", { ascending: false }).limit(10),
      mealPlansQuery.order("assigned_date", { ascending: false }).limit(5),
      documentsQuery.order("uploaded_at", { ascending: false }).limit(10)
    ]);

    const currentStatus = assessmentResult.data ? {
      id: assessmentResult.data.id,
      assessment_date: assessmentResult.data.assessment_date,
      program_type: assessmentResult.data.program_type || '',
      chief_goal: assessmentResult.data.chief_goal || '',
      current_weight: assessmentResult.data.current_weight_kg || 0,
      target_weight: assessmentResult.data.target_weight_kg || 0,
      activity_level: assessmentResult.data.activity_level || '',
      dietary_restrictions: assessmentResult.data.dietary_restrictions || '',
      medical_conditions: assessmentResult.data.medical_conditions || '',
      doctor: {
        id: assessmentResult.data.doctors?.id || '',
        name: assessmentResult.data.doctors?.full_name || ''
      }
    } : null;

    const goals = (goalsResult.data || []).map(goal => ({
      id: goal.id,
      goal_type: goal.goal_type,
      start_value: goal.start_value || 0,
      target_value: goal.target_value || 0,
      unit: goal.unit || '',
      target_date: goal.target_date,
      status: goal.status || 'active',
      notes: goal.notes || '',
      progress: goal.start_value && goal.target_value
        ? Math.min(100, Math.abs((goal.start_value - goal.target_value) / goal.start_value * 100))
        : 0
    }));

    const measurements = (measurementsResult.data || []).map(m => ({
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

    const followUps = (followUpsResult.data || []).map(fu => ({
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

    const mealPlans = (mealPlansResult.data || []).map(mp => ({
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

    const documents = (documentsResult.data || []).map(doc => ({
      id: doc.id,
      description: doc.description || '',
      file_name: doc.file_name || '',
      file_url: doc.file_url || '',
      file_size: doc.file_size || 0,
      uploaded_at: doc.uploaded_at,
      doctor: {
        id: doc.doctors?.id || '',
        name: doc.doctors?.full_name || ''
      }
    }));

    const uniqueDoctors = Array.from(
      new Map(
        (availableDoctors || [])
          .filter(item => item.doctors)
          .map(item => [item.doctors.id, item.doctors])
      ).values()
    );

    return new Response(
      JSON.stringify({
        success: true,
        current_status: currentStatus,
        goals: goals,
        measurements: measurements,
        follow_ups: followUps,
        meal_plans: mealPlans,
        documents: documents,
        available_doctors: uniqueDoctors,
        total_goals: goals.length,
        total_measurements: measurements.length,
        total_follow_ups: followUps.length,
        total_meal_plans: mealPlans.length,
        total_documents: documents.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-nutrition-overview:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});