import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Modal, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FileText, Heart, Headphones, Phone, X, ClipboardList } from 'lucide-react-native';
import { RoleCard } from '@/components/ui';
import { brand } from '@/constants/brand';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useEffect, useState } from 'react';

const SUPPORT_NUMBERS = ['96170938995', '96170909983', '96176480165'];

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const translateY = useSharedValue(0);
  const [supportVisible, setSupportVisible] = useState(false);

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-15, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const handleDoctorLogin = () => {
    router.push('/(auth)/doctor-login');
  };

  const handlePatientLogin = () => {
    router.push('/(auth)/patient-login');
  };

  const handleReceptionistLogin = () => {
    // Cast: Expo Router's typed-route union regenerates on `expo start`; this
    // newly-added route isn't in the generated types until then.
    router.push('/(auth)/receptionist-login' as any);
  };

  const Container = Platform.OS === 'web' ? View : SafeAreaView;

  return (
    <Container style={styles.container}>
      {/* Subtle brand background shapes */}
      <View pointerEvents="none" style={styles.bgBlobTurquoise} />
      <View pointerEvents="none" style={styles.bgBlobBlue} />
      <View style={styles.content}>
        {/* Animated Logo */}
        <View style={styles.iconContainer}>
          <Animated.View style={animatedStyle}>
            <Image
              source={require('../assets/images/Logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* Title and Subtitle */}
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
          <Text style={styles.subtitle}>{t('auth.chooseSignIn')}</Text>
        </View>

        {/* Role Selection Cards */}
        <View style={styles.cardsContainer}>
          <RoleCard
            color="blue"
            gradientColors={['#56C6C8', '#69C7F0']}
            icon={<FileText size={28} color="#ffffff" strokeWidth={2.5} />}
            title={t('auth.imADoctor')}
            description={t('auth.doctorPortalDescription')}
            onPress={handleDoctorLogin}
          />
          <RoleCard
            color="turquoise"
            gradientColors={['#5FD6C8', '#82DCEB']}
            icon={<Heart size={28} color="#ffffff" strokeWidth={2.5} fill="#ffffff" />}
            title={t('auth.imAPatient')}
            description={t('auth.patientRecordsDescription')}
            onPress={handlePatientLogin}
          />
          <RoleCard
            color="blue"
            gradientColors={['#7C83F0', '#69C7F0']}
            icon={<ClipboardList size={28} color="#ffffff" strokeWidth={2.5} />}
            title={t('auth.imAReceptionist')}
            description={t('auth.receptionistPortalDescription')}
            onPress={handleReceptionistLogin}
          />
        </View>

        {/* Support Button */}
        <TouchableOpacity
          style={styles.supportButton}
          onPress={() => setSupportVisible(true)}
          activeOpacity={0.7}
        >
          <Headphones size={20} color={brand.turquoise} strokeWidth={2.5} />
          <Text style={styles.supportButtonText}>{t('auth.support')}</Text>
        </TouchableOpacity>
      </View>

      {/* Support Modal */}
      <Modal
        visible={supportVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSupportVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setSupportVisible(false)}
              activeOpacity={0.7}
            >
              <X size={22} color="#6b7280" strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={styles.modalIcon}>
              <Headphones size={28} color="#ffffff" strokeWidth={2.5} />
            </View>
            <Text style={styles.modalTitle}>{t('auth.supportTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('auth.supportSubtitle')}</Text>

            <View style={styles.numbersContainer}>
              {SUPPORT_NUMBERS.map((number) => (
                <TouchableOpacity
                  key={number}
                  style={styles.numberRow}
                  onPress={() => handleCall(number)}
                  activeOpacity={0.7}
                >
                  <View style={styles.numberIcon}>
                    <Phone size={18} color="#15C2B0" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.numberText}>{number}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      paddingTop: 20,
    }),
  },
  bgBlobTurquoise: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(21,194,176,0.10)',
    top: -120,
    right: -90,
  },
  bgBlobBlue: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(45,125,210,0.08)',
    bottom: -110,
    left: -80,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  headerTextContainer: {
    alignItems: 'center',
    marginTop: 32,
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
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
    marginVertical: 40,
  },
  card: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  cardGradient: {
    borderRadius: 16,
    padding: 20,
    minHeight: 100,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  doctorIcon: {
    backgroundColor: '#2563eb',
  },
  patientIcon: {
    backgroundColor: '#059669',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#15C2B0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 1,
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#15C2B0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  numbersContainer: {
    width: '100%',
    gap: 12,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E4F8F4',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  numberIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(21,194,176,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: 0.5,
  },
});
