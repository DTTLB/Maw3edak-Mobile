import { Platform, Alert, DeviceEventEmitter } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { getFirebaseApp } from './firebase';

export const NOTIFICATION_REFRESH_EVENT = 'NOTIFICATION_REFRESH';

let messaging: any = null;

function handleNotificationNavigation(remoteMessage: any) {
  if (!remoteMessage?.data) {
    console.log('No data in notification for navigation');
    return;
  }

  const { type, userType, order_id, appointment_id, invoice_id } = remoteMessage.data;

  console.log('Handling notification navigation:', { type, userType, order_id, appointment_id, invoice_id });

  try {
    // Check if this is a doctor notification
    if (userType === 'doctor') {
      console.log('Doctor notification detected, routing to doctor tabs');
      switch (type) {
        case 'doctor_appointment':
          console.log('Navigating to doctor appointments screen...');
          router.push('/(doctor-tabs)/appointments');
          break;

        case 'doctor_order':
          console.log('Navigating to doctor orders screen...');
          router.push('/(doctor-tabs)/orders');
          break;

        case 'doctor_prescription':
          console.log('Navigating to doctor prescriptions (medications) screen...');
          router.push('/(doctor-tabs)/medications');
          break;

        case 'doctor_patient':
          console.log('Navigating to doctor patients screen...');
          router.push('/(doctor-tabs)/patients');
          break;

        case 'doctor_authorization':
          console.log('Navigating to doctor notifications screen...');
          router.push('/(doctor-tabs)/notifications');
          break;

        case 'doctor_notification':
        default:
          console.log('Navigating to doctor notifications screen...');
          router.push('/(doctor-tabs)/notifications');
      }
      return;
    }

    // Patient notifications (userType === 'patient' or undefined)
    console.log('Patient notification detected, routing to patient tabs');
    switch (type) {
      case 'new_order':
        console.log('Navigating to orders screen...');
        router.push('/(tabs)/orders');
        break;

      case 'new_appointment':
      case 'appointment_reminder':
        console.log('Navigating to appointments screen...');
        router.push('/(tabs)/appointments');
        break;

      case 'new_invoice':
      case 'invoice_due':
        console.log('Navigating to invoices screen...');
        router.push('/(tabs)/invoices');
        break;

      case 'new_prescription':
        console.log('Navigating to prescriptions screen...');
        router.push('/(tabs)/prescriptions');
        break;

      case 'medication_reminder':
        console.log('Navigating to today\'s medications screen...');
        router.push('/(tabs)/medications-today');
        break;

      case 'doctor_response':
        console.log('Navigating to doctor responses screen...');
        router.push('/(tabs)/doctor-responses');
        break;

      case 'new_nutrition':
      case 'nutrition_update':
        console.log('Navigating to nutrition screen...');
        router.push('/(tabs)/nutrition');
        break;

      case 'new_vision_test':
      case 'vision_result':
        console.log('Navigating to vision screen...');
        router.push('/(tabs)/vision');
        break;

      case 'new_dental':
      case 'dental_appointment':
        console.log('Navigating to dental screen...');
        router.push('/(tabs)/dental');
        break;

      case 'reminder':
        console.log('Navigating to notifications screen (reminder)...');
        router.push('/notifications');
        break;

      default:
        console.log('Unknown notification type, opening home screen');
        router.push('/(tabs)');
    }
  } catch (error) {
    console.error('Error navigating from notification:', error);
  }
}

// Lazy load messaging to avoid crashes
function getMessaging() {
  if (Platform.OS === 'web') {
    return null;
  }

  // Check if Firebase is initialized first
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) {
    console.error('Firebase not initialized. Cannot get messaging.');
    return null;
  }

  if (!messaging) {
    try {
      const firebaseMessaging = require('@react-native-firebase/messaging').default;
      messaging = firebaseMessaging;
      console.log('Firebase messaging loaded successfully');
    } catch (error) {
      console.error('Failed to load Firebase messaging:', error);
      return null;
    }
  }

  return messaging;
}

async function getExpoPushToken(): Promise<string | null> {
  console.log('Getting Expo push token...');

  try {
    const { default: Notifications } = await import('expo-notifications');

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.error('Expo push notification permissions denied');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    console.log('✅ Expo push token received:', token.data);
    return token.data;
  } catch (error) {
    console.error('Error getting Expo push token:', error);
    return null;
  }
}

