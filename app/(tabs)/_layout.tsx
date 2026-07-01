import { Tabs , useRouter, usePathname } from 'expo-router';
import { Home, Calendar, QrCode, Brain } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, BackHandler } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { brand, shadow } from '@/constants/brand';
import { TabBarPillIcon } from '@/components/TabBarPillIcon';
import { useEffect } from 'react';

import { useTranslation } from 'react-i18next';
import { AiFeatureProvider, useAiFeature } from '@/contexts/AiFeatureContext';

export default function TabLayout() {
  // Provide the AI feature flag to both this layout (to toggle the tab) and the
  // tab screens below it (so pull-to-refresh can re-check the setting).
  return (
    <AiFeatureProvider>
      <TabLayoutInner />
    </AiFeatureProvider>
  );
}

function TabLayoutInner() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { aiEnabled } = useAiFeature();

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If we're on the main tab screens (index or appointments), exit the app
      if (pathname === '/(tabs)' || pathname === '/(tabs)/appointments') {
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
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
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
      }}>
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
        name="ai"
        options={
          aiEnabled
            ? {
                title: t('tabs.ai'),
                tabBarIcon: ({ color, focused }) => (
                  <TabBarPillIcon Icon={Brain} focused={focused} color={color} />
                ),
              }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="visit-history"
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
          tabPress: (e) => {
            // Don't navigate to the placeholder tab — open the full-screen scanner.
            e.preventDefault();
            router.push('/link-provider');
          },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
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
        name="orders"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="prescriptions"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="medications-today"
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
        name="dental"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="statement"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="doctors"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="doctor-responses"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="packages"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
