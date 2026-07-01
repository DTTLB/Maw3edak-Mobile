import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Stethoscope, Lock, Mail, Eye, EyeOff, ArrowLeft, Building2, ChevronRight, ShieldCheck, Fingerprint, ScanFace } from 'lucide-react-native';
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

interface Company {
  company_id: string;
  company_name: string;
  company_slug: string;
  user_id: string;
  role: string;
}

export default function DoctorLoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showCompanySelection, setShowCompanySelection] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [fcmToken] = useState<string | null>(null);
  const [deviceInfo] = useState<any>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // "Log in with Face ID" — available only if a session was remembered and the
  // doctor opted into biometrics in Settings.
  const [biometric, setBiometric] = useState<BiometricLoginAvailability>({ canUse: false, kind: 'generic' });
  const [biometricLoading, setBiometricLoading] = useState(false);

  // Two-factor verification step
  const [show2FA, setShow2FA] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [twoFACode, setTwoFACode] = useState('');
  // Proof that 2FA already passed this login, threaded into the clinic-pick call.
  const [twoFactorProofToken, setTwoFactorProofToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getBiometricLoginAvailability('doctor').then((a) => {
      if (active) setBiometric(a);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSignIn = async (selectedCompanyId?: string) => {
    if (!email) {
      setError(t('auth.errorEnterEmail'));
      return;
    }

    if (!password) {
      setError(t('auth.errorEnterPassword'));
      return;
    }

    // Fresh email/password submit (not a clinic pick) — drop any stale 2FA proof.
    if (!selectedCompanyId) setTwoFactorProofToken(null);

    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting doctor login with email:', email.trim());

      // Notification permission is NOT requested here. It is requested later on
      // the home screen, behind an in-app explanation modal
      // (NotificationPermissionGate), and only after the user opts in.
      const tokenToUse = fcmToken;
      const infoToUse = deviceInfo;

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/doctor-mobile-login`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password.trim(),
            company_id: selectedCompanyId || undefined,
            twoFactorToken: twoFactorProofToken || undefined,
            fcm_token: tokenToUse,
            ...(infoToUse || {}),
          }),
        }
      );

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.requiresCompanySelection && data.companies) {
        console.log('=== MULTIPLE CLINICS FOUND ===');
        console.log('Number of clinics:', data.companies.length);
        setCompanies(data.companies);
        setShowCompanySelection(true);
        setIsLoading(false);
        return;
      }

      // 2FA enabled for this doctor — no session yet, ask for the code.
      if (data.twoFactorRequired && data.pendingToken) {
        console.log('=== 2FA REQUIRED ===');
        setPendingToken(data.pendingToken);
        setTwoFACode('');
        setShowCompanySelection(false);
        setShow2FA(true);
        setIsLoading(false);
        return;
      }

      if (response.ok && data.session && data.user) {
        console.log('=== DOCTOR LOGIN SUCCESS ===');
        console.log('User ID:', data.user?.id);
        console.log('Company ID:', data.user?.company_id);

        await completeLogin(data, tokenToUse);
      } else {
        setError(data.error || t('auth.errorInvalidCredentials'));
        setSelectedCompanyId(null);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(t('auth.errorGeneric'));
      setSelectedCompanyId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const completeLogin = async (data: any, tokenToUse: string | null) => {
    const newSession = {
      access_token: data.session.token,
      refresh_token: data.session.refresh_token || '',
      expires_at: data.session.expires_at || 0,
      user_type: 'doctor' as const,
      user: data.user,
    };
    await saveSession(newSession);
    // Remember this session for "Log in with Face ID" on the next visit.
    // It is only surfaced if the doctor has enabled biometrics in Settings.
    await rememberBiometricSession(newSession);
    console.log('Session saved successfully');

    await refreshSession();
    console.log('Auth context refreshed');

    if (tokenToUse) {
      console.log('✅ Device token registered during login');
    } else {
      console.log('⚠️ No device token registered - notifications may not work');
    }

    router.replace('/(doctor-tabs)');
  };

  const handle2FALogin = async () => {
    if (twoFACode.trim().length === 0) {
      setError(t('auth.errorEnterCode'));
      return;
    }
    if (!pendingToken) {
      setError(t('auth.errorGeneric'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-doctor-2fa-login`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pendingToken,
            code: twoFACode.trim(),
            fcm_token: fcmToken,
            ...(deviceInfo || {}),
          }),
        }
      );

      const data = await response.json();
      console.log('2FA login response status:', response.status);

      // 2FA passed, but the doctor still needs to pick a clinic.
      if (data.requiresCompanySelection && data.companies) {
        console.log('=== 2FA OK - CLINIC SELECTION ===');
        setTwoFactorProofToken(data.twoFactorToken || null);
        setCompanies(data.companies);
        setShow2FA(false);
        setShowCompanySelection(true);
        setTwoFACode('');
        setIsLoading(false);
        return;
      }

      if (response.ok && data.session && data.user) {
        console.log('=== 2FA LOGIN SUCCESS ===');
        await completeLogin(data, fcmToken);
      } else {
        setError(data.error || t('auth.errorInvalidCode'));
      }
    } catch (err) {
      console.error('2FA login error:', err);
      setError(t('auth.errorGeneric'));
    } finally {
      setIsLoading(false);
    }
  };

  const cancel2FA = () => {
    setShow2FA(false);
    setPendingToken(null);
    setTwoFACode('');
    setError('');
    setSelectedCompanyId(null);
  };

  const handleCompanySelect = async (company: Company) => {
    console.log('=== CLINIC SELECTED ===');
    console.log('Clinic Name:', company.company_name);
    console.log('Clinic ID:', company.company_id);
    console.log('User Role:', company.role);
    setSelectedCompanyId(company.company_id);
    await handleSignIn(company.company_id);
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
        router.replace('/(doctor-tabs)');
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

  if (show2FA) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={cancel2FA}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <ArrowLeft size={24} color="#374151" strokeWidth={2} />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <ShieldCheck size={40} color="#2D7DD2" strokeWidth={2} />
              </View>
              <Text style={styles.title}>{t('auth.twoFactorTitle')}</Text>
              <Text style={styles.subtitle}>{t('auth.twoFactorSubtitle')}</Text>
            </View>

            <View style={styles.form}>
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.verificationCode')}</Text>
                <OtpInput
                  value={twoFACode}
                  onChange={(code) => setTwoFACode(code)}
                  accentColor="#2D7DD2"
                  hasError={!!error}
                  autoFocus
                />
                <Text style={styles.helperText}>{t('auth.twoFactorHint')}</Text>
              </View>

              <TouchableOpacity
                style={[styles.signInButton, isLoading && styles.disabledButton]}
                onPress={handle2FALogin}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#56C6C8', '#69C7F0']}
                  style={styles.signInGradient}
                >
                  <Text style={styles.signInText}>
                    {isLoading ? t('auth.verifying') : t('auth.verify')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (showCompanySelection) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setShowCompanySelection(false);
              setSelectedCompanyId(null);
            }}
            activeOpacity={0.7}
            disabled={selectedCompanyId !== null}
          >
            <ArrowLeft
              size={24}
              color={selectedCompanyId !== null ? "#9ca3af" : "#374151"}
              strokeWidth={2}
            />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Building2 size={40} color="#2D7DD2" strokeWidth={2} />
            </View>
            <Text style={styles.title}>{t('auth.selectClinicTitle')}</Text>
            <Text style={styles.subtitle}>{t('auth.selectClinicSubtitle')}</Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.companiesContainer}>
            {companies.map((company) => {
              const isSelected = selectedCompanyId === company.company_id;
              return (
                <TouchableOpacity
                  key={company.company_id}
                  style={[
                    styles.companyCard,
                    isSelected && styles.companyCardSelected,
                  ]}
                  onPress={() => handleCompanySelect(company)}
                  activeOpacity={0.7}
                  disabled={selectedCompanyId !== null}
                >
                  <View style={styles.companyCardContent}>
                    <View style={styles.companyIconContainer}>
                      <Building2 size={24} color="#2D7DD2" strokeWidth={2} />
                    </View>
                    <View style={styles.companyInfo}>
                      <Text style={styles.companyName}>{company.company_name}</Text>
                      <Text style={styles.companyRole}>{company.role}</Text>
                    </View>
                    {isSelected ? (
                      <ActivityIndicator size="small" color="#2D7DD2" />
                    ) : (
                      <ChevronRight size={20} color="#9ca3af" strokeWidth={2} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#374151" strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Stethoscope size={40} color="#2D7DD2" strokeWidth={2} />
            </View>
            <Text style={styles.title}>{t('auth.doctorLoginTitle')}</Text>
            <Text style={styles.subtitle}>{t('auth.doctorLoginSubtitle')}</Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.email')}</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  placeholderTextColor="#9ca3af"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                />
              </View>
            </View>

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
                  returnKeyType="go"
                  onSubmitEditing={() => handleSignIn()}
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

            <TouchableOpacity
              style={[styles.signInButton, isLoading && styles.disabledButton]}
              onPress={() => handleSignIn()}
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
                    <ScanFace size={22} color="#2D7DD2" strokeWidth={2} />
                  ) : (
                    <Fingerprint size={22} color="#2D7DD2" strokeWidth={2} />
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
          </View>
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
    backgroundColor: '#EAF3FC',
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
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#2D7DD2',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
    marginTop: 16,
  },
  biometricButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D7DD2',
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
  codeInputField: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 4,
  },
  helperText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
  },
  signInButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#2D7DD2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 12,
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
  companiesContainer: {
    gap: 16,
    paddingTop: 8,
  },
  companyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  companyCardSelected: {
    borderColor: '#2D7DD2',
    borderWidth: 2,
    backgroundColor: '#EAF3FC',
  },
  companyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  companyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EAF3FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyInfo: {
    flex: 1,
    gap: 4,
  },
  companyName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  companyRole: {
    fontSize: 14,
    color: '#6b7280',
  },
});
