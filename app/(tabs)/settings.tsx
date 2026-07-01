import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Switch,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import BackButton from '@/components/BackButton';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelectorModal } from '@/components/LanguageSelectorModal';
import { settingsService } from '@/utils/settingsService';
import { config } from '@/utils/config';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Device from 'expo-device';
import * as Clipboard from 'expo-clipboard';
import { openExternalUrl, PRIVACY_POLICY_URL } from '@/utils/links';
import AccountDeletionSection from '@/components/AccountDeletionSection';
import {
  Bell,
  Fingerprint,
  LogOut,
  ChevronRight,
  User,
  Lock,
  Moon,
  HelpCircle,
  FileText,
  X,
  QrCode,
  Globe,
  ShieldCheck,
  CreditCard,
  Copy,
  Check,
} from 'lucide-react-native';
import QRCode from 'qrcode';
import { SvgXml } from 'react-native-svg';
import { brand } from '@/constants/brand';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { session, signOut } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const { language, languages } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [, setIsRealDevice] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedHelpContent, setSelectedHelpContent] = useState<any>(null);
  const [helpContent, setHelpContent] = useState<any[]>([]);

  // Two-factor authentication (TOTP / Google Authenticator)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupSecret, setSetupSecret] = useState('');
  const [setupQrSvg, setSetupQrSvg] = useState<string | null>(null);
  const [setupCode, setSetupCode] = useState('');
  const [secretCopied, setSecretCopied] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [recoveryCopied, setRecoveryCopied] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disableCode, setDisableCode] = useState('');

  const checkDevice = async () => {
    if (Platform.OS === 'web') {
      setIsRealDevice(false);
      return;
    }
    const isPhysical = Device.isDevice;
    setIsRealDevice(isPhysical);
  };

  const checkBiometricAvailability = async () => {
    try {
      if (Platform.OS === 'web') {
        setIsBiometricAvailable(false);
        return;
      }
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();
      const hasAuth = securityLevel !== LocalAuthentication.SecurityLevel.NONE;
      setIsBiometricAvailable(compatible && hasAuth);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsBiometricAvailable(false);
    }
  };

  const loadSettings = useCallback(async () => {
    if (!session?.patient?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Profile fields come straight from the session — a direct user_patients
      // query is blocked by RLS for the patient's custom (non-Supabase) token.
      setProfile(session.patient);

      // Load the persisted toggles via the edge function (service role, bypasses
      // RLS) so notifications + biometric reflect the saved values on each login.
      // A direct anon-client read returns null here, which is why the toggles
      // previously reset to their defaults.
      const primary = await settingsService.getPrimarySettings(
        '',
        'patient',
        session.patient.medical_id
      );
      setNotificationsEnabled(primary.allow_notifications);
      setBiometricEnabled(primary.biometric_login_enabled);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Load the patient's subscription so settings can show the current plan and
  // its status. patient_subscriptions is read server-side (service role) via an
  // edge function because the table's RLS blocks the anon client and the patient
  // session is a custom token, not a Supabase JWT.
  const loadSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setSubscriptionLoaded(true);
      return;
    }

    try {
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-patient-subscription`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      if (response.ok && result.success) {
        setSubscription(result.subscription || null);
      } else {
        console.error('Subscription load failed:', result.error || result.details);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setSubscriptionLoaded(true);
    }
  }, [session]);

  const loadHelpContent = useCallback(async () => {
    try {
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-help-content`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userType: 'patient',
            language,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        setHelpContent(result.helpContent || []);
      }
    } catch (error) {
      console.error('Error loading help content:', error);
    }
  }, [language]);

  const showHelpContentModal = (section: string) => {
    const content = helpContent.find((item: any) => item.section === section);
    if (content) {
      setSelectedHelpContent(content);
      setShowHelpModal(true);
    } else {
      Alert.alert('Not Available', 'This content is not available at this time');
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (!session?.patient?.id) {
      Alert.alert('Error', 'Session not found. Please log in again.');
      return;
    }

    try {
      const success = await settingsService.updateNotificationSettings(
        session.patient.id,
        value
      );

      if (success) {
        setNotificationsEnabled(value);
        Alert.alert('Success', `Notifications ${value ? 'enabled' : 'disabled'}`);
      } else {
        Alert.alert('Error', 'Failed to update notification settings');
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', `Failed to update notification settings: ${error}`);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (!session?.patient?.id) {
      Alert.alert('Error', 'Session not found. Please log in again.');
      return;
    }

    if (!isBiometricAvailable) {
      Alert.alert(
        'Not Available',
        'Biometric or device credential authentication is not available on this device. Please set up Face ID, Touch ID, Fingerprint, or a device passcode in your device settings.'
      );
      return;
    }

    try {
      if (value) {
        // Pick a biometric-aware prompt so iOS surfaces Face ID (not just passcode)
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        const hasFaceId = supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
        const hasFingerprint = supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
        let promptMessage = t('components.unlockApp');
        if (hasFaceId) promptMessage = t('components.unlockWithFaceId');
        else if (hasFingerprint) promptMessage = t('components.unlockWithFingerprint');

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage,
          fallbackLabel: t('components.usePasscode'),
          cancelLabel: t('common.cancel'),
          disableDeviceFallback: false,
        });

        if (!result.success && __DEV__) {
          console.log('[biometric] patient enable failed:', result.error);
        }

        // Silently bail on user cancel — don't show a scary error alert
        if (!result.success && (result.error === 'user_cancel' || result.error === 'system_cancel')) {
          return;
        }

        if (result.success) {
          const success = await settingsService.updateBiometricSettings(
            session.patient.id,
            true,
            'biometric'
          );

          if (success) {
            await SecureStore.setItemAsync('biometric_enabled', 'true');
            setBiometricEnabled(true);
            Alert.alert('Success', 'Biometric login enabled');
          } else {
            Alert.alert('Error', 'Failed to enable biometric login');
          }
        } else {
          Alert.alert('Authentication Failed', 'Please try again');
        }
      } else {
        const success = await settingsService.updateBiometricSettings(
          session.patient.id,
          false,
          null
        );

        if (success) {
          await SecureStore.deleteItemAsync('biometric_enabled');
          setBiometricEnabled(false);
          Alert.alert('Success', 'Biometric login disabled');
        } else {
          Alert.alert('Error', 'Failed to disable biometric login');
        }
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
      Alert.alert('Error', 'Failed to update biometric settings');
    }
  };

  const handleDarkModeToggle = async (value: boolean) => {
    try {
      await toggleTheme();
      Alert.alert('Success', `Dark mode ${value ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling dark mode:', error);
      Alert.alert('Error', 'Failed to update dark mode setting');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    try {
      setPasswordLoading(true);

      if (!session?.access_token) {
        Alert.alert('Error', 'Please log in again');
        return;
      }

      const patientId = profile?.id || session?.patient?.id;
      if (!patientId) {
        Alert.alert('Error', 'Unable to identify account. Please log in again');
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-change-password`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            patientId,
            currentPassword,
            newPassword,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        Alert.alert('Success', 'Password changed successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // ---------- Two-factor authentication ----------------------------------
  const loadTwoFactorStatus = useCallback(async () => {
    try {
      if (!session?.access_token) return;
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/patient-two-factor-status`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionToken: session.access_token }),
        }
      );
      const result = await response.json();
      if (result.success) {
        setTwoFactorEnabled(!!result.enabled);
        setTwoFactorRequired(!!result.required);
      }
    } catch (error) {
      console.error('Error loading 2FA status:', error);
    }
  }, [session]);

  useEffect(() => {
    checkDevice();
    loadSettings();
    loadSubscription();
    checkBiometricAvailability();
    loadHelpContent();
    loadTwoFactorStatus();
  }, [loadSettings, loadSubscription, loadHelpContent, loadTwoFactorStatus]);

  const handleTwoFactorToggle = async (value: boolean) => {
    if (twoFactorLoading) return;

    // Admin-forced 2FA cannot be turned off from the app.
    if (twoFactorRequired) {
      Alert.alert(t('settings.twoFactorLockedTitle'), t('settings.twoFactorLockedMessage'));
      return;
    }

    if (value) {
      // Begin enrollment: ask the backend for a fresh secret + otpauth URI.
      if (!session?.access_token) {
        Alert.alert(t('common.error'), t('settings.sessionNotFound'));
        return;
      }
      try {
        setTwoFactorLoading(true);
        const response = await fetch(
          `${config.supabaseUrl}/functions/v1/patient-two-factor-setup`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionToken: session.access_token }),
          }
        );
        const result = await response.json();
        if (response.ok && result.otpauthUri && result.secret) {
          setSetupSecret(result.secret);
          setSetupCode('');
          setSecretCopied(false);
          try {
            const svg = await QRCode.toString(result.otpauthUri, {
              type: 'svg',
              margin: 1,
              width: 220,
            });
            setSetupQrSvg(svg);
          } catch (qrError) {
            console.error('QR generation error:', qrError);
            setSetupQrSvg(null);
          }
          setShowSetupModal(true);
        } else {
          Alert.alert(t('common.error'), result.error || t('settings.twoFactorSetupFailed'));
        }
      } catch (error) {
        console.error('Error starting 2FA setup:', error);
        Alert.alert(t('common.error'), t('settings.twoFactorSetupFailed'));
      } finally {
        setTwoFactorLoading(false);
      }
    } else {
      // Turning OFF an enabled factor requires a current code.
      setDisableCode('');
      setShowDisableModal(true);
    }
  };

  const copySecret = async () => {
    await Clipboard.setStringAsync(setupSecret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  const copyRecoveryCodes = async () => {
    await Clipboard.setStringAsync(recoveryCodes.join('\n'));
    setRecoveryCopied(true);
    setTimeout(() => setRecoveryCopied(false), 2000);
  };

  const confirmTwoFactorSetup = async () => {
    if (!setupCode || setupCode.length < 6) {
      Alert.alert(t('common.error'), t('settings.twoFactorEnterCode'));
      return;
    }
    if (!session?.access_token) {
      Alert.alert(t('common.error'), t('settings.sessionNotFound'));
      return;
    }
    try {
      setTwoFactorLoading(true);
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/patient-two-factor-confirm`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionToken: session.access_token, code: setupCode.trim() }),
        }
      );
      const result = await response.json();
      if (response.ok && result.success) {
        setShowSetupModal(false);
        setSetupQrSvg(null);
        setSetupSecret('');
        setSetupCode('');
        setTwoFactorEnabled(true);
        setRecoveryCodes(Array.isArray(result.recoveryCodes) ? result.recoveryCodes : []);
        setRecoveryCopied(false);
        setShowRecoveryModal(true);
      } else {
        Alert.alert(t('common.error'), result.error || t('settings.twoFactorInvalidCode'));
      }
    } catch (error) {
      console.error('Error confirming 2FA:', error);
      Alert.alert(t('common.error'), t('settings.twoFactorSetupFailed'));
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!disableCode || disableCode.length < 6) {
      Alert.alert(t('common.error'), t('settings.twoFactorEnterCode'));
      return;
    }
    if (!session?.access_token) {
      Alert.alert(t('common.error'), t('settings.sessionNotFound'));
      return;
    }
    try {
      setTwoFactorLoading(true);
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/patient-two-factor-disable`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionToken: session.access_token, code: disableCode.trim() }),
        }
      );
      const result = await response.json();
      if (response.ok && result.success) {
        setShowDisableModal(false);
        setDisableCode('');
        setTwoFactorEnabled(false);
        Alert.alert(t('common.success'), t('settings.twoFactorDisabled'));
      } else {
        Alert.alert(t('common.error'), result.error || t('settings.twoFactorInvalidCode'));
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      Alert.alert(t('common.error'), t('settings.twoFactorDisableFailed'));
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleLogout = async () => {
    const confirmLogout = async () => {
      try {
        await signOut();

        if (Platform.OS === 'web') {
          window.location.replace('/login');
        } else {
          router.replace('/login');
        }
      } catch (error) {
        console.error('Error logging out:', error);
        if (Platform.OS === 'web') {
          window.location.replace('/login');
        } else {
          Alert.alert('Error', 'Failed to logout');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to logout?')) {
        await confirmLogout();
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: confirmLogout,
        },
      ]);
    }
  };

  const isPatient = !!session?.patient?.id;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <View
        style={[
          styles.headerBar,
          { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <BackButton color={colors.text} />
        <Text style={[styles.headerBarTitle, { color: colors.text }]}>{t('tabs.settings')}</Text>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {!isPatient && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.accountInformation')}</Text>
            <View style={[styles.menuItem, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}>
              <View style={[styles.iconCircle, { backgroundColor: brand.blueSoft }]}>
                <User size={20} color={brand.blue} strokeWidth={2} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                  {session?.user?.full_name || session?.user?.email || t('settings.doctorAccount')}
                </Text>
                <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
                  {session?.user?.email || t('settings.noEmail')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {isPatient && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('settings.accountInformation')}</Text>

              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}
                onPress={() => router.push('/edit-profile')}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: brand.blueSoft }]}>
                  <User size={20} color={brand.blue} strokeWidth={2} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>{t('settings.personalInformation')}</Text>
                  <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{t('settings.personalInformationSub')}</Text>
                </View>
                <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
              </TouchableOpacity>

            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('settings.subscription')}</Text>

              <View style={[styles.menuItem, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}>
                <View style={[styles.iconCircle, { backgroundColor: brand.blueSoft }]}>
                  <CreditCard size={20} color={brand.blue} strokeWidth={2} />
                </View>
                {!subscriptionLoaded ? (
                  <View style={styles.menuContent}>
                    <ActivityIndicator size="small" color={brand.blue} />
                  </View>
                ) : subscription ? (
                  <>
                    <View style={styles.menuContent}>
                      <Text style={[styles.menuTitle, { color: colors.text }]}>
                        {subscription.plan?.name || t('settings.subscription')}
                      </Text>
                      <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
                        {subscription.end_date
                          ? t(
                              subscription.isActive
                                ? 'settings.subscriptionExpiresOn'
                                : 'settings.subscriptionExpiredOn',
                              {
                                date: new Date(subscription.end_date).toLocaleDateString(language, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                }),
                              }
                            )
                          : subscription.plan?.description || ''}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: subscription.isActive ? brand.turquoiseSoft : brand.coralSoft,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: subscription.isActive ? brand.turquoise : brand.coral },
                        ]}
                      >
                        {subscription.isActive
                          ? t('settings.subscriptionActive')
                          : t('settings.subscriptionExpired')}
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.menuContent}>
                    <Text style={[styles.menuTitle, { color: colors.text }]}>{t('settings.subscriptionNone')}</Text>
                    <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{t('settings.subscriptionNoneSub')}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('settings.careProviders')}</Text>

              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}
                onPress={() => router.push('/link-provider')}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: brand.turquoiseSoft }]}>
                  <QrCode size={20} color={brand.turquoise} strokeWidth={2} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>{t('settings.linkProvider')}</Text>
                  <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{t('settings.linkProviderSub')}</Text>
                </View>
                <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>

              <View style={[styles.menuItem, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}>
                <View style={[styles.iconCircle, { backgroundColor: brand.coralSoft }]}>
                  <Bell size={20} color={brand.coral} strokeWidth={2} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>{t('settings.pushNotifications')}</Text>
                  <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{t('settings.pushNotificationsSubPatient')}</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationToggle}
                  trackColor={{ false: '#CBD5E1', true: brand.turquoise }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#CBD5E1"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('settings.securityLogin')}</Text>

              <View style={[styles.menuItem, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}>
                <View style={[styles.iconCircle, { backgroundColor: brand.turquoiseSoft }]}>
                  <Fingerprint size={20} color={brand.turquoise} strokeWidth={2} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>{t('settings.biometric')}</Text>
                  <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{t('settings.biometricSub')}</Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  disabled={!isBiometricAvailable}
                  trackColor={{ false: '#CBD5E1', true: brand.turquoise }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#CBD5E1"
                />
              </View>

              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}
                onPress={() => setShowPasswordModal(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: brand.coralSoft }]}>
                  <Lock size={20} color={brand.coral} strokeWidth={2} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>{t('settings.changePassword')}</Text>
                  <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{t('settings.changePasswordSub')}</Text>
                </View>
                <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
              </TouchableOpacity>

              <View style={[styles.menuItem, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}>
                <View style={[styles.iconCircle, { backgroundColor: brand.turquoiseSoft }]}>
                  <ShieldCheck size={20} color={brand.turquoise} strokeWidth={2} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>{t('settings.twoFactor')}</Text>
                  <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
                    {twoFactorRequired ? t('settings.twoFactorRequiredSub') : t('settings.twoFactorSub')}
                  </Text>
                </View>
                {twoFactorLoading ? (
                  <ActivityIndicator size="small" color={brand.blue} />
                ) : (
                  <Switch
                    value={twoFactorEnabled}
                    onValueChange={handleTwoFactorToggle}
                    disabled={twoFactorRequired}
                    trackColor={{ false: '#CBD5E1', true: brand.turquoise }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#CBD5E1"
                  />
                )}
              </View>
            </View>
          </>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.preferences')}</Text>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}
            onPress={() => setShowLanguageModal(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: brand.blueSoft }]}>
              <Globe size={20} color={brand.blue} strokeWidth={2} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>{t('settings.language')}</Text>
              <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{t('settings.languageSub')}</Text>
            </View>
            <Text style={[styles.menuValue, { color: colors.textSecondary }]}>
              {languages.find((l) => l.code === language)?.label}
            </Text>
            <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>

          <View style={[styles.menuItem, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? '#374151' : '#1F2937' }]}>
              <Moon size={20} color="#FFFFFF" strokeWidth={2} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>{t('settings.darkMode')}</Text>
              <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{t('settings.darkModeSub')}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: '#CBD5E1', true: brand.turquoise }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#CBD5E1"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.support')}</Text>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}
            onPress={() => router.push('/help-center')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: brand.blueSoft }]}>
              <HelpCircle size={20} color={brand.blue} strokeWidth={2} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>{t('settings.helpCenter')}</Text>
              <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{t('settings.helpCenterSub')}</Text>
            </View>
            <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}
            onPress={() =>
              openExternalUrl(PRIVACY_POLICY_URL, {
                errorTitle: t('settings.linkErrorTitle'),
                errorMessage: t('settings.linkErrorMessage'),
              })
            }
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: brand.blueSoft }]}>
              <ShieldCheck size={20} color={brand.blue} strokeWidth={2} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>{t('settings.privacyPolicy')}</Text>
              <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{t('settings.privacyPolicySub')}</Text>
            </View>
            <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}
            onPress={() => showHelpContentModal('terms_privacy')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: brand.blueSoft }]}>
              <FileText size={20} color={brand.blue} strokeWidth={2} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>{t('settings.termsPrivacy')}</Text>
              <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{t('settings.termsPrivacySub')}</Text>
            </View>
            <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>

          <AccountDeletionSection
            card={colors.card}
            border={colors.borderLight}
            subtitleColor={colors.textSecondary}
          />
        </View>

        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.card, borderColor: brand.coralSoftBorder }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LogOut size={20} color={brand.coral} strokeWidth={2} />
            <Text style={[styles.logoutText, { color: brand.coral }]}>{t('settings.logOut')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKeyboardAvoid}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {
              Keyboard.dismiss();
              setShowPasswordModal(false);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            }}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>

            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Change Password</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  <X size={24} color={colors.text} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalBody}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Current Password</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor={colors.textTertiary}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>New Password</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor={colors.textTertiary}
                    returnKeyType="next"
                  />
                  <Text style={[styles.inputHint, { color: colors.textSecondary }]}>Must be at least 8 characters</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Confirm New Password</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor={colors.textTertiary}
                    returnKeyType="done"
                    onSubmitEditing={handleChangePassword}
                  />
                </View>
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowPasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.changeButton, { backgroundColor: brand.blue }, passwordLoading && styles.changeButtonDisabled]}
                  onPress={handleChangePassword}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.changeButtonText}>Change Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Two-factor setup: QR + manual key + code confirmation */}
      <Modal
        visible={showSetupModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSetupModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKeyboardAvoid}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setShowSetupModal(false); }}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>

            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.twoFactor')}</Text>
                <TouchableOpacity onPress={() => setShowSetupModal(false)}>
                  <X size={24} color={colors.text} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalBody}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.twoFactorStep, { color: colors.textSecondary }]}>
                  {t('settings.twoFactorScanHint')}
                </Text>

                {setupQrSvg ? (
                  <View style={styles.qrContainer}>
                    <SvgXml xml={setupQrSvg} width={220} height={220} />
                  </View>
                ) : (
                  <View style={[styles.qrContainer, styles.qrPlaceholder]}>
                    <ActivityIndicator size="large" color={brand.blue} />
                  </View>
                )}

                <Text style={[styles.twoFactorStep, { color: colors.textSecondary }]}>
                  {t('settings.twoFactorManualHint')}
                </Text>
                <TouchableOpacity
                  style={[styles.secretBox, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={copySecret}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.secretText, { color: colors.text }]} selectable>{setupSecret}</Text>
                  {secretCopied ? (
                    <Check size={18} color={brand.turquoise} strokeWidth={2} />
                  ) : (
                    <Copy size={18} color={colors.textSecondary} strokeWidth={2} />
                  )}
                </TouchableOpacity>

                <View style={[styles.inputContainer, { marginTop: 20 }]}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>{t('settings.twoFactorEnterCodeLabel')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="123456"
                    value={setupCode}
                    onChangeText={(text) => setSetupCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholderTextColor={colors.textTertiary}
                    returnKeyType="done"
                    onSubmitEditing={confirmTwoFactorSetup}
                  />
                </View>
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => { Keyboard.dismiss(); setShowSetupModal(false); }}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.changeButton, { backgroundColor: brand.blue }, twoFactorLoading && styles.changeButtonDisabled]}
                  onPress={confirmTwoFactorSetup}
                  disabled={twoFactorLoading}
                >
                  {twoFactorLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.changeButtonText}>{t('settings.twoFactorVerify')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Recovery codes shown once after enabling */}
      <Modal
        visible={showRecoveryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRecoveryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.twoFactorRecoveryTitle')}</Text>
              <TouchableOpacity onPress={() => setShowRecoveryModal(false)}>
                <X size={24} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.twoFactorStep, { color: colors.textSecondary }]}>
                {t('settings.twoFactorRecoveryWarning')}
              </Text>
              <View style={[styles.recoveryGrid, { backgroundColor: colors.background, borderColor: colors.border }]}>
                {recoveryCodes.map((code) => (
                  <Text key={code} style={[styles.recoveryCode, { color: colors.text }]} selectable>{code}</Text>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.copyRecoveryButton, { borderColor: brand.blue }]}
                onPress={copyRecoveryCodes}
                activeOpacity={0.7}
              >
                {recoveryCopied ? (
                  <Check size={18} color={brand.turquoise} strokeWidth={2} />
                ) : (
                  <Copy size={18} color={brand.blue} strokeWidth={2} />
                )}
                <Text style={[styles.copyRecoveryText, { color: brand.blue }]}>
                  {recoveryCopied ? t('settings.twoFactorCopied') : t('settings.twoFactorCopyCodes')}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.changeButton, { backgroundColor: brand.blue }]}
                onPress={() => setShowRecoveryModal(false)}
              >
                <Text style={styles.changeButtonText}>{t('settings.twoFactorDone')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Disable: confirm with a current code */}
      <Modal
        visible={showDisableModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDisableModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKeyboardAvoid}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setShowDisableModal(false); }}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>

            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.twoFactorDisableTitle')}</Text>
                <TouchableOpacity onPress={() => setShowDisableModal(false)}>
                  <X size={24} color={colors.text} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalBody}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.twoFactorStep, { color: colors.textSecondary }]}>
                  {t('settings.twoFactorDisableHint')}
                </Text>
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>{t('settings.twoFactorEnterCodeLabel')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="123456"
                    value={disableCode}
                    onChangeText={(text) => setDisableCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholderTextColor={colors.textTertiary}
                    returnKeyType="done"
                    onSubmitEditing={handleDisableTwoFactor}
                  />
                </View>
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => { Keyboard.dismiss(); setShowDisableModal(false); }}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.changeButton, { backgroundColor: brand.coral }, twoFactorLoading && styles.changeButtonDisabled]}
                  onPress={handleDisableTwoFactor}
                  disabled={twoFactorLoading}
                >
                  {twoFactorLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.changeButtonText}>{t('settings.twoFactorTurnOff')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showHelpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.helpModalOverlay}>
          <View style={[styles.helpModalContent, { backgroundColor: colors.card }]}>
            <View style={styles.helpModalHeader}>
              <Text style={[styles.helpModalTitle, { color: colors.text }]}>
                {selectedHelpContent?.title}
              </Text>
              <TouchableOpacity
                style={styles.helpModalCloseButton}
                onPress={() => setShowHelpModal(false)}
                activeOpacity={0.7}
              >
                <X size={24} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.helpModalBody}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.helpModalSubtitle, { color: brand.blue }]}>
                {selectedHelpContent?.subtitle}
              </Text>
              <Text style={[styles.helpModalDescription, { color: colors.textSecondary }]}>
                {selectedHelpContent?.description}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <LanguageSelectorModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBarTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
    paddingTop: 60,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  menuValue: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  logoutContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFEDEB',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6F61',
  },
  modalKeyboardAvoid: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '60%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  modalScrollView: {
    flexGrow: 0,
    flexShrink: 1,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    minHeight: 300,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  changeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2D7DD2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeButtonDisabled: {
    opacity: 0.6,
  },
  changeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  helpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  helpModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  helpModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  helpModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
  },
  helpModalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  helpModalBody: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  helpModalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    lineHeight: 24,
  },
  helpModalDescription: {
    fontSize: 15,
    lineHeight: 24,
  },
  twoFactorStep: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  qrContainer: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  qrPlaceholder: {
    width: 244,
    height: 244,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secretBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  secretText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  recoveryGrid: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  recoveryCode: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
  },
  copyRecoveryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
  },
  copyRecoveryText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
