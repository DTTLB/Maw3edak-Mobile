import Constants from 'expo-constants';

interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

function getConfig(): AppConfig {
  const config = Constants.expoConfig?.extra || {};

  const supabaseUrl =
    config.supabaseUrl ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    '';

  const supabaseAnonKey =
    config.supabaseAnonKey ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('=== MISSING CONFIGURATION ===');
    console.error('Supabase URL:', supabaseUrl ? 'Present' : 'MISSING');
    console.error('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'MISSING');
    console.error('This app requires proper configuration to function.');
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}

export const config = getConfig();

export const getSupabaseUrl = () => config.supabaseUrl;
export const getSupabaseAnonKey = () => config.supabaseAnonKey;
