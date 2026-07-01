import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform, AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Home, CalendarDays, Settings as SettingsIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { config } from '@/utils/config';
import { brand, shadow } from '@/constants/brand';

// Dedicated bottom-tab shell for RECEPTIONISTS: "Book" + "My Appointments".
// Kept separate from the doctor tabs so the receptionist gets a purpose-built
// booking experience and the doctor screens stay untouched.
export default function ReceptionTabsLayout() {
  const { colors } = useTheme();
  const { session, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();

  // Revoke-aware: if this device's session has been invalidated server-side,
  // bounce back to login. Fails open on network/server errors.
  useEffect(() => {
    let cancelled = false;

    const validateSession = async () => {
      const token = session?.access_token;
      if (!token) return;
      try {
        const response = await fetch(`${config.supabaseUrl}/functions/v1/mobile-validate-session`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'X-Session-Token': token,
            'Content-Type': 'application/json',
          },
        });
        const result = await response.json().catch(() => null);
        if (!cancelled && result && result.valid === false) {
          await signOut();
          router.replace('/login');
        }
      } catch {
        // keep session, retry next foreground
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
  }, [session?.access_token, router, signOut]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brand.blue,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarHideOnKeyboard: true,
        // Always stack icon above label. Without this, React Navigation switches
        // to a side-by-side ("beside-icon") layout on wider bars, which squeezes
        // each tab and truncates the long "Appointments" label to "Appointme…".
        tabBarLabelPosition: 'below-icon',
        // Centered, raised "floating pill" bar: a fixed-width rounded bar lifted
        // off the bottom edge and horizontally centered, so Home / Appointments /
        // Settings sit grouped in the middle (rather than spread full-width).
        tabBarStyle: {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 30,
          height: 64,
          width: '92%',
          maxWidth: 420,
          alignSelf: 'center',
          marginBottom: insets.bottom + 12,
          paddingBottom: 8,
          paddingTop: 8,
          paddingHorizontal: 4,
          ...(shadow.lg as object),
        },
        tabBarItemStyle: { borderRadius: 22, paddingHorizontal: 2 },
        tabBarAllowFontScaling: false,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: Platform.OS === 'android' ? 4 : 2,
        },
        tabBarIconStyle: { marginTop: 4 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('reception.tabHome'),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: t('reception.tabAppointments'),
          tabBarIcon: ({ color, size }) => <CalendarDays size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('reception.tabSettings'),
          tabBarIcon: ({ color, size }) => <SettingsIcon size={size} color={color} strokeWidth={2} />,
        }}
      />
      {/* Reached from Home quick actions / top bar; not tabs of their own. */}
      <Tabs.Screen name="book-appointment" options={{ href: null }} />
      <Tabs.Screen name="create-invoice" options={{ href: null }} />
      <Tabs.Screen name="statement" options={{ href: null }} />
      <Tabs.Screen name="patients" options={{ href: null }} />
      <Tabs.Screen name="patient-detail" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="doctor-calendar" options={{ href: null }} />
      <Tabs.Screen name="patient-calendar" options={{ href: null }} />
    </Tabs>
  );
}
