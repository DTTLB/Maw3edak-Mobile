import { SUPABASE_URL } from '@/utils/supabase';
import { config } from '@/utils/config';

export interface DoctorModuleEntry {
  id: string;
  full_name: string;
  specialization: string | null;
  module: string | null;
}

export interface CheckDoctorModuleResult {
  success: boolean;
  medicalId: string;
  /** Distinct, non-null modules the patient has access to, e.g. ["eye", "dental", "nutrition"]. */
  modules: string[];
  /** Per-doctor breakdown of specialization and module. */
  doctors: DoctorModuleEntry[];
}

/**
 * Check which doctor modules a patient has access to.
 *
 * Resolves: patient (medical_id) -> patient_doctor_access -> doctor
 * -> doctor_specializations.module.
 *
 * Calls the `mobile-check-doctor-module` edge function (service-role side),
 * since patients / patient_doctor_access are protected by RLS on the client.
 */
export async function checkDoctorModule(
  medicalId: string
): Promise<CheckDoctorModuleResult> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/mobile-check-doctor-module`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ medicalId }),
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'Failed to check doctor module');
  }

  return data as CheckDoctorModuleResult;
}

export interface DoctorModulesResult {
  success: boolean;
  /** Distinct, non-null modules across the doctor-user's accessible doctors. */
  modules: string[];
  doctors: DoctorModuleEntry[];
}

/**
 * Get the distinct doctor modules for a logged-in doctor, based on the
 * specializations of the doctor records they have access to.
 *
 * Resolves: user (global_id) -> user_doctor_access -> doctor
 * -> doctor_specializations.module.
 *
 * Calls the `mobile-get-doctor-modules` edge function.
 */
export async function getDoctorModules(
  globalId: string,
  companyId?: string | null
): Promise<DoctorModulesResult> {
  const params = new URLSearchParams({ global_id: globalId });
  if (companyId) {
    params.set('company_id', companyId);
  }

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/mobile-get-doctor-modules?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data?.error || 'Failed to get doctor modules');
  }

  return data as DoctorModulesResult;
}
