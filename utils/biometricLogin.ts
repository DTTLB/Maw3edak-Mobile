import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { secureGet, secureSet, secureRemove } from './secureStorage';
import type { Session } from './auth';

/**
 * "Log in with Face ID / fingerprint" support.
 *
 * On a successful manual login we stash the encrypted session under a SEPARATE
 * key (`biometric_login_session`) that the normal logout does NOT clear. The
 * login screens can then offer a biometric button that restores that session
 * without the user re-typing credentials — surviving an explicit logout.
 *
 * The remembered session is encrypted at rest via the same LargeSecureStore
 * helper used for the active session. The button is only OFFERED when the user
 * has opted into biometrics in Settings (the existing `biometric_enabled` /
 * `doctor_biometric_enabled` flags), so this never silently activates.
 */

const REMEMBERED_KEY = 'biometric_login_session';

const optInFlagKey = (userType: 'patient' | 'doctor') =>
  userType === 'doctor' ? 'doctor_biometric_enabled' : 'biometric_enabled';

/** Persist a session for biometric re-login. Survives logout. */
export async function rememberBiometricSession(session: Session): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await secureSet(REMEMBERED_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('Failed to remember biometric session:', e);
  }
}

export async function getRememberedBiometricSession(): Promise<Session | null> {
  if (Platform.OS === 'web') return null;
  try {
    const raw = await secureGet(REMEMBERED_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

/** Forget the remembered account (the login-screen "use a different account"). */
export async function clearRememberedBiometricSession(): Promise<void> {
  await secureRemove(REMEMBERED_KEY);
}

export type BiometricKind = 'face' | 'fingerprint' | 'generic';

export interface BiometricLoginAvailability {
  canUse: boolean;
  kind: BiometricKind;
  userType?: 'patient' | 'doctor';
  displayName?: string;
}

const UNAVAILABLE: BiometricLoginAvailability = { canUse: false, kind: 'generic' };

/**
 * Whether to show the "Log in with Face ID" button for the given login screen.
 * Requires: a remembered session of the matching user type, the user opted into
 * biometrics in Settings, and the device has enrolled biometric hardware.
 */
export async function getBiometricLoginAvailability(
  expected: 'patient' | 'doctor'
): Promise<BiometricLoginAvailability> {
  if (Platform.OS === 'web') return UNAVAILABLE;

  const session = await getRememberedBiometricSession();
  if (!session || session.user_type !== expected) return UNAVAILABLE;

  const optedIn = (await SecureStore.getItemAsync(optInFlagKey(expected))) === 'true';
  if (!optedIn) return UNAVAILABLE;

  const [hasHardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  if (!hasHardware || !enrolled) return UNAVAILABLE;

  const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const kind: BiometricKind = supported.includes(
    LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
  )
    ? 'face'
    : supported.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
    ? 'fingerprint'
    : 'generic';

  const displayName =
    session.patient?.first_name ||
    (session.user as any)?.first_name ||
    (session.user as any)?.name ||
    session.user?.email;

  return { canUse: true, kind, userType: expected, displayName };
}

export interface BiometricLoginResult {
  /** Native prompt succeeded and a usable session was restored. */
  success: boolean;
  /** The native prompt was cancelled or failed. */
  cancelled?: boolean;
  /** A session was remembered but its token has expired — manual login needed. */
  expired?: boolean;
  session?: Session;
}

/**
 * Run the native biometric prompt and, on success, return the remembered
 * session (unless it has expired).
 */
export async function authenticateForBiometricLogin(labels: {
  promptMessage: string;
  cancelLabel: string;
  fallbackLabel: string;
}): Promise<BiometricLoginResult> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: labels.promptMessage,
    cancelLabel: labels.cancelLabel,
    fallbackLabel: labels.fallbackLabel,
    disableDeviceFallback: false,
  });

  if (!result.success) {
    return { success: false, cancelled: true };
  }

  const session = await getRememberedBiometricSession();
  if (!session) {
    return { success: false };
  }

  // A stored token past its expiry can't be used — force manual re-login.
  if (session.expires_at && Date.now() / 1000 > session.expires_at) {
    await clearRememberedBiometricSession();
    return { success: false, expired: true };
  }

  return { success: true, session };
}
