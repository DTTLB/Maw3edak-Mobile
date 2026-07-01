import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// business-get-booking-options
// -----------------------------------------------------------------------------
// Returns the SERVICES and ROOMS a receptionist can attach to a new appointment,
// for the chosen doctor. Both are scoped to what THIS doctor has access to, via
// the doctor_service_access / doctor_room_access junction tables — NOT to every
// service/room in the company. A doctor only offers the services and uses the
// rooms they are explicitly assigned to.
//
// Request: { doctorId }   (company is resolved server-side from the doctor)
// Response: { success, services:[...], rooms:[...] }
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

    const body = await req.json().catch(() => ({}));
    const doctorId = body.doctorId || body.doctor_id;

    // Services/rooms are scoped to the doctor's explicit access, so a doctorId is
    // required — a company alone can't tell us which subset this doctor offers.
    if (!doctorId) {
      return json({ success: false, error: "doctorId is required" }, 400);
    }

    // 1) Resolve the service / room ids this doctor is assigned to. Scoped by
    // doctor_id ONLY — a doctor belongs to exactly one company and doctor_id is
    // globally unique, so an extra company_id filter is redundant and would wrongly
    // return nothing whenever the caller's company_id doesn't match the access
    // rows' company. This mirrors how doctor_clinic_access is queried (doctor_id
    // only), keeping services/rooms consistent with the clinic step.
    const svcAccessQuery = supabase
      .from("doctor_service_access")
      .select("service_id")
      .eq("doctor_id", doctorId);
    const roomAccessQuery = supabase
      .from("doctor_room_access")
      .select("room_id")
      .eq("doctor_id", doctorId);

    const [svcAccessRes, roomAccessRes] = await Promise.all([svcAccessQuery, roomAccessQuery]);

    const serviceIds = [
      ...new Set((svcAccessRes.data || []).map((r: any) => r.service_id).filter(Boolean)),
    ];
    const roomIds = [
      ...new Set((roomAccessRes.data || []).map((r: any) => r.room_id).filter(Boolean)),
    ];

    // No assigned services/rooms -> nothing to offer (the UI renders an empty
    // state and still allows booking without a service/room).
    if (serviceIds.length === 0 && roomIds.length === 0) {
      return json({ success: true, services: [], rooms: [] });
    }

    // 2) Fetch only the assigned services / rooms.
    const [servicesRes, roomsRes] = await Promise.all([
      serviceIds.length > 0
        ? supabase
            .from("services")
            .select("id, name, description, price, duration_minutes, is_active")
            .in("id", serviceIds)
        : Promise.resolve({ data: [] as any[] }),
      roomIds.length > 0
        ? supabase
            .from("rooms")
            .select("id, room_number, room_type, floor")
            .in("id", roomIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    // `is_active` may be NULL on legacy rows — treat NULL as active.
    const services = (servicesRes.data || [])
      .filter((s: any) => s.is_active !== false)
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description || "",
        price: s.price ?? null,
        duration_minutes: s.duration_minutes ?? null,
      }))
      .sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));

    const rooms = (roomsRes.data || [])
      .map((r: any) => ({
        id: r.id,
        room_number: r.room_number || "",
        room_type: r.room_type || "",
        floor: r.floor ?? null,
      }))
      .sort((a: any, b: any) => (a.room_number || "").localeCompare(b.room_number || ""));

    return json({ success: true, services, rooms });
  } catch (error: any) {
    console.error("Error in business-get-booking-options:", error);
    return json({ success: false, error: "Internal server error", details: error?.message || String(error) }, 500);
  }
});
