import { useEffect, useRef, useState } from 'react';
import { Stack, router } from 'expo-router';
import {
  ThemeProvider as NavigationThemeProvider,
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import '@/utils/i18n';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { Platform, Alert, BackHandler } from 'react-native';
import ErrorBoundary from '@/components/ErrorBoundary';
import { BiometricAuthGate } from '@/components/BiometricAuthGate';
import { config } from '@/utils/config';
import { setupNotificationListeners, initializeBackgroundHandler } from '@/utils/notifications';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initializeFirebase } from '@/utils/firebase';

SplashScreen.preventAutoHideAsync();

// Show medication (and other local) notifications even while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Initialize Firebase first (must be at top level)
if (Platform.OS !== 'web') {
  console.log('Initializing Firebase...');
  const app = initializeFirebase();
  if (app) {
    console.log('✅ Firebase initialized successfully');
    // Initialize background notification handler after Firebase
    initializeBackgroundHandler();
  } else {
    console.error('❌ Firebase initialization failed. Notifications will not work.');
    console.error('Make sure to:');
    console.error('1. Uninstall old app completely');
    console.error('2. Run: cd android && ./gradlew clean');
    console.error('3. Rebuild: npx expo run:android');
  }
}

if (__DEV__) {
  console.log('App starting on platform:', Platform.OS);
  console.log('Environment variables loaded:', {
    supabaseUrl: config.supabaseUrl ? 'Set' : 'Missing',
    supabaseKey: config.supabaseAnonKey ? 'Set' : 'Missing',
  });
}

const handleGlobalError = (error: Error, isFatal?: boolean) => {
  console.error('Global Error:', error);
  console.error('Stack:', error.stack);
  console.error('Is Fatal:', isFatal);

  if (Platform.OS === 'android') {
    console.error('ANDROID ERROR DETAILS:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
  }
};

if (Platform.OS !== 'web' && typeof ErrorUtils !== 'undefined') {
  const defaultHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    handleGlobalError(error, isFatal);
    if (defaultHandler) {
      defaultHandler(error, isFatal);
    }
  });
}

// Bridges the app's ThemeContext into React Navigation's theme so the navigator
// container background follows dark/light mode. Without this the navigator
// defaults to a white background, which shows through the tab bar's rounded top
// corners as white triangles in dark mode (doctor / patient / reception shells).
function ThemedNavigator() {
  const { isDark, colors } = useTheme();

  const navTheme = {
    ...(isDark ? NavigationDarkTheme : NavigationDefaultTheme),
    colors: {
      ...(isDark ? NavigationDarkTheme : NavigationDefaultTheme).colors,
      background: colors.background,
      card: colors.card,
      border: colors.border,
      text: colors.text,
      primary: colors.primary,
    },
  };

  return (
    <NavigationThemeProvider value={navTheme}>
      <BiometricAuthGate onAuthComplete={() => console.log('Biometric auth completed')}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="index" options={{ gestureEnabled: false }} />
          <Stack.Screen name="login" options={{ gestureEnabled: false }} />
          <Stack.Screen
            name="(tabs)"
            options={{
              gestureEnabled: false,
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(doctor-tabs)"
            options={{
              gestureEnabled: false,
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(reception-tabs)"
            options={{
              gestureEnabled: false,
              headerShown: false,
            }}
          />
          <Stack.Screen name="link-provider" options={{ gestureEnabled: false }} />
          <Stack.Screen name="doctor-link-clinic" options={{ gestureEnabled: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </BiometricAuthGate>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  const [appReady, setAppReady] = useState(false);
  const appReadyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    let mounted = true;

    async function prepare() {
      const startTime = Date.now();
      console.log('=== APP INITIALIZATION START ===');
      console.log('Timestamp:', new Date().toISOString());

      const emergencyTimeout = setTimeout(() => {
        if (mounted && !appReadyRef.current) {
          console.error('⚠️ EMERGENCY TIMEOUT - Force starting app after 5 seconds');
          appReadyRef.current = true;
          setAppReady(true);
          SplashScreen.hideAsync().catch(() => {});
        }
      }, 5000);

      try {
        console.log('Fonts loaded:', fontsLoaded);
        console.log('Font error:', fontError);

        await Promise.race([
          new Promise((resolve) => {
            if (fontsLoaded || fontError) {
              console.log('Fonts ready immediately');
              resolve(true);
            } else {
              const fontCheck = setInterval(() => {
                if (fontsLoaded || fontError) {
                  clearInterval(fontCheck);
                  console.log('Fonts ready after check');
                  resolve(true);
                }
              }, 100);

              setTimeout(() => {
                clearInterval(fontCheck);
                console.log('Font timeout - continuing anyway');
                resolve(true);
              }, 2000);
            }
          }),
        ]);

        const elapsed = Date.now() - startTime;
        console.log(`App preparation completed in ${elapsed}ms`);
      } catch (e: any) {
        console.error('❌ Preparation error:', e);
        setError(`Initialization failed: ${e?.message || 'Unknown error'}`);
      } finally {
        clearTimeout(emergencyTimeout);
        if (mounted) {
          console.log('✓ Setting app ready');
          appReadyRef.current = true;
          setAppReady(true);
          SplashScreen.hideAsync()
            .then(() => console.log('✓ Splash screen hidden'))
            .catch((e) => console.warn('Error hiding splash:', e));
        }
      }
    }

    const initTimer = setTimeout(() => {
      console.log('Starting app initialization...');
      prepare();
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(initTimer);
    };
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (error) {
      console.error('App error state:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Startup Error', error);
      }
    }
  }, [error]);

  useEffect(() => {
    console.log('Setting up notification listeners...');
    const unsubscribe = setupNotificationListeners();
    return () => {
      console.log('Cleaning up notification listeners');
      unsubscribe();
    };
  }, []);

  // Deep-link taps on locally-presented notifications (e.g. medication reminders
  // shown while the app is in the foreground).
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data: any = response.notification.request.content.data;
      if (data?.type === 'medication_reminder') {
        router.push('/(tabs)/medications-today');
      }
    });
    return () => sub.remove();
  }, []);

  // Prevent back button from navigating to index when on authenticated screens
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // This is a fallback handler - tab layouts have their own handlers
      console.log('Root back handler triggered');
      return false; // Allow default back behavior
    });

    return () => backHandler.remove();
  }, []);

  if (!appReady) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <LanguageProvider>
          <ThemeProvider>
            <ThemedNavigator />
          </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
