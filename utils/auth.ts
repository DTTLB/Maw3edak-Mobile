import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { secureGet, secureSet, secureRemove } from './secureStorage';

const SESSION_KEY = 'supabase_session';

/**
 * Read the stored session string, transparently handling encryption and a
 * one-time migration of pre-existing plaintext sessions.
 *
 * Legacy sessions were stored as raw JSON (starting with '{') in AsyncStorage.
 * The first time we see one, we re-persist it encrypted so already-logged-in
 * users are not signed out by the upgrade.
 */
const readSessionString = async (): Promise<string | null> => {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (raw === null) return null;

  // Web has no SecureStore backend — values are stored as plaintext.
  if (Platform.OS === 'web') return raw;

  const looksLikePlaintext = raw.trimStart().startsWith('{');
  if (looksLikePlaintext) {
    try {
      await secureSet(SESSION_KEY, raw);
      console.log('🔐 Migrated plaintext session to encrypted storage');
    } catch (e) {
      console.warn('Session migration to encrypted storage failed:', e);
    }
    return raw;
  }

  return await secureGet(SESSION_KEY);
};

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_type?: 'patient' | 'doctor' | 'receptionist';
  user: {
    id: string;
    email: string;
    phone: string;
    user_id?: string;
    // For doctors this is their own global_id. For receptionists it is the
    // INJECTED global_id of the currently-active assigned doctor, so all
    // existing doctor screens/endpoints keep working unchanged.
    global_id?: string;
    role?: string;
    // Receptionist-only context (additive; undefined for doctors/patients).
    realUserId?: string;
    activeDoctorGlobalId?: string;
    allowedDoctors?: Array<{
      doctor_id: string;
      doctor_global_id: string;
      doctor_name: string;
      email?: string;
      specialization?: string | null;
    }>;
    [key: string]: any;
  };
  patient?: {
    id: string;
    medical_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    date_of_birth: string | null;
    gender: string | null;
    blood_type: string | null;
    address: string | null;
    profile_image: string | null;
    [key: string]: any;
  };
}

export const saveSession = async (session: Session): Promise<void> => {
  try {
    console.log('💾 SAVING SESSION:', {
      hasAccessToken: !!session.access_token,
      tokenLength: session.access_token?.length || 0,
      tokenPreview: session.access_token ? session.access_token.substring(0, 10) + '...' : 'MISSING',
      userType: session.user_type || 'unknown',
      hasPatient: !!session.patient,
      patientId: session.patient?.id,
      globalId: session.user?.global_id,
    });
    await secureSet(SESSION_KEY, JSON.stringify(session));
    console.log('✅ SESSION SAVED SUCCESSFULLY (encrypted)');
  } catch (error) {
    console.error('❌ Error saving session:', error);
    throw error;
  }
};

export const getSession = async (): Promise<Session | null> => {
  try {
    const sessionData = await readSessionString();
    if (!sessionData) {
      console.log('📭 No session data in storage');
      return null;
    }

    const session: Session = JSON.parse(sessionData);
    console.log('📬 LOADING SESSION:', {
      hasAccessToken: !!session.access_token,
      tokenLength: session.access_token?.length || 0,
      tokenPreview: session.access_token ? session.access_token.substring(0, 10) + '...' : 'MISSING',
      userType: session.user_type || 'unknown',
      hasPatient: !!session.patient,
      patientId: session.patient?.id,
      globalId: session.user?.global_id,
      expiresAt: session.expires_at,
    });

    if (session.expires_at && Date.now() / 1000 > session.expires_at) {
      console.log('⏰ Session expired, clearing');
      await clearSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('❌ Error getting session:', error);
    return null;
  }
};

export const clearSession = async (): Promise<void> => {
  try {
    await secureRemove(SESSION_KEY);
  } catch (error) {
    console.error('Error clearing session:', error);
    throw error;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getSession();
  return session !== null;
};

export const handleTokenExpiration = async (error: any, router?: any): Promise<boolean> => {
  const errorMessage = typeof error === 'string' ? error : error?.message || '';
  const isTokenExpired = errorMessage.toLowerCase().includes('token has expired') ||
                         errorMessage.toLowerCase().includes('token expired') ||
                         errorMessage.toLowerCase().includes('invalid or expired token');

  if (isTokenExpired) {
    console.log('🔒 Token expired - logging out user');
    await clearSession();

    if (router) {
      router.replace('/login');
    }

    return true;
  }

  return false;
};
