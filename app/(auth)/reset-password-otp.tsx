import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, ArrowLeft } from 'lucide-react-native';
import { config } from '@/utils/config';

export default function ResetPasswordOTPScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { phone, medicalId } = useLocalSearchParams<{ phone: string; medicalId: string }>();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const maskPhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.length < 4) return phoneNumber;
    const lastFour = phoneNumber.slice(-4);
    const masked = '*'.repeat(phoneNumber.length - 4);
    return `+${masked}${lastFour}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/[^0-9]/g, '').split('').slice(0, 6);
      const newOtp = [...otp];

      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });

      setOtp(newOtp);
      setError('');

      const lastFilledIndex = Math.min(index + digits.length - 1, 5);
      inputRefs.current[lastFilledIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setError(t('otpVerify.errorIncompleteCode'));
      return;
    }

    setIsVerifying(true);
    setError('');

    router.push({
      pathname: '/(auth)/reset-password',
      params: { medicalId: medicalId, phone: phone, otpCode: otpCode },
    });

    setIsVerifying(false);
  };

  const handleResend = async () => {
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
            action: 'send',
            phone: phone,
            type: 'password_reset',
            medicalId: medicalId,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        setError('');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error('Resend error:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
              <ShieldCheck size={64} color="#15C2B0" strokeWidth={2} />
            </View>
            <Text style={styles.title}>{t('otpVerify.verifyPhoneTitle')}</Text>
            <Text style={styles.subtitle}>
              {t('otpVerify.verificationCodeSubtitle')}{'\n'}
              <Text style={styles.phoneNumber}>{maskPhoneNumber(phone)}</Text>
            </Text>
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                value={digit}
                onChangeText={(value) => handleOtpChange(index, value)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={6}
                selectTextOnFocus
              />
            ))}
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.verifyButton, isVerifying && styles.disabledButton]}
            onPress={handleVerify}
            activeOpacity={0.8}
            disabled={isVerifying}
          >
            <LinearGradient colors={['#2D7DD2', '#15C2B0', '#FF6F61']} style={styles.verifyGradient}>
              <Text style={styles.verifyText}>
                {isVerifying ? t('otpVerify.verifying') : t('otpVerify.verifyCodeButton')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>{t('otpVerify.didNotReceive')} </Text>
            <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
              <Text style={styles.resendLink}>{t('otpVerify.resend')}</Text>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
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
    marginBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E4F8F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  phoneNumber: {
    fontWeight: '600',
    color: '#15C2B0',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  otpInput: {
    flex: 1,
    height: 60,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    backgroundColor: '#F8FAFC',
  },
  otpInputFilled: {
    borderColor: '#2D7DD2',
    backgroundColor: '#EAF3FC',
  },
  errorContainer: {
    backgroundColor: '#FFEDEB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6F61',
  },
  errorText: {
    color: '#FF6F61',
    fontSize: 14,
    textAlign: 'center',
  },
  verifyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#15C2B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  verifyGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  verifyText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 15,
    color: '#6b7280',
  },
  resendLink: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D7DD2',
  },
});
