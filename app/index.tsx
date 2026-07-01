import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

export default function Index() {
  const { session, supabaseSession, isLoading } = useAuth();
  const [forceRender, setForceRender] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const [hasNavigated, setHasNavigated] = useState(false);

  console.log('=== INDEX SCREEN ===');
  console.log('isLoading:', isLoading);
  console.log('Has session:', !!session);
  console.log('Has supabaseSession:', !!supabaseSession);
  console.log('Current segments:', segments);

  // Force render after 2 seconds if still loading
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.log('Force rendering - auth took too long');
        setForceRender(true);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  useEffect(() => {
    if (hasNavigated) return;
    if (isLoading && !forceRender) return;

    const userType = session?.user_type;
    console.log('Navigation effect triggered - User type:', userType);

    if (session || supabaseSession) {
      // Receptionists get a dedicated booking portal (reception-tabs). Doctors
      // keep their own operational portal (doctor-tabs).
      if (userType === 'receptionist') {
        console.log('Navigating to reception-tabs');
        setHasNavigated(true);
        router.replace('/(reception-tabs)' as any);
      } else if (userType === 'doctor') {
        console.log('Navigating to doctor-tabs');
        setHasNavigated(true);
        router.replace('/(doctor-tabs)');
      } else {
        console.log('Navigating to patient tabs');
        setHasNavigated(true);
        router.replace('/(tabs)');
      }
    } else {
      console.log('Navigating to login');
      setHasNavigated(true);
      router.replace('/login');
    }
  }, [session, supabaseSession, isLoading, forceRender, hasNavigated, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});
