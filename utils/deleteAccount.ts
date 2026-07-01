import { config } from '@/utils/config';
import { Session } from '@/utils/auth';

export interface DeleteAccountResult {
  success: boolean;
  error?: string;
}

/**
 * Request permanent deletion of the currently authenticated account.
 *
 * Works for BOTH account systems and picks the correct auth header:
 *   - patient → Authorization: Bearer <patient session token>
 *   - doctor  → Authorization: Bearer <anon key> + X-Session-Token <doctor token>
 *
 * Never throws — always resolves to a result with a user-friendly error.
 */
export async function deleteAccountService(
  session: Session | null
): Promise<DeleteAccountResult> {
  if (!session?.access_token) {
    return { success: false, error: 'You are not logged in. Please log in again.' };
  }

  // Receptionists use the same account system (users / user_sessions) as
  // doctors, so they delete via the doctor path.
  const userType: 'patient' | 'doctor' =
    session.user_type === 'doctor' || session.user_type === 'receptionist'
      ? 'doctor'
      : 'patient';

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userType === 'doctor') {
    headers['Authorization'] = `Bearer ${config.supabaseAnonKey}`;
    headers['X-Session-Token'] = session.access_token;
  } else {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  try {
    const response = await fetch(
      `${config.supabaseUrl}/functions/v1/mobile-delete-account`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ userType }),
      }
    );

    let result: DeleteAccountResult = { success: false };
    try {
      result = await response.json();
    } catch {
      return { success: false, error: 'Unexpected server response. Please try again.' };
    }

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'We couldn’t complete account deletion. Please try again.',
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
    };
  }
}
