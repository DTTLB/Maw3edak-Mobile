// Shared doctor session issuance — the post-authentication half of
// doctor-mobile-login. Factored out so mobile-doctor-2fa-login can complete a
// gated sign-in and return the EXACT same payload (session, user, companies,
// accessible_doctors) as an un-gated login.
//
// Caller responsibilities (password OR 2FA already verified):
//   - selectedDoctor: the users row for the company the doctor is signing into.
//   - activeDoctors:  the subset of the doctor's company rows whose subscription
//                     is currently valid (used for the companies[] list).
//   - body:           the original request body (for fcm_token / device info).

import { randomBytes } from "node:crypto";

// deno-lint-ignore no-explicit-any
type Supabase = any;
// deno-lint-ignore no-explicit-any
type Doctor = any;

export interface DoctorLoginPayload {
  session: { token: string; expires_at: number };
  user: {
    id: string;
    email: string;
    mobile: string;
    full_name: string;
    global_id: string;
    role: string;
    company_id: string;
  };
  companies: Array<{
    id: string;
    company_id: string;
    is_primary_company: boolean;
    role: string;
  }>;
  accessible_doctors: Array<{
    id: string;
    full_name: string;
    email: string;
    specialization: string | null;
    access_type: string;
  }>;
}

export async function issueDoctorSession(
  supabase: Supabase,
  selectedDoctor: Doctor,
  activeDoctors: Doctor[],
  // deno-lint-ignore no-explicit-any
  body: any,
): Promise<DoctorLoginPayload> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const { error: sessionError } = await supabase.from("user_sessions").insert({
    user_id: selectedDoctor.id,
    token,
    expires_at: expiresAt.toISOString(),
  });
  if (sessionError) {
    throw new Error(`Failed to create session: ${sessionError.message}`);
  }

  const user = {
    id: selectedDoctor.id,
    email: selectedDoctor.email,
    mobile: selectedDoctor.mobile,
    full_name: selectedDoctor.full_name,
    global_id: selectedDoctor.global_id,
    role: selectedDoctor.role,
    company_id: selectedDoctor.company_id,
  };

  // Only expose companies with a valid (non-expired) subscription.
  const companies = activeDoctors.map((doc: Doctor) => ({
    id: doc.id,
    company_id: doc.company_id,
    is_primary_company: doc.is_primary_company,
    role: doc.role,
  }));

  const { data: doctorAccess, error: doctorAccessError } = await supabase
    .from("user_doctor_access")
    .select(
      `
      doctor_id,
      access_type,
      doctors:doctor_id (
        id,
        full_name,
        email,
        specialization_id,
        doctor_specializations:specialization_id (
          name
        )
      )
    `,
    )
    .eq("user_id", selectedDoctor.id);

  if (doctorAccessError) {
    console.error("Doctor access fetch error:", doctorAccessError.message);
  }

  const accessible_doctors = doctorAccess?.map((da: Doctor) => ({
    id: da.doctors?.id,
    full_name: da.doctors?.full_name,
    email: da.doctors?.email,
    specialization: da.doctors?.doctor_specializations?.name || null,
    access_type: da.access_type,
  })) || [];

  // Register the FCM device token (same logic as doctor-mobile-login).
  const fcmToken = body?.fcm_token?.trim() ||
    body?.fcmToken?.trim() ||
    body?.deviceToken?.trim() ||
    null;

  if (fcmToken) {
    const { error: deactivateErr } = await supabase
      .from("device_tokens")
      .update({ is_active: false })
      .eq("user_id", selectedDoctor.id)
      .neq("fcm_token", fcmToken)
      .eq("is_active", true);
    if (deactivateErr) {
      console.error("device_tokens deactivate error:", deactivateErr.message);
    }

    const { data: existingToken } = await supabase
      .from("device_tokens")
      .select("id")
      .eq("user_id", selectedDoctor.id)
      .eq("fcm_token", fcmToken)
      .maybeSingle();

    if (existingToken) {
      const { error: updateError } = await supabase
        .from("device_tokens")
        .update({
          global_id: selectedDoctor.global_id,
          platform: body.platform ?? null,
          device_model: body.device_model ?? body.deviceModel ?? null,
          app_version: body.app_version ?? body.appVersion ?? null,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingToken.id);
      if (updateError) console.error("Device token update failed:", updateError.message);
    } else {
      const { error: insertError } = await supabase
        .from("device_tokens")
        .insert({
          user_id: selectedDoctor.id,
          global_id: selectedDoctor.global_id,
          fcm_token: fcmToken,
          platform: body.platform ?? null,
          device_model: body.device_model ?? body.deviceModel ?? null,
          app_version: body.app_version ?? body.appVersion ?? null,
          is_active: true,
        });
      if (insertError) console.error("Device token insert failed:", insertError.message);
    }
  }

  return {
    session: { token, expires_at: expiresAt.getTime() },
    user,
    companies,
    accessible_doctors,
  };
}

// Loads a doctor's full company context from a single users row id, computing
// which companies have a valid subscription. Used by mobile-doctor-2fa-login,
// which starts from the pending token's user_id rather than from email.
export async function loadDoctorContextByUserId(
  supabase: Supabase,
  userId: string,
): Promise<
  { selectedDoctor: Doctor; activeDoctors: Doctor[] } | null
> {
  const { data: selected } = await supabase
    .from("users")
    .select("global_id")
    .eq("is_deleted", false)
    .eq("id", userId)
    .maybeSingle();
  if (!selected?.global_id) return null;

  const { data: doctors } = await supabase
    .from("users")
    .select(
      "id, company_id, email, mobile, password_hash, full_name, is_active, global_id, role, is_primary_company, companies(id, name, slug, address, mobile, email, register_number)",
    )
    .eq("is_deleted", false)
    .eq("global_id", selected.global_id)
    .eq("is_active", true);

  if (!doctors || doctors.length === 0) return null;

  const selectedDoctor = doctors.find((d: Doctor) => d.id === userId);
  if (!selectedDoctor) return null;

  // Determine which companies have a currently-valid subscription.
  const companyIds = [...new Set(doctors.map((d: Doctor) => d.company_id))];
  const validCompanyIds = new Set<string>();
  const now = new Date();
  const { data: subs } = await supabase
    .from("company_subscriptions")
    .select("company_id, end_date, is_active")
    .in("company_id", companyIds)
    .eq("is_active", true);
  for (const sub of subs || []) {
    if (!sub.end_date || new Date(sub.end_date) >= now) {
      validCompanyIds.add(sub.company_id);
    }
  }

  const activeDoctors = doctors.filter((d: Doctor) =>
    validCompanyIds.has(d.company_id)
  );

  return { selectedDoctor, activeDoctors };
}
