import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Lock, User, Eye, EyeOff, ArrowLeft, Phone, ShieldCheck, Fingerprint, ScanFace } from 'lucide-react-native';
import { saveSession } from '@/utils/auth';
import {
  getBiometricLoginAvailability,
  authenticateForBiometricLogin,
  rememberBiometricSession,
  clearRememberedBiometricSession,
  type BiometricLoginAvailability,
} from '@/utils/biometricLogin';
import { useAuth } from '@/contexts/AuthContext';
import { config } from '@/utils/config';
import OtpInput from '@/components/OtpInput';

type LoginMethod = 'medical_id' | 'mobile';

export default function PatientLoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { refreshSession } = useAuth();
  const { medicalId: paramMedicalId } = useLocalSearchParams<{ medicalId?: string }>();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('medical_id');
  const [medicalId, setMedicalId] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordInputRef = useRef<TextInput>(null);

  // "Log in with Face ID" — available only if a session was remembered and the
  // user opted into biometrics in Settings.
  const [biometric, setBiometric] = useState<BiometricLoginAvailability>({ canUse: false, kind: 'generic' });
  const [biometricLoading, setBiometricLoading] = useState(false);

  // Two-factor step (shown after a correct password when 2FA is enabled)
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [pendingToken, setPendingToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const codeInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (paramMedicalId) {
      setMedicalId(paramMedicalId);
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 300);
    } else {
      setMedicalId((prev) => (prev ? prev : 'MED-'));
    }
  }, [paramMedicalId]);

  useEffect(() => {
    let active = true;
    getBiometricLoginAvailability('patient').then((a) => {
      if (active) setBiometric(a);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleMedicalIdChange = (text: string) => {
    if (text.startsWith('MED-')) {
      setMedicalId(text.toUpperCase());
    } else if (text.length < 4) {
      setMedicalId('MED-');
    } else {
      setMedicalId('MED-' + text.slice(4).toUpperCase());
    }
  };

  // Shared post-authentication flow: persist the session, refresh auth context,
  // register the device push token, then navigate into the app. Used by both the
  // normal login path and the 2FA verification path.
  const completeLogin = async (data: any) => {
    console.log('=== LOGIN SUCCESS ===');
    console.log('Patient ID:', data.patient?.id);
    console.log('User ID:', data.user?.id);

    const newSession = {
      access_token: data.session.token,
      refresh_token: data.session.refresh_token || '',
      expires_at: data.session.expires_at || 0,
      user_type: 'patient' as const,
      user: data.user,
      patient: data.patient,
    };
    await saveSession(newSession);
    // Remember this session for "Log in with Face ID" on the next visit.
    // It is only surfaced if the user has enabled biometrics in Settings.
    await rememberBiometricSession(newSession);
    console.log('Session saved successfully');

    await refreshSession();
    console.log('Auth context refreshed');

    // Notification permission is NOT requested here. It is requested later on
    // the home screen, behind an in-app explanation modal
    // (NotificationPermissionGate), and only after the user opts in.
    router.replace('/(tabs)');
  };

  const handleVerifyCode = async () => {
    const code = twoFactorCode.trim();
    if (!code) {
      setError(t('auth.errorEnterCode'));
      return;
    }

    setError('');
    setIsVerifying(true);

    try {
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-patient-two-factor-login`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pendingToken, code }),
        }
      );

      const data = await response.json();

      if (response.ok && data.session && data.user) {
        await completeLogin(data);
      } else {
        setError(data.error || data.details || t('auth.errorInvalidCode'));
      }
    } catch (err: any) {
      console.error('=== 2FA VERIFY EXCEPTION ===', err);
      setError(err?.message || t('auth.errorNetwork'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancelTwoFactor = () => {
    setTwoFactorRequired(false);
    setPendingToken('');
    setTwoFactorCode('');
    setError('');
  };

  const handleSignIn = async () => {
    if (loginMethod === 'medical_id' && (!medicalId || medicalId === 'MED-')) {
      setError(t('auth.errorEnterMedicalId'));
      return;
    }

    if (loginMethod === 'mobile' && !mobileNumber) {
      setError(t('auth.errorEnterMobile'));
      return;
    }

    if (!password) {
      setError(t('auth.errorEnterPassword'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      console.log('=== PATIENT LOGIN ATTEMPT ===');
      console.log('Login Method:', loginMethod);
      console.log('Medical ID:', medicalId);
      console.log('Mobile Number:', mobileNumber);
      console.log('Supabase URL:', config.supabaseUrl);

      if (!config.supabaseUrl || !config.supabaseAnonKey) {
        throw new Error(t('auth.errorConfigMissing'));
      }

      const requestBody = loginMethod === 'medical_id'
        ? { medicalId: medicalId.trim(), password: password.trim() }
        : { mobileNumber: mobileNumber.trim(), password: password.trim() };

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-patient-login`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));

      // 2FA gate: password was correct but the account has two-factor enabled.
      // Switch to the 6-digit code step instead of completing the login.
      if (response.ok && data.twoFactorRequired && data.pendingToken) {
        console.log('=== 2FA REQUIRED ===');
        setPendingToken(data.pendingToken);
        setTwoFactorRequired(true);
        setTwoFactorCode('');
        setIsLoading(false);
        setTimeout(() => codeInputRef.current?.focus(), 300);
        return;
      }

      // Forced password change: the patient logged in with a correct temporary
      // password and must set a new one before getting a session. Carry the
      // temp password forward so the change screen needs only the new password.
      if (data.code === 'PASSWORD_CHANGE_REQUIRED' && data.patientId) {
        console.log('=== PASSWORD CHANGE REQUIRED ===');
        router.push({
          pathname: '/(auth)/change-password',
          params: {
            patientId: data.patientId,
            medicalId: loginMethod === 'medical_id' ? medicalId.trim() : '',
            mobileNumber: loginMethod === 'mobile' ? mobileNumber.trim() : '',
            loginMethod,
            tempPassword: password.trim(),
          },
        });
        setIsLoading(false);
        return;
      }

      // Temporary password is past its 7-day lifetime — it can no longer be used.
      if (data.code === 'TEMP_PASSWORD_EXPIRED') {
        setError(t('auth.errorTempPasswordExpired'));
        setIsLoading(false);
        return;
      }

      if (response.ok && data.session && data.user) {
        await completeLogin(data);
      } else {
        console.error('=== LOGIN FAILED ===');
        console.error('Response OK:', response.ok);
        console.error('Response status:', response.status);
        console.error('Has Session:', !!data.session);
        console.error('Has User:', !!data.user);
        console.error('Error:', data.error);
        console.error('Full response data:', data);

        const errorMessage = data.code === 'SUBSCRIPTION_EXPIRED'
          ? t('auth.errorSubscriptionExpired')
          : data.error || data.details || t('auth.errorInvalidCredentials');
        setError(errorMessage);
      }
    } catch (error: any) {
      console.error('=== LOGIN EXCEPTION ===');
      console.error('Error:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);

      const errorMessage = error?.message || t('auth.errorNetwork');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (biometricLoading) return;
    setError('');
    setBiometricLoading(true);
    try {
      const promptMessage =
        biometric.kind === 'face'
          ? t('auth.loginWithFaceId')
          : biometric.kind === 'fingerprint'
          ? t('auth.loginWithFingerprint')
          : t('auth.biometricPrompt');

      const result = await authenticateForBiometricLogin({
        promptMessage,
        cancelLabel: t('auth.backToLogin'),
        fallbackLabel: t('auth.usePasscode'),
      });

      if (result.success && result.session) {
        await saveSession(result.session);
        await refreshSession();
        router.replace('/(tabs)');
        return;
      }

      if (result.expired) {
        setBiometric({ canUse: false, kind: 'generic' });
        setError(t('auth.biometricExpired'));
      } else if (!result.cancelled) {
        setError(t('auth.biometricFailed'));
      }
    } catch (err) {
      console.error('Biometric login error:', err);
      setError(t('auth.biometricFailed'));
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleUseDifferentAccount = async () => {
    await clearRememberedBiometricSession();
    setBiometric({ canUse: false, kind: 'generic' });
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  const handleRegister = () => {
    router.push('/(auth)/patient-register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (twoFactorRequired ? handleCancelTwoFactor() : router.back())}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#374151" strokeWidth={2} />
          </TouchableOpacity>

          {twoFactorRequired ? (
            <View style={styles.form}>
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <ShieldCheck size={40} color="#15C2B0" strokeWidth={2} />
                </View>
                <Text style={styles.title}>{t('auth.twoFactorTitle')}</Text>
                <Text style={styles.subtitle}>{t('auth.twoFactorSubtitle')}</Text>
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.verificationCode')}</Text>
                <OtpInput
                  value={twoFactorCode}
                  onChange={(code) => setTwoFactorCode(code)}
                  accentColor="#2D7DD2"
                  hasError={!!error}
                  autoFocus
                />
                <Text style={styles.codeHint}>{t('auth.twoFactorHint')}</Text>
              </View>

              <TouchableOpacity
                style={[styles.signInButton, isVerifying && styles.disabledButton]}
                onPress={handleVerifyCode}
                activeOpacity={0.8}
                disabled={isVerifying}
              >
                <LinearGradient
                  colors={['#56C6C8', '#69C7F0']}
                  style={styles.signInGradient}
                >
                  <Text style={styles.signInText}>{isVerifying ? t('auth.verifying') : t('auth.verify')}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleCancelTwoFactor} style={styles.backToLogin}>
                <Text style={styles.backToLoginText}>{t('auth.backToLogin')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
          <>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Heart size={40} color="#15C2B0" strokeWidth={2} />
            </View>
            <Text style={styles.title}>{t('auth.patientLoginTitle')}</Text>
            <Text style={styles.subtitle}>{t('auth.patientLoginSubtitle')}</Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  loginMethod === 'medical_id' && styles.toggleButtonActive,
                ]}
                onPress={() => setLoginMethod('medical_id')}
                activeOpacity={0.7}
              >
                <User
                  size={18}
                  color={loginMethod === 'medical_id' ? '#ffffff' : '#6b7280'}
                  strokeWidth={2.5}
                />
                <Text
                  style={[
                    styles.toggleButtonText,
                    loginMethod === 'medical_id' && styles.toggleButtonTextActive,
                  ]}
                >
                  {t('auth.medicalId')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  loginMethod === 'mobile' && styles.toggleButtonActive,
                ]}
                onPress={() => setLoginMethod('mobile')}
                activeOpacity={0.7}
              >
                <Phone
                  size={18}
                  color={loginMethod === 'mobile' ? '#ffffff' : '#6b7280'}
                  strokeWidth={2.5}
                />
                <Text
                  style={[
                    styles.toggleButtonText,
                    loginMethod === 'mobile' && styles.toggleButtonTextActive,
                  ]}
                >
                  {t('auth.mobileNumber')}
                </Text>
              </TouchableOpacity>
            </View>

            {loginMethod === 'medical_id' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.medicalId')}</Text>
                <View style={styles.inputContainer}>
                  <User size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="MED-XXXXX"
                    value={medicalId}
                    onChangeText={handleMedicalIdChange}
                    autoCapitalize="characters"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.mobileNumber')}</Text>
                <View style={styles.inputContainer}>
                  <Phone size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.mobileNumberPlaceholder')}
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    keyboardType="phone-pad"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.password')}</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  ref={passwordInputRef}
                  style={styles.input}
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="none"
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  {showPassword ? (
                    <Eye size={20} color="#6b7280" />
                  ) : (
                    <EyeOff size={20} color="#6b7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotPassword}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.signInButton, isLoading && styles.disabledButton]}
              onPress={handleSignIn}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#56C6C8', '#69C7F0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.signInGradient}
              >
                <Text style={styles.signInText}>{isLoading ? t('auth.signingIn') : t('auth.signIn')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {biometric.canUse && (
              <>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>{t('auth.orDivider')}</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={[styles.biometricButton, biometricLoading && styles.disabledButton]}
                  onPress={handleBiometricLogin}
                  activeOpacity={0.8}
                  disabled={biometricLoading}
                >
                  {biometric.kind === 'face' ? (
                    <ScanFace size={22} color="#15C2B0" strokeWidth={2} />
                  ) : (
                    <Fingerprint size={22} color="#15C2B0" strokeWidth={2} />
                  )}
                  <Text style={styles.biometricButtonText}>
                    {biometric.kind === 'face'
                      ? t('auth.loginWithFaceId')
                      : biometric.kind === 'fingerprint'
                      ? t('auth.loginWithFingerprint')
                      : t('auth.loginWithBiometrics')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleUseDifferentAccount} style={styles.differentAccount}>
                  <Text style={styles.differentAccountText}>{t('auth.useDifferentAccount')}</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>{t('auth.noAccount')}</Text>
              <TouchableOpacity onPress={handleRegister}>
                <Text style={styles.registerLink}>{t('auth.registerAsPatient')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#E4F8F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#15C2B0',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  toggleButtonTextActive: {
    color: '#ffffff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: '#111827',
  },
  forgotPassword: {
    fontSize: 14,
    color: '#15C2B0',
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 32,
  },
  signInButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#15C2B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signInGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  signInText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 15,
    color: '#6b7280',
  },
  registerLink: {
    fontSize: 15,
    color: '#15C2B0',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFEDEB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF6F61',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  eyeIcon: {
    padding: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '600',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFB',
    borderWidth: 1.5,
    borderColor: '#15C2B0',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
    marginTop: 16,
  },
  biometricButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#15C2B0',
  },
  differentAccount: {
    marginTop: 16,
    alignItems: 'center',
  },
  differentAccountText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  codeHint: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
  },
  backToLogin: {
    marginTop: 24,
    alignItems: 'center',
  },
  backToLoginText: {
    fontSize: 15,
    color: '#15C2B0',
    fontWeight: '600',
  },
});
