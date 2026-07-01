import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, RefreshControl, Image, Platform } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ShoppingBag,
  Package,
  Wallet,
  Smile,
  Eye,
  MessageSquare,
  Apple,
  Calendar,
  Pill,
  User,
  Users,
  Activity,
  Plus,
  Bell,
  Menu,
  History,
  ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { config } from '@/utils/config';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '@/contexts/ThemeContext';
import { checkDoctorModule } from '@/utils/doctorModule';
import { useTranslation } from 'react-i18next';
import { useAiFeature } from '@/contexts/AiFeatureContext';
import NotificationPermissionGate from '@/components/NotificationPermissionGate';
import { getSession } from '@/utils/auth';

const supabase = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey
);

interface ServiceCardData {
  id: string;
  titleKey: string;
  subtitleKey: string;
  icon: any;
  color: string;
  // Icon-bubble background + icon tint for the restyled card.
  iconBg: string;
  iconColor: string;
  // For doctor-specialization cards: the doctor_specializations.module value
  // that must be available (via an accessible doctor) for this card to show.
  module?: string;
}

// Brand-aligned service palette: Blue / Turquoise / Coral only.
const TURQUOISE = '#15C2B0';
const TURQUOISE_SOFT = 'rgba(21,194,176,0.12)';
const BLUE = '#2D7DD2';
const BLUE_SOFT = 'rgba(45,125,210,0.12)';
const CORAL = '#FF6F61';
const CORAL_SOFT = 'rgba(255,111,97,0.12)';

const healthcareServices: ServiceCardData[] = [
  {
    id: 'orders',
    titleKey: 'home.serviceOrdersTitle',
    subtitleKey: 'home.serviceOrdersSubtitle',
    icon: ShoppingBag,
    color: BLUE,
    iconBg: BLUE_SOFT,
    iconColor: BLUE,
  },
  {
    id: 'prescriptions',
    titleKey: 'home.serviceMedicationsTitle',
    subtitleKey: 'home.serviceMedicationsSubtitle',
    icon: Pill,
    color: TURQUOISE,
    iconBg: TURQUOISE_SOFT,
    iconColor: TURQUOISE,
  },
  {
    id: 'packages',
    titleKey: 'home.servicePackagesTitle',
    subtitleKey: 'home.servicePackagesSubtitle',
    icon: Package,
    color: CORAL,
    iconBg: CORAL_SOFT,
    iconColor: CORAL,
  },
  {
    id: 'finance',
    titleKey: 'home.serviceFinanceTitle',
    subtitleKey: 'home.serviceFinanceSubtitle',
    icon: Wallet,
    color: BLUE,
    iconBg: BLUE_SOFT,
    iconColor: BLUE,
  },
  {
    id: 'visits',
    titleKey: 'home.serviceVisitsTitle',
    subtitleKey: 'home.serviceVisitsSubtitle',
    icon: History,
    color: TURQUOISE,
    iconBg: TURQUOISE_SOFT,
    iconColor: TURQUOISE,
  },
  {
    id: 'doctors',
    titleKey: 'home.serviceDoctorsTitle',
    subtitleKey: 'home.serviceDoctorsSubtitle',
    icon: Users,
    color: TURQUOISE,
    iconBg: TURQUOISE_SOFT,
    iconColor: TURQUOISE,
  },
  {
    id: 'responses',
    titleKey: 'home.serviceResponsesTitle',
    subtitleKey: 'home.serviceResponsesSubtitle',
    icon: MessageSquare,
    color: CORAL,
    iconBg: CORAL_SOFT,
    iconColor: CORAL,
  },
];

