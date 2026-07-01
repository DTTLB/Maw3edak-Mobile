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
    const { doctorId, clinicId, year, month } = body;

    if (!doctorId || !clinicId || year === undefined || month === undefined) {
      return new Response(
        JSON.stringify({ error: "Doctor ID, Clinic ID, year, and month are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDateStr = startDate > today ? startDate.toISOString().split('T')[0] : today.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`Fetching available dates for doctor ${doctorId}, clinic ${clinicId}, from ${startDateStr} to ${endDateStr}`);

    const { data: schedules, error: schedulesError } = await supabase
      .from("doctor_recurring_schedules")
      .select("day_of_week, start_time, end_time, appointment_duration, is_day_off")
      .eq("doctor_id", doctorId)
      .eq("clinic_id", clinicId)
      .eq("is_active", true)
      .eq("is_day_off", false);

    if (schedulesError) {
      console.error("Error fetching doctor schedules:", schedulesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch doctor schedules", details: schedulesError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!schedules || schedules.length === 0) {
      return new Response(
        JSON.stringify({ success: true, availableDates: [] }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select("appointment_date, appointment_time")
      .eq("doctor_id", doctorId)
      .eq("clinic_id", clinicId)
      .gte("appointment_date", startDateStr)
      .lte("appointment_date", endDateStr)
      .in("status", ["Scheduled", "Confirmed"]);

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch appointments", details: appointmentsError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: exceptions, error: exceptionsError } = await supabase
      .from("doctor_schedule_exceptions")
      .select("exception_date, exception_type, start_time, end_time")
      .eq("doctor_id", doctorId)
      .eq("clinic_id", clinicId)
      .gte("exception_date", startDateStr)
      .lte("exception_date", endDateStr);

    if (exceptionsError) {
      console.error("Error fetching schedule exceptions:", exceptionsError);
    }

    const { data: blocks, error: blocksError } = await supabase
      .from("doctor_schedule_blocks")
      .select("block_date, start_time, end_time")
      .eq("doctor_id", doctorId)
      .eq("clinic_id", clinicId)
      .gte("block_date", startDateStr)
      .lte("block_date", endDateStr);

    if (blocksError) {
      console.error("Error fetching schedule blocks:", blocksError);
    }

    const exceptionsMap = new Map();
    exceptions?.forEach(exc => {
      exceptionsMap.set(exc.exception_date, exc);
    });

    const blocksMap = new Map<string, Array<{start_time: string, end_time: string}>>();
    blocks?.forEach(block => {
      if (!blocksMap.has(block.block_date)) {
        blocksMap.set(block.block_date, []);
      }
      blocksMap.get(block.block_date)!.push({
        start_time: block.start_time,
        end_time: block.end_time
      });
    });

    const availableDates: string[] = [];
    const currentDate = new Date(startDateStr);
    const end = new Date(endDateStr);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      const dateStr = currentDate.toISOString().split('T')[0];

      const exception = exceptionsMap.get(dateStr);

      if (exception && (exception.exception_type === 'day_off' || exception.exception_type === 'vacation' || exception.exception_type === 'sick_leave')) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      let daySchedules = schedules.filter(s => s.day_of_week === dayOfWeek);

      if (exception && exception.start_time && exception.end_time) {
        daySchedules = [{
          day_of_week: dayOfWeek,
          start_time: exception.start_time,
          end_time: exception.end_time,
          appointment_duration: 30
        }];
      }

      if (daySchedules.length > 0) {
        let hasAvailableSlot = false;

        for (const schedule of daySchedules) {
          const slots = generateTimeSlots(schedule.start_time, schedule.end_time, schedule.appointment_duration || 30);

          const bookedSlots = appointments
            ?.filter(a => a.appointment_date === dateStr)
            .map(a => a.appointment_time) || [];

          const dateBlocks = blocksMap.get(dateStr) || [];
          const blockedSlots: string[] = [];
          dateBlocks.forEach(block => {
            const blockSlots = generateTimeSlots(block.start_time, block.end_time, schedule.appointment_duration || 30);
            blockedSlots.push(...blockSlots);
          });

          const availableSlots = slots.filter(slot =>
            !bookedSlots.includes(slot) && !blockedSlots.includes(slot)
          );

          if (availableSlots.length > 0) {
            hasAvailableSlot = true;
            break;
          }
        }

        if (hasAvailableSlot) {
          availableDates.push(dateStr);
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`Found ${availableDates.length} available dates`);

    return new Response(
      JSON.stringify({
        success: true,
        availableDates,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mobile-get-available-dates:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateTimeSlots(startTime: string, endTime: string, slotDuration: number): string[] {
  const slots: string[] = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  let currentHour = startHour;
  let currentMinute = startMinute;

  while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
    const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    slots.push(timeStr);

    currentMinute += slotDuration;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }

  return slots;
}
