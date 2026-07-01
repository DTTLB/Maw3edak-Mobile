import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Dimensions,
  Modal,
  TextInput,
  FlatList,
  Platform,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { config } from '@/utils/config';
import { getDoctorModules } from '@/utils/doctorModule';
import { getSession } from '@/utils/auth';
import NotificationPermissionGate from '@/components/NotificationPermissionGate';
import {
  Calendar,
  Users,
  CircleCheck as CheckCircle,
  Clock,
  Bell,
  Circle as XCircle,
  Pill,
  Activity,
  Eye,
  Apple,
  Timer,
  ShoppingBag,
  Building2,
  ChevronDown,
  Check,
  X,
  MessageCircle,
  FileText,
  TrendingUp,
  Menu,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;
const CLINIC_MODAL_WIDTH = IS_TABLET ? Math.min(520, SCREEN_WIDTH * 0.7) : SCREEN_WIDTH * 0.9;
const CLINIC_MODAL_MAX_HEIGHT = SCREEN_HEIGHT * 0.78;

interface Clinic {
  id: string;
  name: string;
  slug: string;
  location?: string;
}

const NAV_ITEMS = [
  { key: 'appointments', labelKey: 'navSchedule', icon: Calendar, color: '#2D7DD2', bg: '#EAF3FC', route: '/(doctor-tabs)/appointments' },
  { key: 'time-management', labelKey: 'navTime', icon: Timer, color: '#2D7DD2', bg: '#EAF3FC', route: '/(doctor-tabs)/time-management' },
  { key: 'finance', labelKey: 'navFinance', icon: TrendingUp, color: '#15C2B0', bg: '#E4F8F4', route: '/(doctor-tabs)/finance' },
  { key: 'orders', labelKey: 'navOrders', icon: ShoppingBag, color: '#FF6F61', bg: '#FFEDEB', route: '/(doctor-tabs)/orders' },
  { key: 'medications', labelKey: 'navMedications', icon: Pill, color: '#2D7DD2', bg: '#EAF3FC', route: '/(doctor-tabs)/medications' },
  { key: 'questions', labelKey: 'navQuestions', icon: MessageCircle, color: '#FF6F61', bg: '#FFEDEB', route: '/(doctor-tabs)/questions' },
  { key: 'patient-answers', labelKey: 'navAnswers', icon: FileText, color: '#15C2B0', bg: '#E4F8F4', route: '/(doctor-tabs)/patient-answers' },
  { key: 'patients', labelKey: 'navPatients', icon: Users, color: '#15C2B0', bg: '#E4F8F4', route: '/(doctor-tabs)/patients' },
];

const SPEC_ITEMS = [
  { labelKey: 'specDental', icon: Activity, color: '#2D7DD2', bg: '#EAF3FC', route: '/(doctor-tabs)/dental', module: 'dental' },
  { labelKey: 'specVision', icon: Eye, color: '#2D7DD2', bg: '#EAF3FC', route: '/(doctor-tabs)/vision', module: 'eye' },
  { labelKey: 'specNutrition', icon: Apple, color: '#15C2B0', bg: '#E4F8F4', route: '/(doctor-tabs)/nutrition', module: 'nutrition' },
];

const STAT_CONFIG = [
  { key: 'todaySchedule', labelKey: 'statScheduled', color: '#2D7DD2', iconBg: '#EAF3FC', icon: Calendar },
  { key: 'pending',       labelKey: 'statPending',   color: '#D97706', iconBg: '#FEF3C7', icon: Clock },
  { key: 'completed',     labelKey: 'statCompleted', color: '#15C2B0', iconBg: '#E4F8F4', icon: CheckCircle },
  { key: 'cancelled',     labelKey: 'statCancelled', color: '#FF6F61', iconBg: '#FFEDEB', icon: XCircle },
];

// Premium healthcare palette — light + dark variants (matches reference design)
const getPalette = (isDark: boolean) =>
  isDark
    ? {
        pageBg: '#0B1220',
        cardBg: '#1E293B',
        elevatedBg: '#334155',
        rowBg: '#0F172A',
        text: '#F1F5F9',
        textSecondary: '#94A3B8',
        border: '#334155',
        borderStrong: '#475569',
        primary: '#4FA3E6',
        lightBlue: '#16324E',
        avatarBg: '#16324E',
        dot: '#334155',
        green: '#2BD4C2',
        danger: '#FF8475',
        cancelBtnBg: '#5A211C',
      }
    : {
        pageBg: '#F8FAFC',
        cardBg: '#FFFFFF',
        elevatedBg: '#FFFFFF',
        rowBg: '#F8FAFC',
        text: '#0F172A',
        textSecondary: '#64748B',
        border: '#EEF1F6',
        borderStrong: '#E2E8F0',
        primary: '#2D7DD2',
        lightBlue: '#EAF3FC',
        avatarBg: '#EAF3FC',
        dot: '#BFD9F5',
        green: '#15C2B0',
        danger: '#FF6F61',
        cancelBtnBg: '#FFEDEB',
      };

type Palette = ReturnType<typeof getPalette>;

export default function DoctorHomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session, switchClinic } = useAuth();
  const { colors, isDark } = useTheme();
  const P = useMemo(() => getPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(P), [P]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ todaySchedule: 0, cancelled: 0, completed: 0, pending: 0 });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [currentClinic, setCurrentClinic] = useState<Clinic | null>(null);
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [switchingClinic, setSwitchingClinic] = useState(false);
  const [clinicSearch, setClinicSearch] = useState('');

  const filteredClinics = useMemo(() => {
    const q = clinicSearch.trim().toLowerCase();
    if (!q) return clinics;
    return clinics.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q),
    );
  }, [clinics, clinicSearch]);

  const openClinicModal = useCallback(() => {
    setClinicSearch('');
    setShowClinicModal(true);
  }, []);

  const closeClinicModal = useCallback(() => {
    setShowClinicModal(false);
    setClinicSearch('');
  }, []);
  const [availableModules, setAvailableModules] = useState<string[]>([]);

  const loadClinics = useCallback(async () => {
    try {
      const globalId = session?.user?.global_id;
      if (!globalId) return;
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-doctor-clinics?global_id=${globalId}`,
        { headers: { Authorization: `Bearer ${config.supabaseAnonKey}`, 'Content-Type': 'application/json' } }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.clinics) {
          setClinics(data.clinics);
          if (session?.user?.company_id) {
            const clinic = data.clinics.find((c: Clinic) => c.id === session.user.company_id);
            setCurrentClinic(clinic || null);
          }
        }
      }
    } catch (error) {
      console.error('Error loading clinics:', error);
    }
  }, [session?.user?.global_id, session?.user?.company_id]);

  const handleSwitchClinic = async (clinic: Clinic) => {
    if (currentClinic?.id === clinic.id) {
      closeClinicModal();
      return;
    }
    try {
      setSwitchingClinic(true);
      closeClinicModal();
      await switchClinic(clinic.id);
      setCurrentClinic(clinic);
      await loadDashboardData();
      await loadDoctorModules(clinic.id);
    } catch {
      Alert.alert(t('common.error'), t('doctorHome.switchClinicFailed'));
    } finally {
      setSwitchingClinic(false);
    }
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const globalId = session?.user?.global_id;
      const companyId = session?.user?.company_id;
      if (!globalId) return;

      const storedSession = await getSession();
      const sessionToken = storedSession?.access_token ?? null;

      const [statsResponse, appointmentsResponse, notificationsResponse] = await Promise.all([
        fetch(
          `${config.supabaseUrl}/functions/v1/mobile-get-doctor-dashboard-stats?global_id=${globalId}${companyId ? `&company_id=${companyId}` : ''}`,
          { headers: { Authorization: `Bearer ${config.supabaseAnonKey}`, 'Content-Type': 'application/json' } }
        ),
        fetch(
          `${config.supabaseUrl}/functions/v1/mobile-get-doctor-today-appointments?global_id=${globalId}${companyId ? `&company_id=${companyId}` : ''}`,
          { headers: { Authorization: `Bearer ${config.supabaseAnonKey}`, 'Content-Type': 'application/json' } }
        ),
        sessionToken
          ? fetch(`${config.supabaseUrl}/functions/v1/mobile-get-doctor-notifications`, {
              headers: {
                Authorization: `Bearer ${config.supabaseAnonKey}`,
                'X-Session-Token': sessionToken,
                'Content-Type': 'application/json',
              },
            })
          : Promise.resolve(null),
      ]);

      if (!statsResponse.ok) throw new Error('Failed to fetch dashboard stats');

      const statsData = await statsResponse.json();
      setStats({
        todaySchedule: statsData.todaySchedule || 0,
        cancelled: statsData.cancelled || 0,
        completed: statsData.completed || 0,
        pending: statsData.pending || 0,
      });
      setProfileImage(statsData.profileImage || null);

      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        setUpcomingAppointments((appointmentsData.appointments || []).slice(0, 3));
      }

      if (notificationsResponse && notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        if (notificationsData.success && notificationsData.unreadCount !== undefined) {
          setUnreadNotifications(notificationsData.unreadCount);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user?.global_id, session?.user?.company_id]);

  const loadDoctorModules = useCallback(async (companyIdOverride?: string | null) => {
    try {
      const globalId = session?.user?.global_id;
      if (!globalId) return;
      const companyId = companyIdOverride ?? session?.user?.company_id;
      const { modules } = await getDoctorModules(globalId, companyId);
      setAvailableModules(modules || []);
    } catch (error) {
      console.error('Error loading doctor modules:', error);
      setAvailableModules([]);
    }
  }, [session?.user?.global_id, session?.user?.company_id]);

  useEffect(() => {
    if (session?.user?.global_id) {
      loadClinics();
      loadDashboardData();
      loadDoctorModules();
    }
  }, [session?.user?.global_id, loadClinics, loadDashboardData, loadDoctorModules]);

  useEffect(() => {
    if (session?.user?.company_id && clinics.length > 0) {
      const clinic = clinics.find(c => c.id === session.user.company_id);
      setCurrentClinic(clinic || null);
      loadDashboardData();
    }
  }, [session?.user?.company_id, clinics, loadDashboardData]);

  useFocusEffect(
    useCallback(() => {
      if (session?.user?.global_id) {
        loadDashboardData();
      }
    }, [session?.user?.global_id, loadDashboardData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
    loadDoctorModules();
  };

  const handleUpdateAppointmentStatus = async (appointmentId: number, newStatus: string) => {
    try {
      if (!session?.user?.id) { Alert.alert(t('common.error'), t('doctorHome.pleaseLogInAgain')); return; }
      const response = await fetch(`${config.supabaseUrl}/functions/v1/mobile-update-appointment-status`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${config.supabaseAnonKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, status: newStatus, userId: session.user.id }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to update');
      const statusLabel =
        newStatus === 'completed' ? t('doctorHome.statusCompleted') : t('doctorHome.statusCancelled');
      Alert.alert(t('common.success'), t('doctorHome.appointmentStatusUpdated', { status: statusLabel }));
      loadDashboardData();
    } catch {
      Alert.alert(t('common.error'), t('doctorHome.updateStatusFailed'));
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <ActivityIndicator size="large" color="#2D7DD2" />
      </View>
    );
  }

  const doctorName =
    session?.user?.full_name?.replace(/^Dr\.\s*/i, '') ||
    session?.user?.email?.split('@')[0] ||
    t('doctorHome.defaultDoctorName');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: P.pageBg }]} edges={['top']}>
      <NotificationPermissionGate />
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.topBarLogoWrap}>
            <Image source={require('@/assets/images/Logo.png')} style={styles.topBarLogo} resizeMode="contain" />
          </View>
          <View>
            <Text style={styles.topBarAppName}>Maw3edak</Text>
            <Text style={styles.topBarSubtitle}>{t('doctorHome.healthcarePlatform')}</Text>
          </View>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.topBarBtn}
            onPress={() => router.push('/(doctor-tabs)/notifications')}
          >
            <Bell size={20} color={P.text} strokeWidth={2} />
            {unreadNotifications > 0 && (
              <View style={styles.topBarBadge}>
                <Text style={styles.topBarBadgeText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topBarBtn}
            onPress={() => router.push('/(doctor-tabs)/settings')}
          >
            <Menu size={20} color={P.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={P.primary} />}
      >
        <View style={styles.body}>
          {/* Doctor welcome card */}
          <LinearGradient
            colors={isDark ? ['#16324E', '#134E47', '#3A2320'] : ['#2D7DD2', '#15C2B0', '#FF6F61']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeCard}
          >
            <View style={styles.welcomeGlow} pointerEvents="none" />
            <View style={styles.welcomeBlob} pointerEvents="none" />
            <View style={styles.dotGrid} pointerEvents="none">
              {Array.from({ length: 24 }).map((_, i) => (
                <View key={i} style={styles.dot} />
              ))}
            </View>

            <View style={styles.welcomeRow}>
              <View style={styles.welcomeLeft}>
                <Text style={styles.welcomeGreeting}>{t('doctorHome.goodDay')}</Text>
                <Text style={styles.welcomeName} numberOfLines={2}>
                  {t('doctorHome.doctorNamePrefix', { name: doctorName })}
                </Text>
                {currentClinic && (
                  <TouchableOpacity style={styles.clinicPill} onPress={openClinicModal} activeOpacity={0.8}>
                    <Building2 size={14} color="#FFFFFF" strokeWidth={2} />
                    <Text style={styles.clinicPillText} numberOfLines={1}>{currentClinic.name}</Text>
                    <ChevronDown size={14} color="#FFFFFF" strokeWidth={2.5} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.welcomeRight}>
                <View style={styles.avatarRing}>
                  <View style={styles.avatarCircle}>
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.avatarImg} resizeMode="cover" />
                    ) : (
                      <Text style={styles.avatarInitial}>{doctorName.charAt(0).toUpperCase()}</Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.statsGrid}>
            {STAT_CONFIG.map((card) => {
              const Icon = card.icon;
              const value = stats[card.key as keyof typeof stats];
              return (
                <View key={card.labelKey} style={styles.statCard}>
                  <View style={styles.statCardTop}>
                    <View style={[styles.statCardIconWrap, { backgroundColor: card.iconBg }]}>
                      <Icon size={20} color={card.color} strokeWidth={2} />
                    </View>
                    <Text style={styles.statCardLabel} numberOfLines={2}>{t(`doctorHome.${card.labelKey}`)}</Text>
                  </View>
                  <Text style={styles.statCardValue}>{value}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>{t('doctorHome.todaysPatients')}</Text>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/(doctor-tabs)/appointments', params: { filter: 'today', status: 'scheduled' } })}
              >
                <Text style={styles.seeAll}>{t('doctorHome.seeAll')}</Text>
              </TouchableOpacity>
            </View>

            {upcomingAppointments.length === 0 ? (
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconWrap}>
                  <Calendar size={30} color={P.primary} strokeWidth={1.6} />
                </View>
                <Text style={styles.emptyText}>{t('doctorHome.noAppointmentsToday')}</Text>
                <Text style={styles.emptySubText}>{t('doctorHome.enjoyFreeTime')}</Text>
              </View>
            ) : (
              upcomingAppointments.map((appt, idx) => (
                <View key={appt.id} style={styles.apptRow}>
                  <View style={styles.apptAvatarWrap}>
                    {appt.profileImage ? (
                      <Image source={{ uri: appt.profileImage }} style={styles.apptAvatar} />
                    ) : (
                      <LinearGradient
                        colors={idx % 2 === 0 ? ['#3B8AE0', '#2D7DD2'] : ['#1ED0BD', '#12B0A0']}
                        style={styles.apptAvatar}
                      >
                        <Text style={styles.apptAvatarInitial}>
                          {appt.patientName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </Text>
                      </LinearGradient>
                    )}
                  </View>
                  <View style={styles.apptInfo}>
                    <Text style={styles.apptName} numberOfLines={1}>{appt.patientName}</Text>
                    <View style={styles.apptTimeRow}>
                      <Clock size={12} color={P.textSecondary} strokeWidth={2} />
                      <Text style={styles.apptMetaTxt}>{appt.time}</Text>
                    </View>
                    {appt.clinicName && (
                      <View style={styles.apptClinicRow}>
                        <Building2 size={12} color={P.textSecondary} strokeWidth={2} />
                        <Text style={styles.apptMetaTxt} numberOfLines={1} ellipsizeMode="tail">{appt.clinicName}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.apptActions}>
                    <TouchableOpacity style={styles.apptDoneBtn} onPress={() => handleUpdateAppointmentStatus(appt.id, 'completed')}>
                      <CheckCircle size={14} color="#FFFFFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.apptCancelBtn} onPress={() => handleUpdateAppointmentStatus(appt.id, 'cancelled')}>
                      <X size={14} color={P.danger} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('doctorHome.quickAccess')}</Text>
            <View style={styles.navGrid}>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={styles.navItem}
                    activeOpacity={0.97}
                    onPress={() => router.push(item.route as any)}
                  >
                    <View style={[styles.navIconWrap, { backgroundColor: item.bg }]}>
                      <Icon size={26} color={item.color} strokeWidth={2} />
                    </View>
                    <Text style={styles.navLabel} numberOfLines={2}>{t(`doctorHome.${item.labelKey}`)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {(() => {
            // Show only the specialization cards whose module the doctor has
            // (via their accessible doctor records). Hide the section if none.
            const visibleSpecs = SPEC_ITEMS.filter((item) =>
              availableModules.includes(item.module)
            );

            if (visibleSpecs.length === 0) {
              return null;
            }

            return (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('doctorHome.specializations')}</Text>
                <View style={styles.specList}>
                  {visibleSpecs.map((item) => {
                    const Icon = item.icon;
                    return (
                      <TouchableOpacity
                        key={item.labelKey}
                        style={styles.specCard}
                        activeOpacity={0.9}
                        onPress={() => router.push(item.route as any)}
                      >
                        <View style={[styles.specIconWrap, { backgroundColor: item.bg }]}>
                          <Icon size={22} color={item.color} strokeWidth={2} />
                        </View>
                        <Text style={styles.specLabel} numberOfLines={1}>{t(`doctorHome.${item.labelKey}`)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })()}

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>

      <Modal visible={showClinicModal} transparent animationType="fade" statusBarTranslucent onRequestClose={closeClinicModal}>
        <BlurView
          intensity={Platform.OS === 'android' ? 40 : 28}
          tint={isDark ? 'dark' : 'light'}
          style={styles.clinicModalBlur}
        >
          {/* Dim layer + tap-outside-to-close */}
          <TouchableOpacity
            style={styles.clinicModalScrim}
            activeOpacity={1}
            onPress={closeClinicModal}
          />

          <SafeAreaView style={styles.clinicModalCenter} pointerEvents="box-none">
            <View
              style={[
                styles.clinicModalCard,
                { backgroundColor: P.cardBg, borderColor: P.border },
              ]}
            >
              {/* Header (fixed) */}
              <View style={styles.clinicModalHead}>
                <View style={[styles.clinicModalHeadIcon, { backgroundColor: P.lightBlue }]}>
                  <Building2 size={20} color={P.primary} strokeWidth={2} />
                </View>
                <View style={styles.clinicModalHeadText}>
                  <Text style={[styles.clinicModalTitle, { color: P.text }]}>
                    {t('doctorHome.switchClinic')}
                  </Text>
                  <Text style={[styles.clinicModalSubtitle, { color: P.textSecondary }]}>
                    {t('doctorHome.chooseClinic')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={closeClinicModal}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={[styles.clinicModalClose, { backgroundColor: P.rowBg }]}
                >
                  <X size={20} color={P.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Search (fixed) */}
              <View style={[styles.clinicSearchWrap, { backgroundColor: P.rowBg, borderColor: P.border }]}>
                <Building2 size={16} color={P.textSecondary} strokeWidth={2} style={styles.clinicSearchIcon} />
                <TextInput
                  value={clinicSearch}
                  onChangeText={setClinicSearch}
                  placeholder={t('doctorHome.searchClinics')}
                  placeholderTextColor={P.textSecondary}
                  style={[styles.clinicSearchInput, { color: P.text }]}
                  autoCorrect={false}
                />
                {clinicSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setClinicSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X size={16} color={P.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Clinic list (only this scrolls) */}
              <FlatList
                data={filteredClinics}
                keyExtractor={(item) => item.id}
                style={styles.clinicList}
                contentContainerStyle={filteredClinics.length === 0 && styles.clinicListEmptyContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
                ListEmptyComponent={
                  <Text style={[styles.clinicModalEmptyText, { color: P.textSecondary }]}>
                    {clinics.length === 0
                      ? t('doctorHome.noClinicsAvailable')
                      : t('doctorHome.noClinicsFound')}
                  </Text>
                }
                renderItem={({ item: clinic }) => {
                  const isActive = currentClinic?.id === clinic.id;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.clinicCardRow,
                        { backgroundColor: P.rowBg, borderColor: P.border },
                        isActive && { borderColor: P.primary, backgroundColor: P.lightBlue },
                      ]}
                      onPress={() => handleSwitchClinic(clinic)}
                      disabled={switchingClinic}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.clinicCardIcon, { backgroundColor: isActive ? P.primary : P.avatarBg }]}>
                        <Building2 size={18} color={isActive ? '#FFFFFF' : P.primary} strokeWidth={2} />
                      </View>
                      <View style={styles.clinicCardText}>
                        <Text style={[styles.clinicCardName, { color: P.text }]} numberOfLines={1}>
                          {clinic.name}
                        </Text>
                        {clinic.location ? (
                          <Text style={[styles.clinicCardLocation, { color: P.textSecondary }]} numberOfLines={1}>
                            {clinic.location}
                          </Text>
                        ) : null}
                      </View>
                      {isActive && (
                        <View style={[styles.clinicActiveBadge, { backgroundColor: P.primary }]}>
                          <Text style={styles.clinicActiveBadgeText}>{t('doctorHome.active')}</Text>
                        </View>
                      )}
                      <View
                        style={[
                          styles.clinicRadio,
                          { borderColor: isActive ? P.primary : P.borderStrong },
                          isActive && { backgroundColor: P.primary },
                        ]}
                      >
                        {isActive && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />

              {/* Footer (fixed, inside the card) */}
              <View style={[styles.clinicModalFooter, { borderTopColor: P.border }]}>
                <Check size={13} color={P.green} strokeWidth={2.5} />
                <Text style={[styles.clinicModalFooterText, { color: P.textSecondary }]}>
                  {t('doctorHome.dataSecure')}
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (P: Palette) => StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: P.pageBg,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topBarLogoWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: P.elevatedBg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  topBarLogo: {
    width: 34,
    height: 34,
    borderRadius: 8,
  },
  topBarAppName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
    color: P.text,
  },
  topBarSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
    color: P.textSecondary,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topBarBtn: {
    width: 44,
    height: 44,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: P.elevatedBg,
    borderWidth: 1,
    borderColor: P.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 28,
    elevation: 3,
  },
  topBarBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6F61',
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: P.elevatedBg,
  },
  topBarBadgeText: { fontSize: 8, fontWeight: '700', color: '#FFF' },

  body: { paddingHorizontal: 20, paddingTop: 8 },

  // Doctor welcome card
  welcomeCard: {
    borderRadius: 28,
    padding: 22,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#2D7DD2',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 40,
    elevation: 6,
  },
  welcomeGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -90,
    right: -60,
  },
  welcomeBlob: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -90,
    left: -40,
  },
  dotGrid: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 66,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    opacity: 0.5,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeLeft: { flex: 1, paddingRight: 14 },
  welcomeGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '500', marginBottom: 4 },
  welcomeName: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 12, lineHeight: 32 },
  clinicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  clinicPillText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    maxWidth: SCREEN_WIDTH * 0.34,
  },
  welcomeRight: {
    alignItems: 'center',
  },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 999 },
  avatarInitial: { fontSize: 36, fontWeight: '800', color: P.primary },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 16,
  },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 110,
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 22,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 28,
    elevation: 3,
  },
  statCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statCardLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: P.text,
  },
  statCardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    color: P.primary,
  },

  card: {
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 28,
    padding: 22,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 3,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: P.text },
  seeAll: { fontSize: 14, fontWeight: '600', color: P.primary },

  emptyWrap: { paddingVertical: 24, alignItems: 'center', gap: 8 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: P.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  emptyText: { fontSize: 16, fontWeight: '700', color: P.text },
  emptySubText: { fontSize: 13, fontWeight: '500', color: P.textSecondary },

  apptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.rowBg,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  apptAvatarWrap: { marginRight: 12 },
  apptAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  apptAvatarInitial: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  apptInfo: { flex: 1, minWidth: 0 },
  apptName: { fontSize: 15, fontWeight: '700', color: P.text, marginBottom: 4 },
  apptTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  apptClinicRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  apptMetaTxt: { fontSize: 12, color: P.textSecondary, flexShrink: 1 },
  apptActions: { flexDirection: 'row', gap: 8, marginLeft: 8, flexShrink: 0 },
  apptDoneBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#15C2B0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  apptCancelBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: P.cancelBtnBg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 21, fontWeight: '800', color: P.text, marginBottom: 14 },

  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  navItem: {
    width: (SCREEN_WIDTH - 40 - 42) / 4,
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 6,
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 28,
    elevation: 3,
  },
  navIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  navLabel: { fontSize: 13, fontWeight: '700', color: P.text, textAlign: 'center', lineHeight: 16 },

  specList: { gap: 12 },
  specCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 28,
    elevation: 3,
  },
  specIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  specLabel: { fontSize: 15, fontWeight: '700', color: P.text },

  // --- Switch Clinic centered modal ---
  clinicModalBlur: {
    flex: 1,
  },
  clinicModalScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,6,23,0.55)',
  },
  clinicModalCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  clinicModalCard: {
    width: CLINIC_MODAL_WIDTH,
    maxHeight: CLINIC_MODAL_MAX_HEIGHT,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    paddingTop: 18,
    // soft shadow / glow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 24,
  },
  clinicModalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 14,
    gap: 12,
  },
  clinicModalHeadIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clinicModalHeadText: { flex: 1 },
  clinicModalTitle: { fontSize: 18, fontWeight: '700' },
  clinicModalSubtitle: { fontSize: 13, marginTop: 2 },
  clinicModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clinicSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  clinicSearchIcon: { opacity: 0.8 },
  clinicSearchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  clinicList: {
    flexGrow: 0,
    paddingHorizontal: 18,
  },
  clinicListEmptyContent: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  clinicModalEmptyText: { fontSize: 14, textAlign: 'center' },
  clinicCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  clinicCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clinicCardText: { flex: 1, gap: 2 },
  clinicCardName: { fontSize: 15, fontWeight: '600' },
  clinicCardLocation: { fontSize: 12.5 },
  clinicActiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  clinicActiveBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  clinicRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clinicModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderTopWidth: 1,
  },
  clinicModalFooterText: { fontSize: 12.5, fontWeight: '500' },
});
