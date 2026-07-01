import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/utils/supabase';
import { Session as AuthSession, AuthChangeEvent } from '@supabase/supabase-js';
import { Session, saveSession, getSession, clearSession } from '@/utils/auth';
import { resetBiometricSession } from '@/components/BiometricAuthGate';

interface AuthContextType {
  session: Session | null;
  supabaseSession: AuthSession | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  switchClinic: (clinicId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  supabaseSession: null,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {},
  switchClinic: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseSession, setSupabaseSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const storedSession = await getSession();
      if (storedSession) {
        setSession(storedSession);
      }

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        setSupabaseSession(currentSession);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };

  const switchClinic = async (clinicId: string) => {
    try {
      if (!session) {
        throw new Error('No active session');
      }

      const sessionToken = session.access_token;

      if (!sessionToken) {
        throw new Error('No session token found');
      }

      const config = require('@/utils/config').config;
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-switch-company`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'X-Session-Token': sessionToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ companyId: clinicId }),
        }
      );

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to switch company');
      }

      console.log('Switch clinic response:', result);

      // Settings from primary company are returned
      if (result.settings) {
        console.log('Primary company settings:', result.settings);
        console.log('- Biometric enabled:', result.settings.biometric_login_enabled);
        console.log('- Notifications enabled:', result.settings.allow_notifications);
        console.log('- Dark mode:', result.settings.darkmode);
      }

      const updatedSession = {
        ...session,
        user: {
          ...session.user,
          company_id: clinicId,
        },
      };

      await saveSession(updatedSession);
      setSession(updatedSession);
      console.log('Clinic switched to:', clinicId);
    } catch (error) {
      console.error('Error switching clinic:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthContext: Starting sign out...');

      // Reset biometric session flag
      resetBiometricSession();

      // Deactivate current device token (mobile only)
      if (Platform.OS !== 'web') {
        try {
          const SecureStore = require('expo-secure-store');
          const fcmTokenKey = 'fcm_token';
          const fcmToken = await SecureStore.getItemAsync(fcmTokenKey);

          if (fcmToken) {
            console.log('AuthContext: Deactivating device token...');
            const config = require('@/utils/config').config;
            const response = await fetch(
              `${config.supabaseUrl}/functions/v1/mobile-logout-device`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${config.supabaseAnonKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fcmToken }),
              }
            );

            const result = await response.json();
            if (result.success) {
              console.log('AuthContext: Device token deactivated');
            } else {
              console.warn('AuthContext: Failed to deactivate device token:', result.error);
            }
          }
        } catch (e) {
          console.warn('AuthContext: Could not deactivate device token:', e);
        }
      }

      await supabase.auth.signOut();
      console.log('AuthContext: Supabase sign out completed');

      await clearSession();
      console.log('AuthContext: Custom session cleared');

      setSession(null);
      setSupabaseSession(null);

      if (Platform.OS === 'web') {
        console.log('AuthContext: Clearing web storage completely...');
        if (typeof window !== 'undefined') {
          try {
            localStorage.clear();
            sessionStorage.clear();

            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            await AsyncStorage.clear();
            console.log('AuthContext: All storage cleared');
          } catch (e) {
            console.error('Error clearing storage:', e);
          }
        }
      }

      console.log('AuthContext: Sign out fully completed');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const initializeAuth = async () => {
      console.log('=== AUTH CONTEXT INITIALIZING ===');
      console.log('Platform:', require('react-native').Platform.OS);
      console.log('Timestamp:', new Date().toISOString());

      const emergencyTimeout = setTimeout(() => {
        if (mounted) {
          console.error('⚠️ EMERGENCY AUTH TIMEOUT - App will start without session');
          console.error('This indicates a critical issue with AsyncStorage or Supabase');
          setIsLoading(false);
        }
      }, 2000);

      try {
        console.log('Step 1: Getting stored session from AsyncStorage...');
        const sessionPromise = Promise.race([
          getSession(),
          new Promise<null>((resolve) => setTimeout(() => {
            console.warn('AsyncStorage timeout after 1s');
            resolve(null);
          }, 1000))
        ]);

        const storedSession = await sessionPromise;
        console.log('Stored session result:', storedSession ? '✓ Found' : '✗ None');

        if (storedSession && mounted) {
          console.log('Session type:', storedSession.user_type);
          console.log('User ID:', storedSession.user?.user_id || 'N/A');
          setSession(storedSession);
        }

        console.log('Step 2: Getting Supabase auth session...');
        const supabasePromise = Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null }, error: any }>((resolve) =>
            setTimeout(() => {
              console.warn('Supabase timeout after 1s');
              resolve({ data: { session: null }, error: { message: 'Timeout' } });
            }, 1000)
          )
        ]);

        const { data: { session: currentSession }, error: sessionError } = await supabasePromise;

        if (sessionError && sessionError.message !== 'Timeout') {
          console.error('❌ Supabase session error:', sessionError);
        } else if (currentSession && mounted) {
          console.log('Supabase session result: ✓ Found');
          console.log('User email:', currentSession.user?.email || 'N/A');
          setSupabaseSession(currentSession);
        } else {
          console.log('Supabase session result: ✗ None');
        }
      } catch (error: any) {
        console.error('❌ Error initializing auth:', error);
        console.error('Error type:', error?.name);
        console.error('Error message:', error?.message);
        if (error?.stack) {
          console.error('Error stack:', error.stack);
        }
      } finally {
        clearTimeout(emergencyTimeout);
        if (mounted) {
          console.log('✓ Auth initialization complete, setting isLoading to false');
          setIsLoading(false);
        }
      }
    };

    initializeAuth().catch((error) => {
      console.error('❌ Fatal error in initializeAuth:', error);
      if (mounted) {
        setIsLoading(false);
      }
    });

    try {
      console.log('Setting up auth state change listener...');
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: AuthSession | null) => {
        console.log('🔔 Auth state changed:', event);
        if (mounted) {
          setSupabaseSession(session);

          if (event === 'SIGNED_OUT') {
            console.log('User signed out, clearing session');
            await clearSession();
            setSession(null);
          }
        }
      });
      authSubscription = subscription;
    } catch (error) {
      console.error('❌ Error setting up auth listener:', error);
    }

    return () => {
      console.log('Cleaning up auth subscription');
      mounted = false;
      if (authSubscription) {
        try {
          authSubscription.unsubscribe();
        } catch (e) {
          console.warn('Error unsubscribing:', e);
        }
      }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        supabaseSession,
        isLoading,
        signOut,
        refreshSession,
        switchClinic,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
