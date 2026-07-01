import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, ShieldAlert, Eye, EyeOff, Check, X, LogOut } from 'lucide-react-native';
import { validatePassword, type PasswordStrength } from '@/utils/validation';
import { saveSession } from '@/utils/auth';
import { rememberBiometricSession } from '@/utils/biometricLogin';
import { useAuth } from '@/contexts/AuthContext';
import { config } from '@/utils/config';

type LoginMethod = 'medical_id' | 'mobile';

/**
 * First-login / forced password change screen.
 *
 * Reached only when mobile-patient-login returns code PASSWORD_CHANGE_REQUIRED
 * (the patient still holds an auto-generated temporary password). The patient is
 * NOT logged in at this point — no session exists — so the only ways out are:
 *   - successfully change the password (then we log them in for real), or
 *   - log out (back to the login screen).
 * The hardware Back button is intercepted so the patient cannot slip past the
 * gate. All other patient screens/tabs/biometrics remain unreachable because no
 * session is ever stored until the change succeeds.
 */
export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { refreshSession } = useAuth();
  const params = useLocalSearchParams<{
    patientId?: string;
    medicalId?: string;
    mobileNumber?: string;
    loginMethod?: LoginMethod;
    tempPassword?: string;
  }>();

  const patientId = params.patientId ?? '';
  const medicalId = params.medicalId ?? '';
  const mobileNumber = params.mobileNumber ?? '';
  const loginMethod: LoginMethod = params.loginMethod === 'mobile' ? 'mobile' : 'medical_id';
  // The patient already authenticated with the temporary password on the login
  // screen; we carry it forward so this screen only needs the NEW password. The
  // backend still verifies it as `currentPassword`, so a patientId alone cannot
  // be used to reset someone's password.
  const tempPassword = params.tempPassword ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: 'Weak',
    isValid: false,
  });

  // Block the Android hardware back button while the gate is active.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, [])
  );

  const handleNewPasswordChange = (text: string) => {
    setNewPassword(text);
    setError('');
    setPasswordStrength(validatePassword(text));
  };

  const getStrengthColor = () => {
    switch (passwordStrength.label) {
      case 'Weak':
        return '#FF6F61';
      case 'Medium':
        return '#f59e0b';
      case 'Strong':
        return '#15C2B0';
      default:
        return '#9ca3af';
    }
  };

  const getStrengthWidth = () => {
    switch (passwordStrength.score) {
      case 1:
        return '33%';
      case 2:
        return '66%';
      case 3:
        return '100%';
      default:
        return '0%';
    }
  };

  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

  const handleLogout = () => {
    // No session was ever stored, so "log out" is simply returning to login.
    router.replace('/(auth)/patient-login');
  };

  // After the password is changed, log the patient in for real so they land on
  // Home with a valid session. If 2FA gets in the way (unexpected for a brand
  // new account) we fall back to the login screen with the medical ID prefilled.
  const loginAfterChange = async () => {
    const requestBody =
      loginMethod === 'medical_id'
        ? { medicalId: medicalId.trim(), password: newPassword.trim() }
        : { mobileNumber: mobileNumber.trim(), password: newPassword.trim() };

    const response = await fetch(`${config.supabaseUrl}/functions/v1/mobile-patient-login`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (response.ok && data.session && data.user) {
      const newSession = {
        access_token: data.session.token,
        refresh_token: data.session.refresh_token || '',
        expires_at: data.session.expires_at || 0,
        user_type: 'patient' as const,
        user: data.user,
        patient: data.patient,
      };
      await saveSession(newSession);
      await rememberBiometricSession(newSession);
      await refreshSession();
      router.replace('/(tabs)');
      return;
    }

    // Could not auto-login (e.g. 2FA enabled). Send them to login to finish.
    router.replace({
      pathname: '/(auth)/patient-login',
      params: medicalId ? { medicalId } : {},
    });
  };

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      setError(t('auth.errorFillPasswordFields'));
      return;
    }
    if (!passwordStrength.isValid) {
      setError(t('auth.errorPasswordComplexity'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.errorPasswordMismatch'));
      return;
    }
    if (tempPassword && newPassword === tempPassword) {
      setError(t('auth.errorSameAsCurrent'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${config.supabaseUrl}/functions/v1/mobile-change-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          currentPassword: tempPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await loginAfterChange();
        return;
      }

      if (data.code === 'TEMP_PASSWORD_EXPIRED') {
        setError(t('auth.errorTempPasswordExpired'));
      } else if (data.error === 'New password must be different from your current password') {
        setError(t('auth.errorSameAsCurrent'));
      } else {
        setError(data.error || t('auth.errorGeneric'));
      }
    } catch (err: any) {
      console.error('Change password error:', err);
      setError(err?.message || t('auth.errorNetwork'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <ShieldAlert size={44} color="#15C2B0" strokeWidth={2} />
            </View>
            <Text style={styles.title}>{t('auth.changePasswordTitle')}</Text>
            <Text style={styles.subtitle}>{t('auth.changePasswordSubtitle')}</Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.newPassword')}</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.newPasswordPlaceholder')}
                  value={newPassword}
                  onChangeText={handleNewPasswordChange}
                  secureTextEntry={!showNew}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="none"
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeIcon}>
                  {showNew ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
                </TouchableOpacity>
              </View>

              {newPassword ? (
                <>
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBar}>
                      <View
                        style={[
                          styles.strengthFill,
                          { width: getStrengthWidth(), backgroundColor: getStrengthColor() },
                        ]}
                      />
                    </View>
                    <Text style={[styles.strengthLabel, { color: getStrengthColor() }]}>
                      {t(`auth.passwordStrength${passwordStrength.label}`)}
                    </Text>
                  </View>

                  <View style={styles.requirementsContainer}>
                    <Text style={styles.requirementsTitle}>{t('auth.passwordRequirementsTitle')}</Text>
                    <View style={styles.requirementsList}>
                      {[
                        { ok: hasMinLength, key: 'reqMinLength' },
                        { ok: hasUpperCase, key: 'reqUpperCase' },
                        { ok: hasLowerCase, key: 'reqLowerCase' },
                        { ok: hasNumber, key: 'reqNumber' },
                        { ok: hasSpecialChar, key: 'reqSpecialChar' },
                      ].map(({ ok, key }) => (
                        <View style={styles.requirementItem} key={key}>
                          {ok ? <Check size={16} color="#15C2B0" /> : <X size={16} color="#FF6F61" />}
                          <Text style={[styles.requirementText, { color: ok ? '#15C2B0' : '#6b7280' }]}>
                            {t(`auth.${key}`)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.confirmNewPassword')}</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.confirmNewPasswordPlaceholder')}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setError('');
                  }}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="none"
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
                  {showConfirm ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.disabledButton]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <LinearGradient colors={['#56C6C8', '#69C7F0']} style={styles.submitGradient}>
                <Text style={styles.submitText}>
                  {isLoading ? t('auth.changingPassword') : t('auth.changePasswordButton')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} disabled={isLoading}>
              <LogOut size={18} color="#6b7280" strokeWidth={2} />
              <Text style={styles.logoutText}>{t('auth.logout')}</Text>
            </TouchableOpacity>
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
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: '#E4F8F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  errorContainer: {
    backgroundColor: '#FFEDEB',
    padding: 16,
    borderRadius: 12,
  },
  errorText: {
    color: '#FF6F61',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  eyeIcon: {
    padding: 8,
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  requirementsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  requirementsList: {
    gap: 6,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 13,
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#15C2B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '600',
  },
});
