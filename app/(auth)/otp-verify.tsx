import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, ArrowLeft } from 'lucide-react-native';
import { config } from '@/utils/config';

export default function OTPVerifyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mobile, email } = useLocalSearchParams<{ mobile: string; email: string }>();

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
    const digits = value.replace(/[^0-9]/g, '');

    if (digits.length > 1) {
      const digitArray = digits.split('').slice(0, 6);
      const newOtp = [...otp];

      digitArray.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });

      setOtp(newOtp);
      setError('');

      const lastFilledIndex = Math.min(index + digitArray.length - 1, 5);
      if (lastFilledIndex < 5) {
        inputRefs.current[lastFilledIndex + 1]?.focus();
      } else {
        inputRefs.current[lastFilledIndex]?.blur();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = digits;
    setOtp(newOtp);
    setError('');

    if (digits && index < 5) {
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

    try {
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile_otp`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'verify',
            phone: mobile,
            email: email,
            otp: otpCode,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        router.replace({
          pathname: '/(auth)/registration-success',
          params: {
            medicalId: data.medicalId,
            fullName: data.fullName,
            welcomeBack: data.welcomeBack ? '1' : '',
          },
        });
      } else {
        setError(data.error || t('otpVerify.errorInvalidOtp'));
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError(t('otpVerify.errorGeneric'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
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
            <ArrowLeft size={24} color="#6b7280" strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <ShieldCheck size={48} color="#15C2B0" strokeWidth={2} />
            </View>
            <Text style={styles.title}>{t('otpVerify.title')}</Text>
            <Text style={styles.subtitle}>
              {t('otpVerify.subtitle')}{'\n'}
              <Text style={styles.phone}>{maskPhoneNumber(mobile || '')}</Text>
            </Text>
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled,
                  error && styles.otpInputError,
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(index, value)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={6}
                selectTextOnFocus
              />
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.verifyButton, isVerifying && styles.disabledButton]}
            onPress={handleVerify}
            activeOpacity={0.8}
            disabled={isVerifying}
          >
            <LinearGradient
              colors={['#56C6C8', '#69C7F0']}
              style={styles.verifyGradient}
            >
              {isVerifying ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.verifyText}>{t('otpVerify.verifyButton')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>{t('otpVerify.didNotReceive')} </Text>
            <TouchableOpacity onPress={handleResendOTP} disabled={isVerifying}>
              <Text style={styles.resendLink}>{t('common.back')}</Text>
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#E4F8F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  phone: {
    fontWeight: '600',
    color: '#15C2B0',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  otpInputFilled: {
    borderColor: '#2D7DD2',
    backgroundColor: '#EAF3FC',
  },
  otpInputError: {
    borderColor: '#FF6F61',
    backgroundColor: '#FFEDEB',
  },
  errorText: {
    fontSize: 14,
    color: '#FF6F61',
    textAlign: 'center',
    marginBottom: 16,
  },
  verifyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#15C2B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.5,
  },
  verifyGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
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
    color: '#2D7DD2',
    fontWeight: '600',
  },
});
