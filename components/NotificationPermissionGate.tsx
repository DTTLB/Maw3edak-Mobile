import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { config } from '@/utils/config';
import {
  getRealFcmToken,
  saveDeviceToken,
  saveDoctorDeviceToken,
} from '@/utils/notifications';

const SEEN_KEY = 'notif_prompt_seen_v1';

/**
 * Pre-permission gate for push notifications.
 *
 * Apple requires an in-app explanation BEFORE the system notification prompt.
 * This component shows that explanation once (per install) on the home screen
 * and only triggers the OS permission request after the user taps
 * "Enable Notifications". It works for both patient and doctor sessions and
 * registers the device (push) token only after permission is granted.
 *
 * Renders nothing when there is nothing to ask.
 */
export default function NotificationPermissionGate() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { session } = useAuth();
  const [visible, setVisible] = useState(false);

  // Register the push token for the current account once permission is granted.
  const registerToken = useCallback(async () => {
    try {
      const token = await getRealFcmToken();
      if (!token) return;

      if (session?.user_type === 'doctor') {
        const userId = session.user?.user_id || session.user?.id;
        if (userId) {
          await saveDoctorDeviceToken(userId, token, config.supabaseUrl, config.supabaseAnonKey);
        }
      } else if (session?.patient?.id && session?.patient?.medical_id) {
        await saveDeviceToken(
          session.patient.id,
          session.patient.medical_id,
          token,
          config.supabaseUrl,
          config.supabaseAnonKey
        );
      }
    } catch {
      // Token registration is best-effort; never surface errors to the user.
    }
  }, [session]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (Platform.OS === 'web' || !session) return;
      try {
        const { status, canAskAgain } = await Notifications.getPermissionsAsync();

        // Already granted: silently (re)register the token, no prompt.
        if (status === 'granted') {
          registerToken();
          return;
        }

        const seen = await AsyncStorage.getItem(SEEN_KEY);
        if (seen) return;

        // Only show our explanation when the OS will actually show its prompt.
        if (status === 'undetermined' && canAskAgain) {
          if (active) setVisible(true);
        } else {
          // Permanently denied at OS level — nothing we can prompt for.
          await AsyncStorage.setItem(SEEN_KEY, '1');
        }
      } catch {
        // Ignore — if we can't read permissions we simply don't prompt.
      }
    })();
    return () => {
      active = false;
    };
    // Re-evaluate when the logged-in account changes.
  }, [session, registerToken]);

  const handleEnable = async () => {
    await AsyncStorage.setItem(SEEN_KEY, '1');
    setVisible(false);

    // This call triggers the OS permission dialog (only now, after opt-in).
    await registerToken();

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('notifPrompt.deniedTitle'), t('notifPrompt.deniedMessage'));
    }
  };

  const handleNotNow = async () => {
    await AsyncStorage.setItem(SEEN_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleNotNow}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight ?? 'rgba(45,125,210,0.12)' }]}>
            <Bell size={28} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('notifPrompt.title')}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {t('notifPrompt.message')}
          </Text>

          <TouchableOpacity
            style={[styles.enableBtn, { backgroundColor: colors.primary }]}
            onPress={handleEnable}
            activeOpacity={0.85}
          >
            <Text style={styles.enableText}>{t('notifPrompt.enable')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.notNowBtn} onPress={handleNotNow} activeOpacity={0.7}>
            <Text style={[styles.notNowText, { color: colors.textSecondary }]}>
              {t('notifPrompt.notNow')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 19, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  message: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 22 },
  enableBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  enableText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  notNowBtn: { paddingVertical: 14, marginTop: 4 },
  notNowText: { fontSize: 15, fontWeight: '600' },
});
