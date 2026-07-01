import { supabase } from './supabase';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface DeviceToken {
  id: string;
  patient_id: string;
  fcm_token: string;
  platform: 'ios' | 'android';
  device_model: string | null;
  app_version: string | null;
  is_active: boolean;
}

export const settingsService = {
  async getNotificationSettings(patientId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_patients')
        .select('allow_notifications')
        .eq('is_deleted', false)
        .eq('id', patientId)
        .maybeSingle();

      if (error) {
        console.error('Failed to get notification settings:', error);
        return true;
      }

      return data?.allow_notifications ?? true;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return true;
    }
  },

  async updateNotificationSettings(
    patientId: string,
    allowNotifications: boolean
  ): Promise<boolean> {
    try {
      console.log('updateNotificationSettings called with:', { patientId, allowNotifications });

      const response = await fetch(
        `${Constants.expoConfig?.extra?.supabaseUrl}/functions/v1/mobile-toggle-notifications`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Constants.expoConfig?.extra?.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            patientId,
            allowNotifications,
          }),
        }
      );

      const result = await response.json();
      console.log('Update notification settings response:', result);

      if (!response.ok || !result.success) {
        console.error('Failed to update notification settings:', result);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return false;
    }
  },

  async getBiometricSettings(patientId: string): Promise<{
    biometric_login_enabled: boolean;
    lock_method: string | null;
  }> {
    try {
      const response = await fetch(
        `${Constants.expoConfig?.extra?.supabaseUrl}/functions/v1/mobile-get-biometric-settings?patientId=${patientId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${Constants.expoConfig?.extra?.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error('Failed to get biometric settings:', result);
        return {
          biometric_login_enabled: false,
          lock_method: null,
        };
      }

      return {
        biometric_login_enabled: result.biometric_login_enabled ?? false,
        lock_method: result.lock_method ?? null,
      };
    } catch (error) {
      console.error('Error getting biometric settings:', error);
      return {
        biometric_login_enabled: false,
        lock_method: null,
      };
    }
  },

  async updateBiometricSettings(
    patientId: string,
    biometricEnabled: boolean,
    lockMethod: string | null
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${Constants.expoConfig?.extra?.supabaseUrl}/functions/v1/mobile-update-biometric-settings`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Constants.expoConfig?.extra?.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            patientId,
            biometricEnabled,
            lockMethod,
          }),
        }
      );

      const result = await response.json();
      console.log('Update biometric settings response:', result);

      if (!response.ok) {
        console.error('Failed to update biometric settings:', result);
        return false;
      }

      return result.success || false;
    } catch (error) {
      console.error('Error updating biometric settings:', error);
      return false;
    }
  },

  async getDoctorBiometricSettings(userId: string, sessionToken: string): Promise<{
    biometric_login_enabled: boolean;
    lock_method: string | null;
  }> {
    try {
      // Use edge function to get doctor settings (bypasses RLS)
      const response = await fetch(
        `${Constants.expoConfig?.extra?.supabaseUrl}/functions/v1/mobile-get-doctor-settings`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${Constants.expoConfig?.extra?.supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken,
          },
        }
      );

      const result = await response.json();
      console.log('Get doctor biometric settings response:', result);

      if (!response.ok || !result.success) {
        console.error('Failed to get doctor biometric settings:', result);
        return {
          biometric_login_enabled: false,
          lock_method: null,
        };
      }

      return {
        biometric_login_enabled: result.settings.biometric_login ?? false,
        lock_method: result.settings.lock_method ?? null,
      };
    } catch (error) {
      console.error('Error getting doctor biometric settings:', error);
      return {
        biometric_login_enabled: false,
        lock_method: null,
      };
    }
  },

  async getPrimarySettings(globalId: string, userType: 'doctor' | 'patient', medicalId?: string): Promise<{
    biometric_login_enabled: boolean;
    lock_method: string | null;
    allow_notifications: boolean;
    darkmode: boolean;
  }> {
    try {
      let url = `${Constants.expoConfig?.extra?.supabaseUrl}/functions/v1/mobile-get-primary-settings?global_id=${globalId}&user_type=${userType}`;
      if (userType === 'patient' && medicalId) {
        url += `&medical_id=${medicalId}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Constants.expoConfig?.extra?.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('Get primary settings response:', result);

      if (!response.ok || !result.success) {
        console.error('Failed to get primary settings:', result);
        return {
          biometric_login_enabled: false,
          lock_method: null,
          allow_notifications: true,
          darkmode: false,
        };
      }

      return {
        biometric_login_enabled: result.biometric_login_enabled ?? false,
        lock_method: result.lock_method ?? null,
        allow_notifications: result.allow_notifications ?? true,
        darkmode: result.darkmode ?? false,
      };
    } catch (error) {
      console.error('Error getting primary settings:', error);
      return {
        biometric_login_enabled: false,
        lock_method: null,
        allow_notifications: true,
        darkmode: false,
      };
    }
  },
};