export async function getRealFcmToken(): Promise<string | null> {
  console.log('Getting push token...');
  console.log('Platform:', Platform.OS);
  console.log('Device.isDevice:', Device.isDevice);

  if (Platform.OS === 'web') {
    console.warn('Push tokens are not available on web platform');
    return null;
  }

  // Check if running in Expo Go or development build without Firebase
  const isExpoGo = Constants.appOwnership === 'expo';
  console.log('Running in Expo Go:', isExpoGo);

  // Try FCM first for production builds
  if (!isExpoGo && Device.isDevice) {
    try {
      // Initialize Firebase first
      console.log('Initializing Firebase before getting FCM token...');
      const firebaseApp = getFirebaseApp();
      if (!firebaseApp) {
        console.error('Failed to initialize Firebase, falling back to Expo token');
        return await getExpoPushToken();
      }
      console.log('Firebase initialized successfully');

      const msg = getMessaging();
      if (!msg) {
        console.error('Firebase messaging not available, falling back to Expo token');
        return await getExpoPushToken();
      }

      console.log('Requesting FCM notification permissions...');
      const authStatus = await msg().requestPermission();
      console.log('FCM Permission status:', authStatus);

      const enabled =
        authStatus === msg.AuthorizationStatus.AUTHORIZED ||
        authStatus === msg.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        // Permission denied — the caller (NotificationPermissionGate) shows a
        // friendly, localized message. Do not show an alert here.
        console.log('Push notification permissions not granted');
        return null;
      }

      console.log('Getting FCM token with retry logic...');
      // Try to get token with retries
      let token = null;
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`FCM token retrieval attempt ${attempt}/${maxRetries}...`);
          token = await msg().getToken();

          if (token) {
            console.log('✅ FCM TOKEN received successfully');
            console.log('Token preview:', token.substring(0, 50) + '...');
            return token;
          }

          console.warn(`Attempt ${attempt}: No FCM token received, retrying...`);
          // Wait before retry (500ms, 1s, 1.5s)
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        } catch (err) {
          console.error(`FCM Attempt ${attempt} failed:`, err);
          if (attempt === maxRetries) {
            console.log('FCM failed, falling back to Expo token');
            return await getExpoPushToken();
          }
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
      }

      console.error('❌ Failed to get FCM token after all retries, falling back to Expo token');
      return await getExpoPushToken();
    } catch (error) {
      console.error('Error getting FCM token, falling back to Expo token:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      return await getExpoPushToken();
    }
  } else {
    // In Expo Go or not a real device, use Expo push tokens
    console.log('Using Expo push token (Expo Go or simulator)');
    return await getExpoPushToken();
  }
}

