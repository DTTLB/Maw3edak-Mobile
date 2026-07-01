import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, Platform, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Fingerprint, LogOut } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getSession, clearSession } from '@/utils/auth';
import { settingsService } from '@/utils/settingsService';
import { useRouter } from 'expo-router';

// Global flag to track authentication in current app session
let isAuthenticatedInSession = false;

// Export function to reset authentication state (for use after logout)
export const resetBiometricSession = () => {
  console.log('Resetting biometric session flag');
  isAuthenticatedInSession = false;
};

interface BiometricAuthGateProps {
  children: React.ReactNode;
  onAuthComplete: () => void;
}

export function BiometricAuthGate({ children, onAuthComplete }: BiometricAuthGateProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isAuthRequired, setIsAuthRequired] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authFailed, setAuthFailed] = useState(false);
  const authTriggeredRef = useRef(false);

  useEffect(() => {
    checkBiometricRequirement();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        isAuthenticatedInSession = false;
        authTriggeredRef.current = false;
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const checkBiometricRequirement = async () => {
    try {
      // Skip biometric check on web platform
      if (Platform.OS === 'web') {
        setIsCheckingAuth(false);
        setIsAuthRequired(false);
        return;
      }

      // Check if already authenticated in this app session
      if (isAuthenticatedInSession) {
        console.log('✓ Already authenticated in this session, skipping biometric check');
        setIsCheckingAuth(false);
        setIsAuthRequired(false);
        return;
      }

      const session = await getSession();

      console.log('=== BIOMETRIC AUTH GATE: Session Check ===');
      console.log('Session exists:', !!session);
      console.log('Is authenticated in session:', isAuthenticatedInSession);

      if (!session) {
        console.log('No session found, skipping biometric check');
        // Reset the flag if no session (user logged out)
        isAuthenticatedInSession = false;
        setIsCheckingAuth(false);
        setIsAuthRequired(false);
        return;
      }

      // Handle doctor biometric authentication
      console.log('=== BIOMETRIC AUTH GATE: Doctor Check ===');
      console.log('Session user_type:', session.user_type);
      console.log('Session user:', session.user);
      console.log('Is doctor?', session.user_type === 'doctor' && session.user);

      if (session.user_type === 'doctor' && session.user && session.access_token) {
        console.log('Checking doctor biometric settings for user:', session.user.id);
        const biometricEnabled = await SecureStore.getItemAsync('doctor_biometric_enabled');
        console.log('SecureStore doctor_biometric_enabled:', biometricEnabled);

        if (biometricEnabled === 'true') {
          console.log('Getting doctor biometric settings from primary company using global_id...');
          const globalId = session.user.global_id;
          if (globalId) {
            const settings = await settingsService.getPrimarySettings(globalId, 'doctor');
            console.log('Doctor primary settings:', settings);

            if (settings.biometric_login_enabled) {
              console.log('Biometric login enabled in primary company, requiring authentication');
              setIsAuthRequired(true);
            } else {
              console.log('Biometric login disabled in primary company');
              setIsAuthRequired(false);
            }
          } else {
            console.log('No global_id found, falling back to current user settings');
            const settings = await settingsService.getDoctorBiometricSettings(session.user.id, session.access_token);
            console.log('Doctor biometric settings:', settings);

            if (settings.biometric_login_enabled) {
              console.log('Biometric login enabled, requiring authentication');
              setIsAuthRequired(true);
            } else {
              console.log('Biometric login disabled in database');
              setIsAuthRequired(false);
            }
          }
        } else {
          console.log('Biometric not enabled in SecureStore');
          setIsAuthRequired(false);
        }
      }
      // Handle receptionist biometric authentication. Receptionists use the same
      // doctor settings toggle, which sets `doctor_biometric_enabled` only after a
      // successful server persist, so the on-device flag is the source of truth
      // (no network needed to unlock). Mirrors the doctor/patient unlock gate.
      else if (session.user_type === 'receptionist' && session.user) {
        const biometricEnabled = await SecureStore.getItemAsync('doctor_biometric_enabled');
        console.log('Receptionist doctor_biometric_enabled:', biometricEnabled);
        setIsAuthRequired(biometricEnabled === 'true');
      }
      // Handle patient biometric authentication
      else if (session.patient) {
        const biometricEnabled = await SecureStore.getItemAsync('biometric_enabled');

        if (biometricEnabled === 'true') {
          const medicalId = session.patient.medical_id;
          if (medicalId) {
            console.log('Getting patient biometric settings from primary (using medical_id)...');
            const settings = await settingsService.getPrimarySettings('', 'patient', medicalId);
            console.log('Patient primary settings:', settings);

            if (settings.biometric_login_enabled) {
              setIsAuthRequired(true);
            } else {
              setIsAuthRequired(false);
            }
          } else {
            console.log('No medical_id found, falling back to patient_id');
            const settings = await settingsService.getBiometricSettings(session.patient.id);

            if (settings.biometric_login_enabled) {
              setIsAuthRequired(true);
            } else {
              setIsAuthRequired(false);
            }
          }
        } else {
          setIsAuthRequired(false);
        }
      } else {
        setIsAuthRequired(false);
      }
    } catch (error) {
      console.error('Error checking biometric requirement:', error);
      setIsAuthRequired(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogout = useCallback(async () => {
    try {
      // Reset session authentication flag
      isAuthenticatedInSession = false;

      await clearSession();
      await SecureStore.deleteItemAsync('biometric_enabled');
      await SecureStore.deleteItemAsync('doctor_biometric_enabled');

      if (Platform.OS === 'web') {
        window.location.replace('/login');
      } else {
        router.replace('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Reset flag even on error
      isAuthenticatedInSession = false;

      if (Platform.OS === 'web') {
        window.location.replace('/login');
      } else {
        router.replace('/login');
      }
    }
  }, [router]);

  const performBiometricAuth = useCallback(async () => {
    if (isAuthenticating) return;

    setIsAuthenticating(true);
    setAuthFailed(false);

    try {
      if (Platform.OS === 'web') {
        setIsAuthRequired(false);
        setIsAuthenticating(false);
        onAuthComplete();
        return;
      }

      const compatible = await LocalAuthentication.hasHardwareAsync();

      if (!compatible) {
        Alert.alert(
          t('components.authNotAvailableTitle'),
          t('components.authNotAvailableMessage'),
          [{ text: t('common.ok'), onPress: handleLogout }]
        );
        setAuthFailed(true);
        setIsAuthenticating(false);
        return;
      }

      const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();

      if (securityLevel === LocalAuthentication.SecurityLevel.NONE) {
        Alert.alert(
          t('components.authNotSetUpTitle'),
          t('components.authNotSetUpMessage'),
          [{ text: t('common.ok'), onPress: handleLogout }]
        );
        setAuthFailed(true);
        setIsAuthenticating(false);
        return;
      }

      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const hasFaceId = supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
      const hasFingerprint = supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);

      let promptMessage = t('components.unlockApp');
      if (hasFaceId) {
        promptMessage = t('components.unlockWithFaceId');
      } else if (hasFingerprint) {
        promptMessage = t('components.unlockWithFingerprint');
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: t('common.cancel'),
        disableDeviceFallback: false,
        fallbackLabel: t('components.usePasscode'),
        requireConfirmation: false,
      });

      if (result.success) {
        isAuthenticatedInSession = true;
        setIsAuthRequired(false);
        setAuthFailed(false);
        onAuthComplete();
      } else {
        setAuthFailed(true);
        if (result.error === 'lockout' || (result.error as string) === 'lockout_permanent') {
          Alert.alert(
            t('components.tooManyAttemptsTitle'),
            t('components.tooManyAttemptsMessage'),
            [{ text: t('common.ok') }]
          );
        }
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      setAuthFailed(true);
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating, onAuthComplete, handleLogout, t]);

  useEffect(() => {
    if (isAuthRequired && !authTriggeredRef.current) {
      authTriggeredRef.current = true;
      // Small delay to ensure UI is mounted before triggering native prompt
      setTimeout(() => {
        performBiometricAuth();
      }, 300);
    }
  }, [isAuthRequired, performBiometricAuth]);

  if (isCheckingAuth) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Image
            source={require('@/assets/images/Logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isAuthRequired) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.gradient}>
          <View style={styles.content}>
            <Image
              source={require('@/assets/images/Logo.png')}
              style={styles.authLogoImage}
              resizeMode="contain"
            />

            <Text style={styles.title}>{t('components.unlockApp')}</Text>
            <Text style={styles.subtitle}>
              {isAuthenticating
                ? t('components.authenticating')
                : authFailed
                ? t('components.authFailed')
                : t('components.unlockSubtitle')}
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={performBiometricAuth}
                disabled={isAuthenticating}
              >
                <Fingerprint size={24} color="#10b981" strokeWidth={2} />
                <Text style={styles.retryButtonText}>
                  {authFailed ? t('components.tryAgain') : t('components.authenticate')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                disabled={isAuthenticating}
              >
                <LogOut size={20} color="#EF4444" strokeWidth={2} />
                <Text style={styles.logoutButtonText}>{t('common.logout')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  gradient: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logoImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  authLogoImage: {
    width: 180,
    height: 180,
    marginBottom: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10b981',
    gap: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
