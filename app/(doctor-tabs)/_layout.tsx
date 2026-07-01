import { Tabs , useRouter, usePathname } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { getDoctorPalette } from '@/utils/doctorPalette';
import { config } from '@/utils/config';
import { Home, Calendar, Settings, QrCode } from 'lucide-react-native';
import { brand, shadow } from '@/constants/brand';
import { TabBarPillIcon } from '@/components/TabBarPillIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, BackHandler, AppState, Alert } from 'react-native';
import { useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';

export default function DoctorTabsLayout() {
  const { isDark } = useTheme();
  const { session, signOut } = useAuth();
  const P = getDoctorPalette(isDark);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const isSigningOut = useRef(false);

  // Force re-login when this device's session has been revoked server-side
  // (e.g. the doctor changed their password on another device). We re-check on
  // mount and whenever the app returns to the foreground.
  useEffect(() => {
    let cancelled = false;

    const forceLogout = async () => {
      if (isSigningOut.current) return;
      isSigningOut.current = true;
      try {
        await signOut();
      } catch (e) {
        console.warn('Forced sign out error:', e);
      }
      Alert.alert(t('common.sessionEndedTitle'), t('common.sessionEndedMessage'));
      if (Platform.OS === 'web') {
        window.location.replace('/login');
      } else {
        router.replace('/login');
      }
    };

    const validateSession = async () => {
      const token = session?.access_token;
      if (!token) return;
      try {
        const response = await fetch(
          `${config.supabaseUrl}/functions/v1/mobile-validate-session`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${config.supabaseAnonKey}`,
              'X-Session-Token': token,
              'Content-Type': 'application/json',
            },
          }
        );
        const result = await response.json().catch(() => null);
        // Only bounce on an explicit invalid verdict — the endpoint fails open on
        // network/server errors so we never log a doctor out incorrectly.
        if (!cancelled && result && result.valid === false) {
          await forceLogout();
        }
      } catch (e) {
        // Network error — keep the session, try again next foreground.
        console.warn('Session validation skipped:', e);
      }
    };

    validateSession();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') validateSession();
    });

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [session?.access_token, router, signOut, t]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If we're on the main tab screens (index, appointments, settings), exit the app
      if (pathname === '/(doctor-tabs)' || pathname === '/(doctor-tabs)/appointments' || pathname === '/(doctor-tabs)/settings') {
        BackHandler.exitApp();
        return true;
      }
      // For other screens, allow default back navigation
      return false;
    });

    return () => backHandler.remove();
  }, [pathname]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brand.blue,
        tabBarInactiveTintColor: P.textSecondary,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: P.cardBg,
          borderTopColor: P.border,
          borderTopWidth: 1,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
          ...(shadow.lg as object),
        },
        tabBarLabelStyle: {
          fontSize: 11.5,
          fontWeight: '700',
          marginBottom: Platform.OS === 'android' ? 6 : 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarPillIcon Icon={Home} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: t('tabs.appointments'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarPillIcon Icon={Calendar} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="dental"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="vision"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="questions"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="time-management"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="patient-answers"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="patient-appointments"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: t('tabs.scan'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarPillIcon Icon={QrCode} focused={focused} color={color} />
          ),
        }}
        listeners={{
          // Don't navigate to the placeholder tab — open the full-screen scanner.
          tabPress: (e) => {
            e.preventDefault();
            router.push('/doctor-link-clinic');
          },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarPillIcon Icon={Settings} focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
