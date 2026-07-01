import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ClipboardList, Lock, Mail, Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { saveSession } from '@/utils/auth';
import { useAuth } from '@/contexts/AuthContext';
import { config } from '@/utils/config';
import OtpInput from '@/components/OtpInput';

export default function ReceptionistLoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordInputRef = useRef<TextInput>(null);

  // Two-factor step (only when the receptionist enrolled 2FA in settings).
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');

  const submitLogin = async (code?: string) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/business-mobile-login`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password.trim(),
            ...(code ? { code } : {}),
          }),
        }
      );

      const data = await response.json();

      // 2FA enrolled — prompt for the code, then resubmit.
      if (data.twoFactorRequired) {
        setShow2FA(true);
        setTwoFACode('');
        setIsLoading(false);
        return;
      }

      if (response.ok && data.session && data.user) {
        // `data.user.global_id` is the receptionist's own user_id — the
        // resolution key every doctor screen/endpoint uses (see backend).
        await saveSession({
          access_token: data.session.token,
          refresh_token: data.session.refresh_token || '',
          expires_at: data.session.expires_at || 0,
          user_type: 'receptionist',
          user: data.user,
        });
        await refreshSession();
        router.replace('/(reception-tabs)' as any);
      } else if (data.code === 'NO_DOCTOR_ASSIGNED') {
        setError(t('auth.errorNoDoctorAssigned'));
      } else if (data.code === 'INVALID_2FA') {
        setError(t('auth.errorInvalidCode'));
      } else {
        setError(data.error || t('auth.errorInvalidCredentials'));
      }
    } catch (err) {
      console.error('Receptionist login error:', err);
      setError(t('auth.errorGeneric'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email) {
      setError(t('auth.errorEnterEmail'));
      return;
    }
    if (!password) {
      setError(t('auth.errorEnterPassword'));
      return;
    }
    await submitLogin();
  };

  const handle2FASubmit = async () => {
    if (twoFACode.trim().length === 0) {
      setError(t('auth.errorEnterCode'));
      return;
    }
    await submitLogin(twoFACode.trim());
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
              onPress={() => {
                setShow2FA(false);
                setTwoFACode('');
                setError('');
              }}
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
              </View>

              <TouchableOpacity
                style={[styles.signInButton, isLoading && styles.disabledButton]}
                onPress={handle2FASubmit}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#56C6C8', '#69C7F0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.signInGradient}
                >
                  <Text style={styles.signInText}>{isLoading ? t('auth.verifying') : t('auth.verify')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
              <ClipboardList size={40} color="#2D7DD2" strokeWidth={2} />
            </View>
            <Text style={styles.title}>{t('auth.receptionistLoginTitle')}</Text>
            <Text style={styles.subtitle}>{t('auth.receptionistLoginSubtitle')}</Text>
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
                  onSubmitEditing={handleSignIn}
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
});