export async function saveDeviceToken(
  patientId: string,
  medicalId: string,
  token: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<boolean> {
  try {
    const deviceModel = Device.modelName || Device.deviceName || 'Unknown';
    const appVersion = Constants.expoConfig?.version || '1.0.0';

    const deviceInfo = {
      platform: Platform.OS,
      deviceModel,
      appVersion,
    };

    console.log('=== SAVE DEVICE TOKEN FUNCTION CALLED ===');
    console.log('Patient ID:', patientId);
    console.log('Medical ID:', medicalId);
    console.log('Token (first 40 chars):', token.substring(0, 40) + '...');
    console.log('Full Token Length:', token.length);
    console.log('Device Info:', deviceInfo);
    console.log('Supabase URL:', supabaseUrl);
    console.log('Has Supabase Key:', !!supabaseKey);
    console.log('Supabase Key Length:', supabaseKey?.length || 0);

    const isExpoToken = token.startsWith('ExponentPushToken[');
    if (isExpoToken) {
      console.log('📱 Expo push token detected - will be saved for Expo development');
    } else {
      console.log('📱 FCM token detected - will be saved for production use');
    }

    // Store token in SecureStore for logout
    try {
      const SecureStore = require('expo-secure-store');
      await SecureStore.setItemAsync('fcm_token', token);
      console.log('✅ FCM token stored in SecureStore for logout');
    } catch (storeError) {
      console.warn('⚠️ Could not store FCM token in SecureStore:', storeError);
    }

    const requestBody = {
      patientId,
      medicalId,
      fcmToken: token,
      ...deviceInfo,
    };

    const url = `${supabaseUrl}/functions/v1/mobile-save-device-token`;
    console.log('Request URL:', url);
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));

    console.log('=== MAKING FETCH REQUEST ===');
    console.log('⏳ Calling:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('=== FETCH RESPONSE RECEIVED ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('OK:', response.ok);
    console.log('Headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

    let result;
    const responseText = await response.text();
    console.log('Raw Response:', responseText);

    try {
      result = JSON.parse(responseText);
      console.log('=== RESPONSE BODY (Parsed) ===');
      console.log('Result:', JSON.stringify(result, null, 2));
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      result = { error: 'Invalid JSON response', raw: responseText };
    }

    if (!response.ok) {
      console.error('❌ FAILED TO SAVE - Response not OK');
      console.error('Status:', response.status);
      console.error('Result:', result);
      return false;
    }

    const success = result.success || false;
    console.log('Success value:', success);

    if (success) {
      console.log('✅ TOKEN SAVED SUCCESSFULLY');
    } else {
      console.log('⚠️ Response OK but success=false');
    }

    return success;
  } catch (error) {
    console.error('=== ERROR IN SAVE DEVICE TOKEN ===');
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
}

export async function saveDoctorDeviceToken(
  userId: string,
  token: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<boolean> {
  try {
    const deviceModel = Device.modelName || Device.deviceName || 'Unknown';
    const appVersion = Constants.expoConfig?.version || '1.0.0';

    const deviceInfo = {
      platform: Platform.OS,
      deviceModel,
      appVersion,
    };

    console.log('=== SAVE DOCTOR DEVICE TOKEN FUNCTION CALLED ===');
    console.log('User ID:', userId);
    console.log('Token (first 40 chars):', token.substring(0, 40) + '...');
    console.log('Device Info:', deviceInfo);
    console.log('Supabase URL:', supabaseUrl);
    console.log('Has Supabase Key:', !!supabaseKey);

    const isExpoToken = token.startsWith('ExponentPushToken[');
    if (isExpoToken) {
      console.log('📱 Expo push token detected - will be saved for Expo development');
    } else {
      console.log('📱 FCM token detected - will be saved for production use');
    }

    // Store token in SecureStore for logout
    try {
      const SecureStore = require('expo-secure-store');
      await SecureStore.setItemAsync('fcm_token', token);
      console.log('✅ FCM token stored in SecureStore for logout');
    } catch (storeError) {
      console.warn('⚠️ Could not store FCM token in SecureStore:', storeError);
    }

    const requestBody = {
      userId,
      fcmToken: token,
      ...deviceInfo,
    };

    const url = `${supabaseUrl}/functions/v1/mobile-save-doctor-device-token`;
    console.log('Request URL:', url);
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));

    console.log('=== MAKING FETCH REQUEST ===');
    console.log('⏳ Calling:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('=== FETCH RESPONSE RECEIVED ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('OK:', response.ok);
    console.log('Headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

    let result;
    const responseText = await response.text();
    console.log('Raw Response:', responseText);

    try {
      result = JSON.parse(responseText);
      console.log('=== RESPONSE BODY (Parsed) ===');
      console.log('Result:', JSON.stringify(result, null, 2));
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      result = { error: 'Invalid JSON response', raw: responseText };
    }

    if (!response.ok) {
      console.error('❌ FAILED TO SAVE - Response not OK');
      console.error('Status:', response.status);
      console.error('Result:', result);
      return false;
    }

    const success = result.success || false;
    console.log('Success value:', success);

    if (success) {
      console.log('✅ DOCTOR TOKEN SAVED SUCCESSFULLY');
    } else {
      console.log('⚠️ Response OK but success=false');
    }

    return success;
  } catch (error) {
    console.error('=== ERROR IN SAVE DOCTOR DEVICE TOKEN ===');
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
}

async function saveRefreshedToken(newToken: string) {
  try {
    const SecureStore = require('expo-secure-store');
    const sessionJson = await SecureStore.getItemAsync('session');

    if (!sessionJson) {
      console.log('No session found, cannot save refreshed token');
      return;
    }

    const session = JSON.parse(sessionJson);
    if (!session?.patient?.id || !session?.patient?.medical_id) {
      console.log('Invalid session data, cannot save refreshed token');
      return;
    }

    console.log('Saving refreshed FCM token...');
    const saved = await saveDeviceToken(
      session.patient.id,
      session.patient.medical_id,
      newToken,
      Constants.expoConfig?.extra?.supabaseUrl || '',
      Constants.expoConfig?.extra?.supabaseAnonKey || ''
    );

    if (saved) {
      console.log('✅ Refreshed token saved successfully');
    } else {
      console.log('❌ Failed to save refreshed token');
    }
  } catch (error) {
    console.error('Error saving refreshed token:', error);
  }
}

export function setupNotificationListeners() {
  if (Platform.OS === 'web') {
    console.warn('Notification listeners not available on web');
    return () => {};
  }

  console.log('Setting up Firebase notification listeners...');

  try {
    const msg = getMessaging();
    if (!msg) {
      console.error('Firebase messaging not available for listeners');
      return () => {};
    }

    const unsubscribeForeground = msg().onMessage(async (remoteMessage: any) => {
      console.log('📱 FOREGROUND notification received:', JSON.stringify(remoteMessage, null, 2));

      DeviceEventEmitter.emit(NOTIFICATION_REFRESH_EVENT);

      const title = remoteMessage.notification?.title || 'New Notification';
      const body = remoteMessage.notification?.body || '';

      // Medication reminders: show a real local notification (FCM does not
      // auto-display in the foreground) so it looks like a scheduled reminder.
      if (remoteMessage.data?.type === 'medication_reminder') {
        try {
          const { default: Notifications } = await import('expo-notifications');
          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data: remoteMessage.data,
              sound: 'default',
            },
            trigger: null, // present immediately
          });
        } catch (e) {
          console.warn('Failed to present local medication reminder:', e);
        }
        return;
      }

      Alert.alert(
        title,
        body,
        [
          {
            text: 'Dismiss',
            style: 'cancel',
          },
          {
            text: 'View',
            onPress: () => handleNotificationNavigation(remoteMessage),
          },
        ]
      );
    });

    const unsubscribeBackgroundTap = msg().onNotificationOpenedApp((remoteMessage: any) => {
      console.log('🔔 BACKGROUND notification tapped:', JSON.stringify(remoteMessage, null, 2));
      DeviceEventEmitter.emit(NOTIFICATION_REFRESH_EVENT);
      handleNotificationNavigation(remoteMessage);
    });

    const unsubscribeTokenRefresh = msg().onTokenRefresh(async (token: string) => {
      console.log('🔄 FCM Token refreshed:', token);
      await saveRefreshedToken(token);
    });

    getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log('💤 App opened from CLOSED state via notification');
        setTimeout(() => {
          handleNotificationNavigation(remoteMessage);
        }, 1000);
      }
    });

    console.log('✅ All notification listeners registered');
    console.log('  - Foreground messages (app open)');
    console.log('  - Background taps (app minimized)');
    console.log('  - Initial notification (app closed)');
    console.log('  - Token refresh (automatic)');

    return () => {
      unsubscribeForeground();
      unsubscribeBackgroundTap();
      unsubscribeTokenRefresh();
    };
  } catch (error) {
    console.error('Error setting up notification listeners:', error);
    return () => {};
  }
}

export function initializeBackgroundHandler() {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const msg = getMessaging();
    if (!msg) {
      console.error('Firebase messaging not available for background handler');
      return;
    }

    msg().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log('💤 BACKGROUND notification received (app closed/killed):', JSON.stringify(remoteMessage, null, 2));
      console.log('Notification will be displayed by system');
    });

    console.log('✅ Background notification handler initialized');
    console.log('   Handles notifications when app is closed or killed');
  } catch (error) {
    console.error('Error setting background message handler:', error);
  }
}

export async function getInitialNotification() {
  if (Platform.OS === 'web') {
    console.warn('Initial notification not available on web');
    return null;
  }

  try {
    const msg = getMessaging();
    if (!msg) {
      console.error('Firebase messaging not available for initial notification');
      return null;
    }

    const initialNotification = await msg().getInitialNotification();
    if (initialNotification) {
      console.log('App opened from quit state by notification:', JSON.stringify(initialNotification, null, 2));
    }
    return initialNotification;
  } catch (error) {
    console.error('Error getting initial notification:', error);
    return null;
  }
}

export { getRealFcmToken as registerForPushNotifications };
export { getRealFcmToken as getFCMToken };