const doctorSpecializations: ServiceCardData[] = [
  {
    id: 'dental',
    titleKey: 'home.serviceDentalTitle',
    subtitleKey: 'home.serviceDentalSubtitle',
    icon: Smile,
    color: BLUE,
    iconBg: BLUE_SOFT,
    iconColor: BLUE,
    module: 'dental',
  },
  {
    id: 'vision',
    titleKey: 'home.serviceVisionTitle',
    subtitleKey: 'home.serviceVisionSubtitle',
    icon: Eye,
    color: TURQUOISE,
    iconBg: TURQUOISE_SOFT,
    iconColor: TURQUOISE,
    module: 'eye',
  },
  {
    id: 'nutrition',
    titleKey: 'home.serviceNutritionTitle',
    subtitleKey: 'home.serviceNutritionSubtitle',
    icon: Apple,
    color: TURQUOISE,
    iconBg: TURQUOISE_SOFT,
    iconColor: TURQUOISE,
    module: 'nutrition',
  },
];

interface DashboardStats {
  nextAppointment: {
    date: string;
    time: string;
    doctor: {
      name: string;
      image: string | null;
    } | null;
  } | null;
  lastActivePlan: {
    description: string;
    uploadedAt: string;
    fileName: string | null;
  } | null;
  totalAppointments: number;
  totalPrescriptions: number;
  totalOrders: number;
  totalSpent: number;
}

// Premium healthcare palette — light + dark variants (matches Doctor Home).
const getPalette = (isDark: boolean) =>
  isDark
    ? {
        pageBg: '#0B1220',
        cardBg: '#1E293B',
        elevatedBg: '#334155',
        rowBg: '#0F172A',
        text: '#F1F5F9',
        textSecondary: '#94A3B8',
        muted: '#64748B',
        border: '#334155',
        borderStrong: '#475569',
        primary: '#60A5FA',
        lightBlue: '#1E3A5F',
        avatarBg: '#1E3A5F',
        dot: '#334155',
      }
    : {
        pageBg: '#F8FAFC',
        cardBg: '#FFFFFF',
        elevatedBg: '#FFFFFF',
        rowBg: '#F8FAFC',
        text: '#0F172A',
        textSecondary: '#64748B',
        muted: '#94A3B8',
        border: '#EEF1F6',
        borderStrong: '#E2E8F0',
        primary: '#2D7DD2',
        lightBlue: '#EAF3FC',
        avatarBg: '#EAF3FC',
        dot: '#BFD9F5',
      };

type Palette = ReturnType<typeof getPalette>;

