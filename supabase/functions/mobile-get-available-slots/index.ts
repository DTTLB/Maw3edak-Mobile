import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { doctorId, clinicId, date } = await req.json();

    if (!doctorId || !clinicId || !date) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Check if doctor allows online booking
    const { data: doctor } = await supabase
      .from('doctors')
      .select('booking_online')
      .eq('is_deleted', false)
      .eq('id', doctorId)
      .single();

    if (!doctor || !doctor.booking_online) {
      return new Response(
        JSON.stringify({ success: false, error: 'Doctor does not accept online bookings' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for schedule exceptions first
    const { data: exception } = await supabase
      .from('doctor_schedule_exceptions')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('clinic_id', clinicId)
      .eq('exception_date', date)
      .maybeSingle();

    let workingHours: { start_time: string; end_time: string; appointment_duration?: number } | null = null;

    if (exception) {
      if (exception.exception_type === 'day_off' || exception.exception_type === 'vacation' || exception.exception_type === 'sick_leave') {
        return new Response(
          JSON.stringify({ success: true, availableSlots: [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (exception.start_time && exception.end_time) {
        workingHours = {
          start_time: exception.start_time,
          end_time: exception.end_time,
          appointment_duration: 30
        };
      }
    }

    if (!workingHours) {
      // Get regular recurring schedule
      const { data: schedule } = await supabase
        .from('doctor_recurring_schedules')
        .select('start_time, end_time, appointment_duration, is_day_off, is_active')
        .eq('doctor_id', doctorId)
        .eq('clinic_id', clinicId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .eq('is_day_off', false)
        .maybeSingle();

      if (!schedule) {
        return new Response(
          JSON.stringify({ success: true, availableSlots: [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      workingHours = {
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        appointment_duration: schedule.appointment_duration || 30
      };
    }

    // Get schedule blocks for the date
    const { data: blocks } = await supabase
      .from('doctor_schedule_blocks')
      .select('start_time, end_time')
      .eq('doctor_id', doctorId)
      .eq('clinic_id', clinicId)
      .eq('block_date', date);

    // Get existing appointments for the date.
    // Statuses are stored lowercase; pending/scheduled/confirmed all occupy a slot.
    // Only cancelled appointments free the slot back up.
    const { data: appointments } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('doctor_id', doctorId)
      .eq('clinic_id', clinicId)
      .eq('appointment_date', date)
      .in('status', ['pending', 'scheduled', 'confirmed']);

    // Generate all possible slots using appointment_duration
    const slotDuration = workingHours.appointment_duration || 30;
    const slots: string[] = [];
    const [startHour, startMin] = workingHours.start_time.split(':').map(Number);
    const [endHour, endMin] = workingHours.end_time.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;
    const endMinutes = endHour * 60 + endMin;

    while (currentHour * 60 + currentMin < endMinutes) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      slots.push(timeStr);

      currentMin += slotDuration;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
    }

    // Filter out blocked and booked slots
    const availableSlots = slots.filter((slot) => {
      // Check if slot is blocked
      const isBlocked = blocks?.some((block: any) => {
        return slot >= block.start_time && slot < block.end_time;
      });

      if (isBlocked) return false;

      // Check if slot is already booked
      const isBooked = appointments?.some((apt: any) => {
        const aptTime = apt.appointment_time.substring(0, 5);
        return aptTime === slot;
      });

      return !isBooked;
    });

    return new Response(
      JSON.stringify({ success: true, availableSlots }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});