import { View, Text, StyleSheet, TouchableOpacity, Clipboard, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, CreditCard, ArrowRight, Copy } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export default function RegistrationSuccessScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { medicalId, fullName, welcomeBack } = useLocalSearchParams<{
    medicalId: string;
    fullName: string;
    welcomeBack?: string;
  }>();

  // When the account was reactivated (a previously deleted account re-registered)
  // greet the patient with "Welcome back" instead of "Account created".
  const isReactivated = welcomeBack === '1';

  const handleCopyMedicalId = () => {
    Clipboard.setString(medicalId);
    Alert.alert(t('resetPassword.copiedTitle'), t('resetPassword.copiedMessage'));
  };

  const handleGoToLogin = () => {
    router.replace({
      pathname: '/(auth)/patient-login',
      params: { medicalId },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <CheckCircle size={64} color="#15C2B0" strokeWidth={2} />
          </View>
          <Text style={styles.title}>
            {isReactivated
              ? t('resetPassword.accountReactivated')
              : t('resetPassword.accountCreated')}
          </Text>
          <Text style={styles.subtitle}>
            {isReactivated
              ? t('resetPassword.welcomeBack', { name: fullName })
              : t('resetPassword.welcome', { name: fullName })}
          </Text>
        </View>

        <LinearGradient
          colors={['#E4F8F4', '#D4F3EE']}
          style={styles.medicalIdCard}
        >
          <View style={styles.cardPattern}>
            <View style={styles.cardPatternCircle1} />
            <View style={styles.cardPatternCircle2} />
          </View>

          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <CreditCard size={28} color="#0FA295" strokeWidth={2.5} />
              <Text style={styles.cardLabel}>{t('resetPassword.medicalIdCard')}</Text>
            </View>

            <View style={styles.idContainer}>
              <Text style={styles.idLabel}>{t('resetPassword.idNumber')}</Text>
              <Text style={styles.medicalIdText}>{medicalId}</Text>
            </View>

            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.patientLabel}>{t('resetPassword.patientName')}</Text>
                <Text style={styles.patientName}>{fullName}</Text>
              </View>

              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyMedicalId}
                activeOpacity={0.7}
              >
                <Copy size={18} color="#0FA295" strokeWidth={2} />
                <Text style={styles.copyText}>{t('resetPassword.copy')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            {t('resetPassword.saveIdInfo')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleGoToLogin}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#56C6C8', '#69C7F0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.loginGradient}
          >
            <Text style={styles.loginText}>{t('resetPassword.goToLogin')}</Text>
            <ArrowRight size={20} color="#ffffff" strokeWidth={2} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
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
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    color: '#6b7280',
    textAlign: 'center',
  },
  medicalIdCard: {
    width: '100%',
    borderRadius: 24,
    padding: 28,
    marginBottom: 24,
    shadowColor: '#15C2B0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  cardPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardPatternCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(21,194,176,0.12)',
    top: -50,
    right: -50,
  },
  cardPatternCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(15,162,149,0.10)',
    bottom: -40,
    left: -40,
  },
  cardContent: {
    position: 'relative',
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0FA295',
    letterSpacing: 0.5,
  },
  idContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(21,194,176,0.30)',
  },
  idLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  medicalIdText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0FA295',
    letterSpacing: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  patientLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0FA295',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#15C2B0',
  },
  copyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0FA295',
  },
  infoBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  infoText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
    fontWeight: '500',
  },
  loginButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#15C2B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
