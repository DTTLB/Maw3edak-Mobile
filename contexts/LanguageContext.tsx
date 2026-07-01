import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { useAuth } from './AuthContext';
import { supabase } from '@/utils/supabase';
import { config } from '@/utils/config';
import i18n, {
  LANGUAGES,
  LanguageCode,
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
} from '@/utils/i18n';

const STORAGE_KEY = 'app_language';

interface LanguageContextType {
  language: LanguageCode;
  isRTL: boolean;
  languages: typeof LANGUAGES;
  /**
   * Change the app language. Persists to the device cache and (when logged in)
   * to the database. Returns true if the layout direction (RTL/LTR) changed,
   * which requires a full app restart to take visual effect.
   */
  setLanguage: (code: LanguageCode) => Promise<boolean>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function isRTLFor(code: LanguageCode): boolean {
  return LANGUAGES.find((l) => l.code === code)?.isRTL ?? false;
}

function applyDirection(code: LanguageCode) {
  const shouldBeRTL = isRTLFor(code);
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
    return true; // direction changed
  }
  return false;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuth();
  const [language, setLanguageState] = useState<LanguageCode>(
    (i18n.language as LanguageCode) || DEFAULT_LANGUAGE
  );

  // Apply a resolved language to i18n + layout direction + local state.
  const applyLanguage = async (code: LanguageCode) => {
    await i18n.changeLanguage(code);
    applyDirection(code);
    setLanguageState(code);
    await AsyncStorage.setItem(STORAGE_KEY, code);
  };

  // On first mount (pre-login), fall back to the cached choice or device language.
  useEffect(() => {
    (async () => {
      try {
        let code = await AsyncStorage.getItem(STORAGE_KEY);
        if (!isSupportedLanguage(code)) {
          const deviceCode = Localization.getLocales?.()[0]?.languageCode ?? null;
          code = isSupportedLanguage(deviceCode) ? deviceCode : DEFAULT_LANGUAGE;
        }
        await applyLanguage(code as LanguageCode);
      } catch (error) {
        console.error('Error loading cached language:', error);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the session changes (login / switch / logout), resolve the language.
  useEffect(() => {
    // Wait until auth has resolved on cold start; otherwise an already-logged-in
    // user would briefly flash English before their saved language loads.
    if (isLoading) return;

    if (!session) {
      // Logged out: the login / auth screens are always shown in English,
      // never the previously signed-in doctor's or patient's language.
      applyLanguage(DEFAULT_LANGUAGE);
      return;
    }

    loadLanguageFromDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.patient?.id, session?.user?.id, session?.user_type, isLoading]);

  const loadLanguageFromDB = async () => {
    try {
      if (session?.user_type === 'doctor' && session?.user?.id && session?.access_token) {
        const response = await fetch(
          `${config.supabaseUrl}/functions/v1/mobile-get-doctor-settings`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${config.supabaseAnonKey}`,
              'Content-Type': 'application/json',
              'X-Session-Token': session.access_token,
            },
          }
        );
        const data = await response.json();
        if (response.ok && data.success && isSupportedLanguage(data.settings?.language)) {
          await applyLanguage(data.settings.language);
        }
      } else if (session?.patient?.id) {
        const { data, error } = await supabase
          .from('user_patients')
          .select('language')
          .eq('is_deleted', false)
          .eq('id', session.patient.id)
          .maybeSingle();

        if (!error && isSupportedLanguage(data?.language)) {
          await applyLanguage(data.language as LanguageCode);
        }
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  };

  const persistToDB = async (code: LanguageCode) => {
    try {
      if (session?.user_type === 'doctor' && session?.user?.id) {
        await fetch(`${config.supabaseUrl}/functions/v1/mobile-update-language`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: session.user.id,
            user_type: 'doctor',
            language: code,
          }),
        });
      } else if (session?.patient?.id) {
        await fetch(`${config.supabaseUrl}/functions/v1/mobile-update-language`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            patient_id: session.patient.id,
            user_type: 'patient',
            language: code,
          }),
        });
      }
    } catch (error) {
      // Non-fatal: the choice is still cached locally and applied in the UI.
      console.error('Error saving language to DB:', error);
    }
  };

  const setLanguage = async (code: LanguageCode): Promise<boolean> => {
    try {
      // Determine the direction change from the previous vs. new language's RTL
      // flag — this is reliable, whereas I18nManager.isRTL can be stale in Expo Go.
      const directionChanged = isRTLFor(language) !== isRTLFor(code);

      await AsyncStorage.setItem(STORAGE_KEY, code);
      await i18n.changeLanguage(code);
      setLanguageState(code);
      await persistToDB(code);

      if (directionChanged) {
        I18nManager.allowRTL(isRTLFor(code));
        I18nManager.forceRTL(isRTLFor(code));
      }
      return directionChanged;
    } catch (error) {
      console.error('Error setting language:', error);
      return false;
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        isRTL: isRTLFor(language),
        languages: LANGUAGES,
        setLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
