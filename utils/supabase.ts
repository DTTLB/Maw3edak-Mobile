import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { config } from './config';

console.log('=== SUPABASE CLIENT INITIALIZATION ===');
console.log('Platform:', Platform.OS);
console.log('Platform Version:', Platform.Version);

try {
  console.log('Loading URL polyfill...');
  require('react-native-url-polyfill/auto');
  console.log('✓ URL polyfill loaded');
} catch (e) {
  console.error('❌ Failed to load URL polyfill:', e);
}

const supabaseUrl = config.supabaseUrl;
const supabaseAnonKey = config.supabaseAnonKey;

console.log('Environment check:');
console.log('  Supabase URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('  Supabase Anon Key:', supabaseAnonKey ? '✓ Set' : '✗ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL: Missing Supabase environment variables!');
  console.error('The app cannot function without these variables.');
  console.error('Please check your .env file and restart the app.');
}

let supabaseClient: any;

try {
  console.log('Creating Supabase client with AsyncStorage...');
  console.log('Using URL:', supabaseUrl.substring(0, 20) + '...');

  const clientConfig = {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  };

  console.log('Client config:', JSON.stringify(clientConfig, null, 2));

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, clientConfig);

  console.log('✅ Supabase client created successfully');
  console.log('Client object type:', typeof supabaseClient);

  if (Platform.OS === 'android') {
    console.log('✓ Android-specific initialization complete');

    setTimeout(() => {
      console.log('Supabase client health check...');
      if (supabaseClient && supabaseClient.auth) {
        console.log('✓ Auth module available');
      } else {
        console.error('✗ Auth module not available');
      }
    }, 1000);
  }
} catch (error: any) {
  console.error('❌ FATAL: Failed to create Supabase client');
  console.error('Error:', error);
  console.error('Error name:', error?.name);
  console.error('Error message:', error?.message);
  if (error?.stack) {
    console.error('Error stack:', error.stack);
  }

  console.error('This is a critical error. The app may not function correctly.');

  const dummyClient = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: new Error('Supabase not initialized') }),
      signOut: async () => ({ error: new Error('Supabase not initialized') }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  };

  supabaseClient = dummyClient;
  console.warn('⚠️ Using dummy Supabase client - app will run but features will not work');
}

export const supabase = supabaseClient;
export const SUPABASE_URL = supabaseUrl;
