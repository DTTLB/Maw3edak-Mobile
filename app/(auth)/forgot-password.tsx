import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, User, ArrowLeft } from 'lucide-react-native';
import ImageCaptcha from '@/components/ImageCaptcha';
import { config } from '@/utils/config';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [medicalId, setMedicalId] = useState('MED-');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [, setIsCaptchaVerified] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);

  const handleMedicalIdChange = (text: string) => {
    if (text.startsWith('MED-')) {
      setMedicalId(text.toUpperCase());
    } else if (text.length < 4) {
      setMedicalId('MED-');
    } else {
      setMedicalId('MED-' + text.slice(4).toUpperCase());
    }
  };

  const handleCaptchaVerify = () => {
    setIsCaptchaVerified(true);
    setShowCaptcha(false);
    proceedWithOTP();
  };

  const handleCaptchaClose = () => {
    setShowCaptcha(false);
  };

  const handleSubmit = async () => {
    if (!medicalId || medicalId === 'MED-') {
      setError(t('forgotPassword.errorEnterMedicalId'));
      return;
    }

    setShowCaptcha(true);
  };

  const proceedWithOTP = async () => {

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-phone-by-medical-id`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
          },
          body: JSON.stringify({ medicalId }),
        }
      );

      const result = await response.json();

      if (result.success && result.phone) {
        const otpResponse = await fetch(
          `${config.supabaseUrl}/functions/v1/mobile_otp`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.supabaseAnonKey}`,
            },
            body: JSON.stringify({
              action: 'send',
              phone: result.phone,
              type: 'password_reset',
              medicalId: medicalId,
            }),
          }
        );

        const otpResult = await otpResponse.json();

        if (otpResult.success) {
          router.push({
            pathname: '/(auth)/reset-password-otp',
            params: { phone: result.phone, medicalId: medicalId },
          });
        } else {
          setError(otpResult.error || t('forgotPassword.errorSendOtp'));
        }
      } else {
        setError(t('forgotPassword.errorMedicalIdNotFound'));
      }
    } catch (err) {
      console.error('Error:', err);
      setError(t('forgotPassword.errorGeneric'));
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
            <View style={styles.logoContainer}>
              <Heart size={48} color="#15C2B0" fill="#15C2B0" strokeWidth={2} />
            </View>
            <Text style={styles.title}>{t('forgotPassword.title')}</Text>
            <Text style={styles.subtitle}>
              {t('forgotPassword.subtitle')}
            </Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('forgotPassword.medicalIdLabel')}</Text>
              <View style={styles.inputContainer}>
                <User size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('forgotPassword.medicalIdPlaceholder')}
                  value={medicalId}
                  onChangeText={handleMedicalIdChange}
                  autoCapitalize="characters"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.disabledButton]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#56C6C8', '#69C7F0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.submitGradient}
              >
                <Text style={styles.submitText}>
                  {isLoading ? t('forgotPassword.sending') : t('forgotPassword.sendResetCode')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.backToLoginText}>{t('forgotPassword.backToLogin')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ImageCaptcha
        visible={showCaptcha}
        onVerify={handleCaptchaVerify}
        onClose={handleCaptchaClose}
      />
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
    backgroundColor: '#E4F8F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E4F8F4',
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
  backToLoginButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backToLoginText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D7DD2',
  },
});
