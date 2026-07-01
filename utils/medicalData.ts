import { getSession } from '@/utils/auth';
import { config } from '@/utils/config';

// Tables the patient can manage. Each is one-to-many on medical_id with is_active soft-delete.
// IMPORTANT: medical_id is never read, written, or sent from the client — the Edge Function
// resolves it from the session token and owns it entirely.
export type MedicalTable =
  | 'allergies'
  | 'emergency_contacts'
  | 'conditions'
  | 'surgeries';

export type MedicalOperation = 'insert' | 'update' | 'delete';

export interface MedicalRecord {
  id: string;
  is_active?: boolean;
  [key: string]: any;
}

export interface MedicalData {
  allergies: MedicalRecord[];
  emergency_contacts: MedicalRecord[];
  conditions: MedicalRecord[];
  surgeries: MedicalRecord[];
}

export const EMPTY_MEDICAL_DATA: MedicalData = {
  allergies: [],
  emergency_contacts: [],
  conditions: [],
  surgeries: [],
};

async function getAccessToken(): Promise<string> {
  const session = await getSession();
  if (!session || !session.access_token) {
    throw new Error('Please log in again');
  }
  return session.access_token;
}

/**
 * Fetches every medical record list for the logged-in patient in a single call.
 * The Edge Function returns active rows only, keyed on the session-resolved medical_id.
 */
export async function fetchMedicalData(): Promise<MedicalData> {
  const token = await getAccessToken();

  const response = await fetch(
    `${config.supabaseUrl}/functions/v1/mobile-get-patient-medical-data`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to load medical information');
  }

  return {
    allergies: result.allergies || [],
    emergency_contacts: result.emergency_contacts || [],
    conditions: result.conditions || [],
    surgeries: result.surgeries || [],
  };
}

/**
 * Performs a single insert/update/delete on a medical table.
 * The payload only carries whitelisted fields — never medical_id. The Edge Function
 * stamps medical_id on insert and verifies ownership on update/delete.
 * Returns the persisted record (insert/update) or undefined (delete).
 */
export async function mutateMedicalData(
  table: MedicalTable,
  operation: MedicalOperation,
  payload: Record<string, any> | null,
  id?: string
): Promise<MedicalRecord | undefined> {
  const token = await getAccessToken();

  const response = await fetch(
    `${config.supabaseUrl}/functions/v1/mobile-update-patient-medical-data`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ table, operation, payload, id }),
    }
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Request failed');
  }

  return result.record;
}
