import { createClient } from 'npm:@supabase/supabase-js@2';
import { randomBytes, pbkdf2Sync } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derivedKey = pbkdf2Sync(password, salt, 100000, 32, 'sha256');

  const saltHex = salt.toString('hex');
  const hashHex = derivedKey.toString('hex');

  return `${saltHex}:${hashHex}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }

  const [saltHex, storedHashHex] = storedHash.split(':');

  const saltBytes = new Uint8Array(
    saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );

  const derivedKey = pbkdf2Sync(password, saltBytes, 100000, 32, 'sha256');

  const computedHashHex = Array.from(derivedKey)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return computedHashHex === storedHashHex;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { patientId, currentPassword, newPassword } = await req.json();

    if (!patientId || !currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ success: false, error: 'Password must be at least 8 characters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: patient, error: fetchError } = await supabase
      .from('user_patients')
      .select('password_hash, medical_id, must_change_password, temp_password_expires_at, first_login_at')
      .eq('is_deleted', false)
      .eq('id', patientId)
      .maybeSingle();

    if (fetchError || !patient) {
      return new Response(
        JSON.stringify({ success: false, error: 'Patient not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const isPasswordValid = verifyPassword(currentPassword, patient.password_hash);

    if (!isPasswordValid) {
      return new Response(
        JSON.stringify({ success: false, error: 'Current password is incorrect' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // A temporary (auto-generated) password that has expired can no longer be
    // used to set a new one — the patient must request a fresh password.
    if (
      patient.must_change_password === true &&
      patient.temp_password_expires_at &&
      new Date(patient.temp_password_expires_at) < new Date()
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          code: 'TEMP_PASSWORD_EXPIRED',
          error: 'Your temporary password has expired. Please request a new password.',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // The new password must actually differ from the current one.
    if (verifyPassword(newPassword, patient.password_hash)) {
      return new Response(
        JSON.stringify({ success: false, error: 'New password must be different from your current password' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const newPasswordHash = hashPassword(newPassword);
    const nowIso = new Date().toISOString();
    // Clear the forced-change state and stamp the change. Preserve an existing
    // first_login_at; otherwise this change IS the first login.
    const passwordChangeFields = {
      password_hash: newPasswordHash,
      must_change_password: false,
      password_changed_at: nowIso,
      first_login_at: patient.first_login_at ?? nowIso,
      temp_password_expires_at: null,
      password_reset_reason: null,
      updated_at: nowIso,
    };

    // If medical_id exists, update all accounts with the same medical_id
    // Otherwise, just update this specific patient
    const { error: updateError } = patient.medical_id
      ? await supabase
          .from('user_patients')
          .update(passwordChangeFields)
          .eq('medical_id', patient.medical_id)
      : await supabase
          .from('user_patients')
          .update(passwordChangeFields)
          .eq('id', patientId);

    if (updateError) {
      console.error('Update password error:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update password' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Password updated successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error changing password:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});