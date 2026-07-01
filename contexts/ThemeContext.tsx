import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { config } from '@/utils/config';

type Theme = 'light' | 'dark';

// Device-local cache of the chosen theme. This guarantees the choice survives a
// refresh / logout-login on the same device even if the backend read is slow,
// blocked by RLS, or the edge function is unavailable. The backend remains the
// cross-device source of truth and overrides this when its read succeeds.
const THEME_STORAGE_KEY = 'app_theme';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => Promise<void>;
  colors: typeof lightColors;
}

// Maw3edak premium medical brand palette — see constants/brand.ts
const lightColors = {
  background: '#F8FAFC',
  backgroundSecondary: '#F8FAFC',
  backgroundTertiary: '#F1F5F9',
  card: '#FFFFFF',
  inputBackground: '#F8FAFC',
  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#EEF1F6',
  primary: '#2D7DD2', // brand Blue
  primaryLight: '#EAF3FC',
  success: '#15C2B0', // brand Turquoise
  successLight: '#E4F8F4',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#FF6F61', // brand Coral
  errorLight: '#FFEDEB',
  info: '#2D7DD2',
  infoLight: '#EAF3FC',
  turquoise: '#15C2B0',
  turquoiseLight: '#E4F8F4',
  coral: '#FF6F61',
  coralLight: '#FFEDEB',
  shadow: 'rgba(15, 23, 42, 0.1)',
};

const darkColors = {
  background: '#0B1220',
  backgroundSecondary: '#111A2B',
  backgroundTertiary: '#1F2937',
  card: '#1E293B',
  inputBackground: '#243044',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  border: '#334155',
  borderLight: '#475569',
  primary: '#4FA3E6', // brand Blue (lightened)
  primaryLight: '#16324E',
  success: '#2BD4C2', // brand Turquoise (lightened)
  successLight: '#0E3B37',
  warning: '#F59E0B',
  warningLight: '#78350F',
  error: '#FF8475', // brand Coral (lightened)
  errorLight: '#4A211D',
  info: '#4FA3E6',
  infoLight: '#16324E',
  turquoise: '#2BD4C2',
  turquoiseLight: '#0E3B37',
  coral: '#FF8475',
  coralLight: '#4A211D',
  shadow: 'rgba(0, 0, 0, 0.3)',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    loadThemePreference();
  }, [session?.patient?.id, session?.user?.id, session?.user_type]);

  // Apply a theme to the UI and persist it to the device cache.
  const applyAndCacheTheme = async (next: Theme) => {
    setTheme(next);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Non-fatal: the theme still applies for this session.
    }
  };

  const loadThemePreference = async () => {
    // 1) Apply the device-cached theme first so a refresh / logout-login keeps
    //    the user's choice instantly — even before (or without) a backend
    //    response. This is what makes the choice survive a reload.
    try {
      const cached = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (cached === 'dark' || cached === 'light') {
        setTheme(cached);
      }
    } catch {
      // ignore cache read errors
    }

    // 2) Sync from the backend (the cross-device source of truth). Only override
    //    the cached value when the read genuinely SUCCEEDS — never force 'light'
    //    on a failed response, or the saved choice would be lost on refresh.
    if (
      (session?.user_type === 'doctor' || session?.user_type === 'receptionist') &&
      session?.user?.id &&
      session?.access_token
    ) {
      try {
        const response = await fetch(
          `${config.supabaseUrl}/functions/v1/mobile-get-doctor-settings`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${config.supabaseAnonKey}`,
              'Content-Type': 'application/json',
              'X-Session-Token': session.access_token,
            },
          }
        );

        const data = await response.json();
        if (response.ok && data.success) {
          await applyAndCacheTheme(data.settings.darkmode ? 'dark' : 'light');
        }
      } catch (error) {
        console.error('Error loading doctor theme preference:', error);
      }
    } else if (session?.patient?.id) {
      try {
        const medicalId = session.patient.medical_id;
        const response = await fetch(
          `${config.supabaseUrl}/functions/v1/mobile-get-primary-settings?global_id=&user_type=patient&medical_id=${encodeURIComponent(medicalId)}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${config.supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const data = await response.json();
        if (response.ok && data.success) {
          await applyAndCacheTheme(data.darkmode ? 'dark' : 'light');
        }
      } catch (error) {
        console.error('Error loading patient theme preference:', error);
      }
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';

    try {
      if (
        (session?.user_type === 'doctor' || session?.user_type === 'receptionist') &&
        session?.user?.id
      ) {
        // Call edge function to update darkmode. Receptionists share the doctor
        // (users table) account system; the endpoint updates their own row.
        const response = await fetch(
          `${config.supabaseUrl}/functions/v1/mobile-update-darkmode`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: session.user.id,
              user_type: 'doctor',
              darkmode: newTheme === 'dark',
            }),
          }
        );

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to update dark mode');
        }
      } else if (session?.patient?.id) {
        // Call edge function to update darkmode for patients
        const response = await fetch(
          `${config.supabaseUrl}/functions/v1/mobile-update-darkmode`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              patient_id: session.patient.id,
              user_type: 'patient',
              darkmode: newTheme === 'dark',
            }),
          }
        );

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to update dark mode');
        }
      } else {
        return;
      }

      await applyAndCacheTheme(newTheme);
    } catch (error) {
      console.error('Error toggling theme:', error);
      throw error;
    }
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        colors,
      }}
    >
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
