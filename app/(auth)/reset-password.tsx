import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Eye, EyeOff, ArrowLeft, Check, X } from 'lucide-react-native';
import { validatePassword, type PasswordStrength } from '@/utils/validation';
import { config } from '@/utils/config';
import { useTranslation } from 'react-i18next';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { medicalId, phone, otpCode } = useLocalSearchParams<{ medicalId: string; phone: string; otpCode: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: 'Weak',
    isValid: false,
  });

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setError('');
    const strength = validatePassword(text);
    setPasswordStrength(strength);
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

  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      setError(t('resetPassword.errorFillFields'));
      return;
    }

    if (!passwordStrength.isValid) {
      setError(t('resetPassword.errorComplexity'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('resetPassword.errorMismatch'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile_otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
          },
          body: JSON.stringify({
            action: 'reset',
            medicalId,
            password,
            phone,
            otpCode,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        router.replace({
          pathname: '/(auth)/patient-login',
          params: { medicalId: medicalId },
        });
      } else {
        setError(result.error || t('resetPassword.errorFailed'));
      }
    } catch (err) {
      console.error('Error:', err);
      setError(t('resetPassword.errorGeneric'));
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#2D7DD2" strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Lock size={48} color="#2D7DD2" strokeWidth={2} />
            </View>
            <Text style={styles.title}>{t('resetPassword.title')}</Text>
            <Text style={styles.subtitle}>
              {t('resetPassword.subtitle')}
            </Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('resetPassword.newPassword')}</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('resetPassword.newPasswordPlaceholder')}
                  value={password}
                  onChangeText={handlePasswordChange}
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
                    <EyeOff size={20} color="#6b7280" />
                  ) : (
                    <Eye size={20} color="#6b7280" />
                  )}
                </TouchableOpacity>
              </View>

              {password ? (
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
                      {t(`resetPassword.strength${passwordStrength.label}`)}
                    </Text>
                  </View>

                  <View style={styles.requirementsContainer}>
                    <Text style={styles.requirementsTitle}>{t('resetPassword.requirementsTitle')}</Text>
                    <View style={styles.requirementsList}>
                      <View style={styles.requirementItem}>
                        {hasMinLength ? (
                          <Check size={16} color="#15C2B0" />
                        ) : (
                          <X size={16} color="#FF6F61" />
                        )}
                        <Text
                          style={[
                            styles.requirementText,
                            { color: hasMinLength ? '#15C2B0' : '#6b7280' },
                          ]}
                        >
                          {t('resetPassword.reqMinLength')}
                        </Text>
                      </View>
                      <View style={styles.requirementItem}>
                        {hasUpperCase ? (
                          <Check size={16} color="#15C2B0" />
                        ) : (
                          <X size={16} color="#FF6F61" />
                        )}
                        <Text
                          style={[
                            styles.requirementText,
                            { color: hasUpperCase ? '#15C2B0' : '#6b7280' },
                          ]}
                        >
                          {t('resetPassword.reqUpperCase')}
                        </Text>
                      </View>
                      <View style={styles.requirementItem}>
                        {hasLowerCase ? (
                          <Check size={16} color="#15C2B0" />
                        ) : (
                          <X size={16} color="#FF6F61" />
                        )}
                        <Text
                          style={[
                            styles.requirementText,
                            { color: hasLowerCase ? '#15C2B0' : '#6b7280' },
                          ]}
                        >
                          {t('resetPassword.reqLowerCase')}
                        </Text>
                      </View>
                      <View style={styles.requirementItem}>
                        {hasNumber ? (
                          <Check size={16} color="#15C2B0" />
                        ) : (
                          <X size={16} color="#FF6F61" />
                        )}
                        <Text
                          style={[
                            styles.requirementText,
                            { color: hasNumber ? '#15C2B0' : '#6b7280' },
                          ]}
                        >
                          {t('resetPassword.reqNumber')}
                        </Text>
                      </View>
                      <View style={styles.requirementItem}>
                        {hasSpecialChar ? (
                          <Check size={16} color="#15C2B0" />
                        ) : (
                          <X size={16} color="#FF6F61" />
                        )}
                        <Text
                          style={[
                            styles.requirementText,
                            { color: hasSpecialChar ? '#15C2B0' : '#6b7280' },
                          ]}
                        >
                          {t('resetPassword.reqSpecialChar')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('resetPassword.confirmPassword')}</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="none"
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#6b7280" />
                  ) : (
                    <Eye size={20} color="#6b7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.disabledButton]}
              onPress={handleResetPassword}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#2D7DD2', '#15C2B0', '#FF6F61']}
                style={styles.submitGradient}
              >
                <Text style={styles.submitText}>
                  {isLoading ? t('resetPassword.resetting') : t('resetPassword.title')}
                </Text>
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
    backgroundColor: '#f9fafb',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF3FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EAF3FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
    gap: 20,
  },
  errorContainer: {
    backgroundColor: '#FFEDEB',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6F61',
  },
  errorText: {
    color: '#FF6F61',
    fontSize: 14,
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
    shadowColor: '#2D7DD2',
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
});
