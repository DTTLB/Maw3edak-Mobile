import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action, medicalId, cardId, brand, last4, holderName, expiry, isDefault } = body;

    if (!medicalId) {
      return new Response(
        JSON.stringify({ error: "Medical ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: patient, error: patientError } = await supabase
      .from("user_patients")
      .select("id")
      .eq("is_deleted", false)
      .eq("medical_id", medicalId)
      .maybeSingle();

    if (patientError || !patient) {
      return new Response(
        JSON.stringify({ error: "Patient not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const patientId = patient.id;

    if (action === "add") {
      const { data: existingCards } = await supabase
        .from("patient_payment_methods")
        .select("id")
        .eq("patient_id", patientId);

      const isFirst = !existingCards || existingCards.length === 0;

      const { data: newCard, error } = await supabase
        .from("patient_payment_methods")
        .insert({
          patient_id: patientId,
          brand,
          last4,
          holder_name: holderName,
          expiry,
          is_default: isFirst,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, card: newCard }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "set_default") {
      if (!cardId) {
        return new Response(
          JSON.stringify({ error: "Card ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabase
        .from("patient_payment_methods")
        .update({ is_default: false })
        .eq("patient_id", patientId);

      const { error } = await supabase
        .from("patient_payment_methods")
        .update({ is_default: true })
        .eq("id", cardId)
        .eq("patient_id", patientId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete") {
      if (!cardId) {
        return new Response(
          JSON.stringify({ error: "Card ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: card, error: fetchError } = await supabase
        .from("patient_payment_methods")
        .select("is_default")
        .eq("id", cardId)
        .eq("patient_id", patientId)
        .maybeSingle();

      if (fetchError || !card) {
        return new Response(
          JSON.stringify({ error: "Card not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase
        .from("patient_payment_methods")
        .delete()
        .eq("id", cardId)
        .eq("patient_id", patientId);

      if (error) throw error;

      if (card.is_default) {
        const { data: remaining } = await supabase
          .from("patient_payment_methods")
          .select("id")
          .eq("patient_id", patientId)
          .limit(1);

        if (remaining && remaining.length > 0) {
          await supabase
            .from("patient_payment_methods")
            .update({ is_default: true })
            .eq("id", remaining[0].id);
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
