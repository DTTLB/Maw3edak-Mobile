import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  CalendarPlus,
  CalendarDays,
  CalendarClock,
  CalendarRange,
  Users,
  Bell,
  Menu,
  ChevronRight,
  Receipt,
  FileText,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { getDoctorPalette, DoctorPalette } from '@/utils/doctorPalette';
import { config } from '@/utils/config';

// Receptionist home dashboard — mirrors the doctor home's welcome card (profile
// image + greeting) and surfaces the booking flow plus other areas as quick
// actions, instead of dropping straight into the wizard.
export default function ReceptionHomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useAuth();
  const { isDark } = useTheme();
  const P = useMemo(() => getDoctorPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(P), [P]);

  const userId = session?.user?.realUserId || session?.user?.global_id || '';
  const companyId = session?.user?.company_id || null;
  const fullName =
    session?.user?.full_name?.trim() ||
    session?.user?.email?.split('@')[0] ||
    t('reception.receptionist');

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Reuse the doctor dashboard-stats endpoint purely to fetch the profile image
  // associated with this account (resolved from global_id). Non-fatal.
  const loadProfileImage = useCallback(async () => {
    try {
      if (!userId) return;
      const res = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-doctor-dashboard-stats?global_id=${userId}${companyId ? `&company_id=${companyId}` : ''}`,
        { headers: { Authorization: `Bearer ${config.supabaseAnonKey}`, 'Content-Type': 'application/json' } }
      );
      if (res.ok) {
        const data = await res.json();
        setProfileImage(data.profileImage || null);
      }
    } catch {
      // ignore — avatar falls back to the initial
    }
  }, [userId, companyId]);

  useEffect(() => {
    loadProfileImage();
  }, [loadProfileImage]);

  useFocusEffect(
    useCallback(() => {
      loadProfileImage();
    }, [loadProfileImage])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileImage();
    setRefreshing(false);
  };

  const handleLogout = () => {
    router.push('/(reception-tabs)/settings' as any);
  };

  // Booking lives in the big CTA above and Settings is its own tab, so the grid
  // only carries actions that aren't already one tap away elsewhere.
  const QUICK_ACTIONS = [
    {
      key: 'doctor-calendar',
      label: t('reception.qaDoctorCalendar'),
      desc: t('reception.qaDoctorCalendarDesc'),
      icon: CalendarClock,
      color: '#7C3AED',
      bg: isDark ? '#2E1D4D' : '#F1EBFB',
      route: '/(reception-tabs)/doctor-calendar',
    },
    {
      key: 'appointments',
      label: t('reception.qaAppointments'),
      desc: t('reception.qaAppointmentsDesc'),
      icon: CalendarDays,
      color: '#15C2B0',
      bg: isDark ? '#0E3B37' : '#E4F8F4',
      route: '/(reception-tabs)/appointments',
    },
    {
      key: 'patients',
      label: t('reception.qaPatients'),
      desc: t('reception.qaPatientsDesc'),
      icon: Users,
      color: '#2D7DD2',
      bg: isDark ? '#16324E' : '#EAF3FC',
      route: '/(reception-tabs)/patients',
    },
    {
      key: 'patient-calendar',
      label: t('reception.qaPatientCalendar'),
      desc: t('reception.qaPatientCalendarDesc'),
      icon: CalendarRange,
      color: '#FF6F61',
      bg: isDark ? '#3A2320' : '#FDECEA',
      route: '/(reception-tabs)/patient-calendar',
    },
    {
      key: 'create-invoice',
      label: t('reception.qaCreateInvoice'),
      desc: t('reception.qaCreateInvoiceDesc'),
      icon: Receipt,
      color: '#0EA5A4',
      bg: isDark ? '#0E3B37' : '#E4F8F4',
      route: '/(reception-tabs)/create-invoice',
    },
    {
      key: 'statement',
      label: t('reception.qaStatement'),
      desc: t('reception.qaStatementDesc'),
      icon: FileText,
      color: '#2563EB',
      bg: isDark ? '#16324E' : '#EAF3FC',
      route: '/(reception-tabs)/statement',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: P.pageBg }]} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.topBarLogoWrap}>
            <Image source={require('@/assets/images/Logo.png')} style={styles.topBarLogo} resizeMode="contain" />
          </View>
          <View>
            <Text style={styles.topBarAppName}>Maw3edak</Text>
            <Text style={styles.topBarSubtitle}>{t('reception.portalSubtitle')}</Text>
          </View>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.topBarBtn} onPress={() => router.push('/(reception-tabs)/notifications' as any)}>
            <Bell size={20} color={P.text} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBarBtn} onPress={handleLogout}>
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
          {/* Welcome card */}
          <LinearGradient
            colors={isDark ? ['#16324E', '#134E47', '#3A2320'] : ['#2D7DD2', '#15C2B0', '#FF6F61']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeCard}
          >
            <View style={styles.welcomeGlow} pointerEvents="none" />
            <View style={styles.welcomeBlob} pointerEvents="none" />

            <View style={styles.welcomeRow}>
              <View style={styles.welcomeLeft}>
                <Text style={styles.welcomeGreeting}>{t('reception.goodDay')}</Text>
                <Text style={styles.welcomeName} numberOfLines={2}>{fullName}</Text>
              </View>
              <View style={styles.avatarRing}>
                <View style={styles.avatarCircle}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.avatarImg} resizeMode="cover" />
                  ) : (
                    <Text style={styles.avatarInitial}>{fullName.charAt(0).toUpperCase()}</Text>
                  )}
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Primary CTA — Book appointment */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/(reception-tabs)/book-appointment' as any)}
            style={styles.ctaWrap}
          >
            <LinearGradient colors={['#2D7DD2', '#15C2B0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
              <View style={styles.ctaIcon}>
                <CalendarPlus size={26} color="#FFFFFF" strokeWidth={2} />
              </View>
              <View style={styles.ctaText}>
                <Text style={styles.ctaTitle}>{t('reception.qaBook')}</Text>
                <Text style={styles.ctaDesc}>{t('reception.qaBookDesc')}</Text>
              </View>
              <ChevronRight size={24} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Quick actions */}
          <Text style={styles.sectionTitle}>{t('reception.quickActions')}</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <TouchableOpacity
                  key={a.key}
                  style={styles.actionCard}
                  activeOpacity={0.9}
                  onPress={() => router.push(a.route as any)}
                >
                  <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
                    <Icon size={24} color={a.color} strokeWidth={2} />
                  </View>
                  <Text style={styles.actionLabel} numberOfLines={1}>{a.label}</Text>
                  <Text style={styles.actionDesc} numberOfLines={2}>{a.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (P: DoctorPalette) =>
  StyleSheet.create({
    container: { flex: 1 },
    scroll: { flex: 1 },

    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: P.pageBg,
    },
    topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    topBarLogoWrap: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: P.cardBg,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 20,
      elevation: 3,
    },
    topBarLogo: { width: 34, height: 34, borderRadius: 8 },
    topBarAppName: { fontSize: 18, fontWeight: '800', letterSpacing: 0.2, color: P.text },
    topBarSubtitle: { fontSize: 12, fontWeight: '500', marginTop: 1, color: P.textSecondary },
    topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    topBarBtn: {
      width: 44,
      height: 44,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: P.cardBg,
      borderWidth: 1,
      borderColor: P.border,
    },

    body: { paddingHorizontal: 20, paddingTop: 8 },

    welcomeCard: {
      borderRadius: 28,
      padding: 22,
      marginBottom: 18,
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
    welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    welcomeLeft: { flex: 1, paddingRight: 14 },
    welcomeGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '500', marginBottom: 4 },
    welcomeName: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 12, lineHeight: 30 },
    rolePill: {
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
    rolePillText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600', maxWidth: 200 },
    avatarRing: {
      width: 88,
      height: 88,
      borderRadius: 44,
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
    avatarInitial: { fontSize: 34, fontWeight: '800', color: P.primary },

    ctaWrap: {
      borderRadius: 22,
      overflow: 'hidden',
      marginBottom: 22,
      shadowColor: '#15C2B0',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 5,
    },
    cta: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
    ctaIcon: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.22)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    ctaText: { flex: 1 },
    ctaTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
    ctaDesc: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 },

    sectionTitle: { fontSize: 20, fontWeight: '800', color: P.text, marginBottom: 14 },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    actionCard: {
      flexBasis: '47%',
      flexGrow: 1,
      minHeight: 130,
      backgroundColor: P.cardBg,
      borderWidth: 1,
      borderColor: P.border,
      borderRadius: 22,
      padding: 16,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.06,
      shadowRadius: 28,
      elevation: 3,
    },
    actionIcon: {
      width: 52,
      height: 52,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    actionLabel: { fontSize: 15, fontWeight: '800', color: P.text },
    actionDesc: { fontSize: 12.5, color: P.textSecondary, marginTop: 3, lineHeight: 17 },
  });