const STAT_CONFIG = [
  { key: 'appointments', labelKey: 'home.statAppointments', icon: Calendar, iconBg: 'rgba(45,125,210,0.12)', color: '#2D7DD2' },
  { key: 'medications', labelKey: 'home.statMedications', icon: Activity, iconBg: 'rgba(21,194,176,0.12)', color: '#15C2B0' },
  { key: 'orders', labelKey: 'home.statOrders', icon: ShoppingBag, iconBg: 'rgba(255,111,97,0.12)', color: '#FF6F61' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { refreshAiFeature } = useAiFeature();
  const P = useMemo(() => getPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(P), [P]);
  const [userName, setUserName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userAge, setUserAge] = useState<number | null>(null);
  const [bloodType, setBloodType] = useState<string | null>(null);
  const [, setMedicalId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const calculateAge = useCallback((dateOfBirth: string): number => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      const session = await getSession();
      if (session) {
        if (session.patient?.first_name) {
          setUserName(session.patient.first_name);
        }
        if (session.patient?.medical_id) {
          setMedicalId(session.patient.medical_id);
        }

        if (session.patient?.id && session.access_token) {
          const response = await fetch(`${config.supabaseUrl}/functions/v1/mobile-get-patient-profile`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const result = await response.json();
            const patientData = result.patient;

            if (patientData) {
              if (patientData.date_of_birth) {
                const age = calculateAge(patientData.date_of_birth);
                setUserAge(age);
              }
              if (patientData.blood_type) {
                setBloodType(patientData.blood_type);
              }
              if (patientData.profile_image) {
                const { data } = supabase.storage
                  .from('patient-profiles')
                  .getPublicUrl(patientData.profile_image);
                setProfileImage(data.publicUrl + '?t=' + new Date().getTime());
              } else {
                setProfileImage(null);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, [calculateAge]);

  const loadDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      const session = await getSession();
      if (!session) {
        return;
      }

      const medId = session.patient?.medical_id;

      if (!medId) {
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-dashboard-stats`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${medId}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (result.success && result.stats) {
        setDashboardStats(result.stats);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNotificationsCount = useCallback(async () => {
    try {
      const session = await getSession();
      if (!session) return;

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-notifications`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        setUnreadNotifications(result.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error loading notifications count:', error);
    }
  }, []);

  const loadDoctorModules = useCallback(async () => {
    try {
      const session = await getSession();
      if (!session) return;

      const medId = session.patient?.medical_id;
      if (!medId) return;

      const { modules } = await checkDoctorModule(medId);
      setAvailableModules(modules || []);
    } catch (error) {
      console.error('Error loading doctor modules:', error);
      setAvailableModules([]);
    }
  }, []);

  useEffect(() => {
    loadUserData();
    loadDashboardStats();
    loadNotificationsCount();
    loadDoctorModules();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [loadUserData, loadDashboardStats, loadNotificationsCount, loadDoctorModules, fadeAnim]);

  // Refetch notification count and user data when the screen regains focus
  // (e.g. after marking notifications read, or editing the profile).
  useFocusEffect(
    useCallback(() => {
      loadNotificationsCount();
      loadUserData();
    }, [loadNotificationsCount, loadUserData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadUserData(),
      loadDashboardStats(),
      loadNotificationsCount(),
      loadDoctorModules(),
      refreshAiFeature(),
    ]);
    setRefreshing(false);
  };

  const handleCardPress = (serviceId: string) => {
    const routes: Record<string, any> = {
      orders: '/(tabs)/orders',
      prescriptions: '/(tabs)/prescriptions',
      packages: '/(tabs)/packages',
      vision: '/(tabs)/vision',
      dental: '/(tabs)/dental',
      nutrition: '/(tabs)/nutrition',
      doctors: '/(tabs)/doctors',
      responses: '/(tabs)/doctor-responses',
      finance: '/(tabs)/statement',
      visits: '/(tabs)/visit-history',
    };

    if (routes[serviceId]) {
      router.push(routes[serviceId]);
    }
  };

  const statValues: Record<string, number> = {
    appointments: dashboardStats?.totalAppointments || 0,
    medications: dashboardStats?.totalPrescriptions || 0,
    orders: dashboardStats?.totalOrders || 0,
  };

  const visibleSpecializations = doctorSpecializations.filter(
    (service) => service.module && availableModules.includes(service.module)
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <NotificationPermissionGate />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[P.primary]}
              tintColor={P.primary}
            />
          }
        >
          {/* Top header card */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Image
                  source={require('@/assets/images/Logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.logoTextWrap}>
                <Text style={styles.appName}>Maw3edak</Text>
                <Text style={styles.appTagline} numberOfLines={1}>{t('home.appTagline')}</Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push('/notifications' as any)}
                activeOpacity={0.85}
              >
                <Bell size={20} color={P.text} strokeWidth={2} />
                {unreadNotifications > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push('/(tabs)/settings')}
                activeOpacity={0.85}
              >
                <Menu size={20} color={P.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Patient welcome / profile card */}
          <LinearGradient
            colors={isDark ? ['#16324E', '#134E47', '#3A2320'] : ['#2D7DD2', '#15C2B0', '#FF6F61']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeCard}
          >
            <View style={styles.welcomeBlobA} pointerEvents="none" />
            <View style={styles.welcomeBlobB} pointerEvents="none" />
            <View style={styles.dotGrid} pointerEvents="none">
              {Array.from({ length: 24 }).map((_, i) => (
                <View key={i} style={styles.dot} />
              ))}
            </View>

            <View style={styles.welcomeRow}>
              <View style={styles.welcomeLeft}>
                <Text style={styles.welcomeLabel}>{t('home.welcomeBack')}</Text>
                <Text style={styles.welcomeName} numberOfLines={2}>{userName}</Text>

                <View style={styles.badgesRow}>
                  {userAge !== null && (
                    <View style={styles.agePill}>
                      <User size={13} color="#FFFFFF" strokeWidth={2.5} />
                      <Text style={styles.agePillText}>{t('home.ageYears', { age: userAge })}</Text>
                    </View>
                  )}
                  {bloodType && (
                    <View style={styles.bloodPill}>
                      <Text style={styles.bloodPillText}>{bloodType}</Text>
                    </View>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => router.push('/edit-profile' as any)}
                activeOpacity={0.85}
              >
                <View style={styles.avatarRing}>
                  <View style={styles.avatarCircle}>
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.avatarImg} resizeMode="cover" />
                    ) : userName ? (
                      <Text style={styles.avatarInitial}>{userName.charAt(0).toUpperCase()}</Text>
                    ) : (
                      <User size={34} color={P.primary} strokeWidth={2} />
                    )}
                  </View>
                </View>
                <Text style={styles.profileLabel}>{t('home.profile')}</Text>
              </TouchableOpacity>
            </View>

            {/* Stats inside welcome card */}
            <View style={styles.statsRow}>
              {STAT_CONFIG.map((stat) => {
                const Icon = stat.icon;
                return (
                  <View key={stat.key} style={styles.statCard}>
                    <View style={[styles.statIconBubble, { backgroundColor: stat.iconBg }]}>
                      <Icon size={18} color={stat.color} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.statValue, { color: stat.color }]}>{statValues[stat.key]}</Text>
                    <Text style={styles.statLabel} numberOfLines={1}>{t(stat.labelKey)}</Text>
                  </View>
                );
              })}
            </View>
          </LinearGradient>

          {/* Upcoming appointments */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.upcomingAppointments')}</Text>
              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => router.push('/(tabs)/appointments')}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>{t('home.viewAll')}</Text>
                <ChevronRight size={16} color={P.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <View style={styles.appointmentCard}>
              <View style={styles.appointmentIcon}>
                <Calendar size={22} color={P.primary} strokeWidth={2} />
              </View>
              <View style={styles.appointmentContent}>
                <Text style={styles.appointmentLabel}>{t('home.nextAppointment')}</Text>
                <Text style={styles.appointmentText} numberOfLines={1}>
                  {dashboardStats?.nextAppointment
                    ? (() => {
                        const apt = dashboardStats.nextAppointment;
                        const dateObj = new Date(`${apt.date}T${apt.time || '00:00:00'}`);
                        const datePart = new Date(`${apt.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const timePart = apt.time
                          ? (() => {
                              const [h, m] = apt.time.split(':').map(Number);
                              const ampm = h >= 12 ? 'PM' : 'AM';
                              const hour12 = h % 12 || 12;
                              return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
                            })()
                          : dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                        return t('home.appointmentDateTime', { date: datePart, time: timePart });
                      })()
                    : t('home.noUpcomingAppointments')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => router.push('/book-appointment' as any)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#2D7DD2', '#15C2B0', '#FF6F61']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              />
              <View style={styles.bookButtonLeft}>
                <View style={styles.bookPlusBubble}>
                  <Plus size={18} color="#FFFFFF" strokeWidth={2.8} />
                </View>
                <Text style={styles.bookButtonText}>{t('home.bookAppointment')}</Text>
              </View>
              <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.8} />
            </TouchableOpacity>
          </View>

          {/* Healthcare services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('home.healthcareServices')}</Text>

            <View style={styles.servicesGrid}>
              {healthcareServices.map((service, index) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onPress={() => handleCardPress(service.id)}
                  index={index}
                  P={P}
                  styles={styles}
                />
              ))}
            </View>
          </View>

          {/* Doctor specializations */}
          {visibleSpecializations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('home.doctorSpecializations')}</Text>

              <View style={styles.servicesGrid}>
                {visibleSpecializations.map((service, index) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onPress={() => handleCardPress(service.id)}
                    index={index + healthcareServices.length}
                    P={P}
                    styles={styles}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function ServiceCard({
  service,
  onPress,
  index,
  P,
  styles,
}: {
  service: ServiceCardData;
  onPress: () => void;
  index: number;
  P: Palette;
  styles: ReturnType<typeof makeStyles>;
}) {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const IconComponent = service.icon;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.serviceCardWrap,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.serviceCard}
      >
        <View style={[styles.serviceIconBubble, { backgroundColor: service.iconBg }]}>
          <IconComponent size={20} color={service.iconColor} strokeWidth={2.2} />
        </View>
        <View style={styles.serviceTextWrap}>
          <Text style={styles.serviceTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>{t(service.titleKey)}</Text>
          <Text style={styles.serviceSubtitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>{t(service.subtitleKey)}</Text>
        </View>
        <ChevronRight size={16} color={P.muted} strokeWidth={2.5} style={styles.serviceChevron} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const makeStyles = (P: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.pageBg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 110,
  },

  // Top header card
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 24,
      },
      android: { elevation: 3 },
    }),
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.2,
    color: P.text,
  },
  appTagline: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
    color: P.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 10,
  },
  headerButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: P.elevatedBg,
    borderWidth: 1,
    borderColor: P.border,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 18,
      },
      android: { elevation: 2 },
    }),
  },
  notificationBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#FF6F61',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: P.cardBg,
  },
  notificationBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Patient welcome / profile card
  welcomeCard: {
    borderRadius: 30,
    padding: 22,
    marginTop: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#2D7DD2',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.28,
        shadowRadius: 40,
      },
      android: { elevation: 6 },
    }),
  },
  welcomeBlobA: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -120,
    right: -70,
  },
  welcomeBlobB: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -90,
    left: -50,
  },
  dotGrid: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 66,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    opacity: 0.6,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  welcomeLeft: {
    flex: 1,
    paddingRight: 14,
  },
  welcomeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  welcomeName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 14,
    lineHeight: 34,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  agePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  agePillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bloodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  bloodPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileButton: {
    alignItems: 'center',
    gap: 6,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 26,
      },
      android: { elevation: 4 },
    }),
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: P.avatarBg,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  avatarInitial: {
    fontSize: 38,
    fontWeight: '800',
    color: P.primary,
  },
  profileLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Stats inside welcome card
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 18,
      },
      android: { elevation: 2 },
    }),
  },
  statIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: P.textSecondary,
    textAlign: 'center',
  },

  // Sections
  section: {
    marginTop: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: P.text,
    marginBottom: 14,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 14,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.primary,
  },

  // Appointment card
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 24,
      },
      android: { elevation: 2 },
    }),
  },
  appointmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: P.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  appointmentContent: {
    flex: 1,
    minWidth: 0,
  },
  appointmentLabel: {
    fontSize: 12.5,
    fontWeight: '500',
    color: P.textSecondary,
    marginBottom: 4,
  },
  appointmentText: {
    fontSize: 15,
    fontWeight: '800',
    color: P.text,
  },

  // Book appointment row
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#15C2B0',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: { elevation: 5 },
    }),
  },
  bookButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  bookPlusBubble: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Service / specialization cards
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  serviceCardWrap: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 92,
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 22,
      },
      android: { elevation: 2 },
    }),
  },
  serviceIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: P.text,
    marginBottom: 2,
    lineHeight: 18,
  },
  serviceSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: P.textSecondary,
    lineHeight: 14,
  },
  serviceChevron: {
    flexShrink: 0,
  },
});
