import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelectorModal } from '@/components/LanguageSelectorModal';
import { config } from '@/utils/config';
import { getDoctorPalette, DoctorPalette } from '@/utils/doctorPalette';
import { openExternalUrl, PRIVACY_POLICY_URL } from '@/utils/links';
import AccountDeletionSection from '@/components/AccountDeletionSection';
import { getSession } from '@/utils/auth';
import { brand } from '@/constants/brand';
import {
  LogOut,
  ChevronRight,
  User,
  Moon,
  HelpCircle,
  FileText,
  Bell,
  Fingerprint,
  Globe,
  Lock,
  X,
  ShieldCheck,
  Copy,
  Check,
  KeyRound,
} from 'lucide-react-native';

export default function DoctorSettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { session, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const P = useMemo(() => getDoctorPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(P), [P]);
  const { language, languages } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allowNotifications, setAllowNotifications] = useState(true);
  const [updatingNotifications, setUpdatingNotifications] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [, setLockMethod] = useState<'none' | 'pin' | 'biometric'>('none');
  const [updatingSecurity, setUpdatingSecurity] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedHelpContent, setSelectedHelpContent] = useState<any>(null);
  const [helpContent, setHelpContent] = useState<any[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // --- Two-Factor Authentication state ---
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  // 2FA may only be managed from the doctor's primary company. When the active
  // company is NOT the primary one, the toggle is read-only. Defaults to true so
  // a primary-company doctor isn't briefly blocked before the status loads.
  const [twoFactorCanManage, setTwoFactorCanManage] = useState(true);
  const [updating2FA, setUpdating2FA] = useState(false);
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [setupStep, setSetupStep] = useState<'scan' | 'recovery'>('scan');
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFAOtpauthUri, setTwoFAOtpauthUri] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [secretCopied, setSecretCopied] = useState(false);
  const [recoveryCopied, setRecoveryCopied] = useState(false);
  const [show2FADisableModal, setShow2FADisableModal] = useState(false);
  const [disableCode, setDisableCode] = useState('');

  const getSessionToken = useCallback(async (): Promise<string | null> => {
    const session = await getSession();
    return session?.access_token ?? null;
  }, []);

  const load2FAStatus = useCallback(async () => {
    try {
      const token = await getSessionToken();
      if (!token) return;

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-doctor-2fa-status`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'X-Session-Token': token,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        setTwoFactorEnabled(!!result.enabled);
        setTwoFactorRequired(!!result.required);
        // Older backends don't return this field — treat missing as "can manage"
        // (primary) so the toggle keeps working until the function is deployed.
        setTwoFactorCanManage(result.isPrimaryCompany !== false);
      }
    } catch (error) {
      console.error('Error loading 2FA status:', error);
    }
  }, [getSessionToken]);

  const handle2FAToggle = async (value: boolean) => {
    if (updating2FA) return;

    // 2FA can only be changed from the doctor's primary company. From any other
    // company it's read-only.
    if (!twoFactorCanManage) {
      Alert.alert(
        t('settings.twoFactorPrimaryOnlyTitle'),
        t('settings.twoFactorPrimaryOnlyMessage')
      );
      return;
    }

    // Admin forced 2FA on — disabling is not allowed from the app.
    if (!value && twoFactorRequired) {
      Alert.alert(
        t('settings.twoFactorLockedTitle'),
        t('settings.twoFactorLockedMessage')
      );
      return;
    }

    if (value) {
      await start2FASetup();
    } else {
      setDisableCode('');
      setShow2FADisableModal(true);
    }
  };

  const start2FASetup = async () => {
    try {
      setUpdating2FA(true);
      const token = await getSessionToken();
      if (!token) {
        Alert.alert(t('common.error'), t('settings.sessionNotFound'));
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-doctor-2fa-setup`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'X-Session-Token': token,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (response.ok && result.otpauthUri && result.secret) {
        setTwoFAOtpauthUri(result.otpauthUri);
        setTwoFASecret(result.secret);
        setTwoFACode('');
        setSecretCopied(false);
        setSetupStep('scan');
        setShow2FASetupModal(true);
      } else {
        Alert.alert(t('common.error'), result.error || t('settings.twoFactorSetupFailed'));
      }
    } catch (error) {
      console.error('Error starting 2FA setup:', error);
      Alert.alert(t('common.error'), t('settings.twoFactorSetupFailed'));
    } finally {
      setUpdating2FA(false);
    }
  };

  const submit2FAConfirm = async () => {
    if (twoFACode.length !== 6) {
      Alert.alert(t('common.error'), t('settings.twoFactorEnterCode'));
      return;
    }

    try {
      setUpdating2FA(true);
      const token = await getSessionToken();
      if (!token) {
        Alert.alert(t('common.error'), t('settings.sessionNotFound'));
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-doctor-2fa-confirm`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'X-Session-Token': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: twoFACode.trim() }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setRecoveryCodes(result.recoveryCodes || []);
        setRecoveryCopied(false);
        setTwoFactorEnabled(true);
        setSetupStep('recovery');
      } else {
        Alert.alert(t('common.error'), result.error || t('settings.twoFactorInvalidCode'));
      }
    } catch (error) {
      console.error('Error confirming 2FA:', error);
      Alert.alert(t('common.error'), t('settings.twoFactorInvalidCode'));
    } finally {
      setUpdating2FA(false);
    }
  };

  const submit2FADisable = async () => {
    if (disableCode.trim().length === 0) {
      Alert.alert(t('common.error'), t('settings.twoFactorEnterCode'));
      return;
    }

    try {
      setUpdating2FA(true);
      const token = await getSessionToken();
      if (!token) {
        Alert.alert(t('common.error'), t('settings.sessionNotFound'));
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-doctor-2fa-disable`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'X-Session-Token': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: disableCode.trim() }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setTwoFactorEnabled(false);
        setShow2FADisableModal(false);
        setDisableCode('');
        Alert.alert(t('common.success'), t('settings.twoFactorDisabled'));
      } else {
        Alert.alert(t('common.error'), result.error || t('settings.twoFactorInvalidCode'));
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      Alert.alert(t('common.error'), t('settings.twoFactorInvalidCode'));
    } finally {
      setUpdating2FA(false);
    }
  };

  const copySecret = async () => {
    await Clipboard.setStringAsync(twoFASecret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  const copyRecoveryCodes = async () => {
    await Clipboard.setStringAsync(recoveryCodes.join('\n'));
    setRecoveryCopied(true);
    setTimeout(() => setRecoveryCopied(false), 2000);
  };

  const close2FASetupModal = () => {
    setShow2FASetupModal(false);
    setTwoFASecret('');
    setTwoFAOtpauthUri('');
    setTwoFACode('');
    setRecoveryCodes([]);
    setSetupStep('scan');
  };

  const finishRecovery = () => {
    close2FASetupModal();
    Alert.alert(t('common.success'), t('settings.twoFactorEnabled'));
  };

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const sessionObj = await getSession();
      if (!sessionObj) {
        console.log('No session found');
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-doctor-settings`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'X-Session-Token': sessionObj.access_token,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      console.log('Settings loaded:', result);

      if (result.success && result.settings) {
        setAllowNotifications(result.settings.allow_notifications ?? true);
        setBiometricEnabled(result.settings.biometric_login ?? false);
        setLockMethod(result.settings.lock_method || 'none');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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
            userType: 'doctor',
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

  useEffect(() => {
    loadSettings();
    loadHelpContent();
  }, [loadSettings, loadHelpContent]);

  // Re-check 2FA status (incl. whether the active company is primary) whenever
  // the doctor switches clinics, so the toggle's read-only state stays correct.
  useEffect(() => {
    load2FAStatus();
  }, [session?.user?.company_id, load2FAStatus]);

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
    if (updatingNotifications) return;

    try {
      setUpdatingNotifications(true);
      const sessionObj = await getSession();
      if (!sessionObj) {
        Alert.alert('Error', 'Session not found');
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-toggle-doctor-notifications`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'X-Session-Token': sessionObj.access_token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ allow_notifications: value }),
        }
      );

      const result = await response.json();
      console.log('Notification toggle result:', result);

      if (result.success) {
        setAllowNotifications(value);
        Alert.alert('Success', `Push notifications ${value ? 'enabled' : 'disabled'}`);
      } else {
        Alert.alert('Error', result.error || 'Failed to update notification settings');
        setAllowNotifications(!value);
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings');
      setAllowNotifications(!value);
    } finally {
      setUpdatingNotifications(false);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (updatingSecurity) return;

    try {
      setUpdatingSecurity(true);

      if (value && Platform.OS !== 'web') {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();

        if (!compatible || securityLevel === LocalAuthentication.SecurityLevel.NONE) {
          Alert.alert(
            'Not Available',
            'Biometric or device credential authentication is not available on this device. Please set up Face ID, Touch ID, Fingerprint, or a device passcode in your device settings.'
          );
          setUpdatingSecurity(false);
          return;
        }

        // Pick a biometric-aware prompt so iOS surfaces Face ID (not just passcode)
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        const hasFaceId = supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
        const hasFingerprint = supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
        let promptMessage = t('components.unlockApp');
        if (hasFaceId) promptMessage = t('components.unlockWithFaceId');
        else if (hasFingerprint) promptMessage = t('components.unlockWithFingerprint');

        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage,
          fallbackLabel: t('components.usePasscode'),
          cancelLabel: t('common.cancel'),
          disableDeviceFallback: false,
        });

        if (!authResult.success) {
          if (__DEV__) console.log('[biometric] doctor enable failed:', authResult.error);
          // Silently bail on cancel — only alert on a genuine auth failure
          if (authResult.error !== 'user_cancel' && authResult.error !== 'system_cancel') {
            Alert.alert('Authentication Failed', 'Please try again');
          }
          setUpdatingSecurity(false);
          return;
        }
      }

      const sessionObj = await getSession();
      if (!sessionObj) {
        Alert.alert('Error', 'Session not found');
        setUpdatingSecurity(false);
        return;
      }

      const newLockMethod = value ? 'biometric' : 'none';

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-update-doctor-security-settings`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'X-Session-Token': sessionObj.access_token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            biometric_login: value,
            lock_method: newLockMethod,
          }),
        }
      );

      const result = await response.json();
      console.log('Biometric toggle result:', result);

      if (result.success) {
        setBiometricEnabled(value);
        setLockMethod(newLockMethod);

        if (Platform.OS !== 'web') {
          await SecureStore.setItemAsync('doctor_biometric_enabled', value.toString());
        }

        Alert.alert('Success', `Biometric authentication ${value ? 'enabled' : 'disabled'}`);
      } else {
        Alert.alert('Error', result.error || 'Failed to update security settings');
        setBiometricEnabled(!value);
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
      Alert.alert('Error', 'Failed to update security settings');
      setBiometricEnabled(!value);
    } finally {
      setUpdatingSecurity(false);
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('common.error'), t('settings.fillAllFields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('settings.passwordsDoNotMatch'));
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(t('common.error'), t('settings.passwordTooShort'));
      return;
    }

    try {
      setPasswordLoading(true);

      const sessionObj = await getSession();
      if (!sessionObj) {
        Alert.alert(t('common.error'), t('settings.sessionNotFound'));
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-change-doctor-password`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'X-Session-Token': sessionObj.access_token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        }
      );

      const result = await response.json();

      if (result.success) {
        closePasswordModal();
        Alert.alert(t('common.success'), t('settings.passwordChanged'));
      } else {
        Alert.alert(t('common.error'), result.error || t('settings.passwordChangeFailed'));
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert(t('common.error'), t('settings.passwordChangeFailed'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDarkModeToggle = async () => {
    try {
      await toggleTheme();
    } catch (error) {
      console.error('Error toggling dark mode:', error);
      Alert.alert('Error', 'Failed to update dark mode setting');
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

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: P.pageBg }]}>
        <ActivityIndicator size="large" color={P.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: P.pageBg }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.accountInformation')}</Text>
          <View style={[styles.menuItem, { backgroundColor: P.cardBg, borderBottomColor: P.softBorder }]}>
            <View style={[styles.iconCircle, { backgroundColor: brand.blueSoft }]}>
              <User size={20} color={brand.blue} strokeWidth={2} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: P.text }]}>
                {session?.user?.full_name || session?.user?.email || t('settings.doctorAccount')}
              </Text>
              <Text style={[styles.menuSubtitle, { color: P.textSecondary }]}>
                {session?.user?.email || t('settings.noEmail')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.preferences')}</Text>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: P.cardBg, borderBottomColor: P.softBorder }]}
            onPress={() => setShowLanguageModal(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: brand.blueSoft }]}>
              <Globe size={20} color={brand.blue} strokeWidth={2} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: P.text }]}>{t('settings.language')}</Text>
              <Text style={[styles.menuSubtitle, { color: P.textSecondary }]}>{t('settings.languageSub')}</Text>
            </View>
            <Text style={[styles.menuValue, { color: P.textSecondary }]}>
              {languages.find((l) => l.code === language)?.label}
            </Text>
            <ChevronRight size={20} color={P.chevron} strokeWidth={2} />
          </TouchableOpacity>

          <View style={[styles.menuItem, { backgroundColor: P.cardBg, borderBottomColor: P.softBorder }]}>
            <View style={[styles.iconCircle, { backgroundColor: brand.coralSoft }]}>
              <Bell size={20} color={brand.coral} strokeWidth={2} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: P.text }]}>{t('settings.pushNotifications')}</Text>
              <Text style={[styles.menuSubtitle, { color: P.textSecondary }]}>{t('settings.pushNotificationsSubDoctor')}</Text>
            </View>
            {updatingNotifications ? (
              <ActivityIndicator size="small" color={brand.blue} />
            ) : (
              <Switch
                value={allowNotifications}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: '#CBD5E1', true: brand.turquoise }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#CBD5E1"
                disabled={updatingNotifications}
              />
            )}
          </View>

          <View style={[styles.menuItem, { backgroundColor: P.cardBg, borderBottomColor: P.softBorder }]}>
            <View style={[styles.iconCircle, { backgroundColor: brand.turquoiseSoft }]}>
              <Fingerprint size={20} color={brand.turquoise} strokeWidth={2} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: P.text }]}>{t('settings.biometric')}</Text>
              <Text style={[styles.menuSubtitle, { color: P.textSecondary }]}>{t('settings.biometricSub')}</Text>
            </View>
            {updatingSecurity ? (
              <ActivityIndicator size="small" color={brand.blue} />
            ) : (
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: '#CBD5E1', true: brand.turquoise }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#CBD5E1"
                disabled={updatingSecurity}
              />
            )}
          </View>

          <View style={[styles.menuItem, { backgroundColor: P.cardBg, borderBottomColor: P.softBorder }]}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? '#374151' : '#1F2937' }]}>
              <Moon size={20} color="#FFFFFF" strokeWidth={2} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: P.text }]}>{t('settings.darkMode')}</Text>
              <Text style={[styles.menuSubtitle, { color: P.textSecondary }]}>{t('settings.darkModeSub')}</Text>
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
          <Text style={styles.sectionTitle}>{t('settings.security')}</Text>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: P.cardBg, borderBottomColor: P.softBorder }]}
            onPress={() => setShowPasswordModal(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: brand.coralSoft }]}>
              <Lock size={20} color={brand.coral} strokeWidth={2} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: P.text }]}>{t('settings.changePassword')}</Text>
              <Text style={[styles.menuSubtitle, { color: P.textSecondary }]}>{t('settings.changePasswordSub')}</Text>
            </View>
            <ChevronRight size={20} color={P.chevron} strokeWidth={2} />
          </TouchableOpacity>

          <View style={[styles.menuItem, { backgroundColor: P.cardBg, borderBottomColor: P.softBorder }]}>
            <View style={[styles.iconCircle, { backgroundColor: brand.turquoiseSoft }]}>
              <ShieldCheck size={20} color={brand.turquoise} strokeWidth={2} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: P.text }]}>{t('settings.twoFactor')}</Text>
              <Text style={[styles.menuSubtitle, { color: P.textSecondary }]}>
                {!twoFactorCanManage
                  ? t('settings.twoFactorPrimaryOnlySub')
                  : twoFactorRequired
                  ? t('settings.twoFactorRequiredSub')
                  : t('settings.twoFactorSub')}
              </Text>
            </View>
            {updating2FA ? (
              <ActivityIndicator size="small" color={brand.blue} />
            ) : (
              <Switch
                value={twoFactorEnabled}
                onValueChange={handle2FAToggle}
                trackColor={{ false: '#CBD5E1', true: brand.turquoise }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#CBD5E1"
                disabled={updating2FA || !twoFactorCanManage || (twoFactorEnabled && twoFactorRequired)}
              />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.support')}</Text>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: P.cardBg, borderBottomColor: P.softBorder }]}
            onPress={() => router.push('/help-center')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: brand.blueSoft }]}>
              <HelpCircle size={20} color={brand.blue} strokeWidth={2} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: P.text }]}>{t('settings.helpCenter')}</Text>
              <Text style={[styles.menuSubtitle, { color: P.textSecondary }]}>{t('settings.helpCenterSub')}</Text>
            </View>
            <ChevronRight size={20} color={P.chevron} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: P.cardBg, borderBottomColor: P.softBorder }]}
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
              <Text style={[styles.menuTitle, { color: P.text }]}>{t('settings.privacyPolicy')}</Text>
              <Text style={[styles.menuSubtitle, { color: P.textSecondary }]}>{t('settings.privacyPolicySub')}</Text>
            </View>
            <ChevronRight size={20} color={P.chevron} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: P.cardBg, borderBottomColor: P.softBorder }]}
            onPress={() => showHelpContentModal('terms_privacy')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: brand.blueSoft }]}>
              <FileText size={20} color={brand.blue} strokeWidth={2} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: P.text }]}>{t('settings.termsPrivacy')}</Text>
              <Text style={[styles.menuSubtitle, { color: P.textSecondary }]}>{t('settings.termsPrivacySub')}</Text>
            </View>
            <ChevronRight size={20} color={P.chevron} strokeWidth={2} />
          </TouchableOpacity>

          <AccountDeletionSection
            card={P.cardBg}
            border={P.softBorder}
            subtitleColor={P.textSecondary}
          />
        </View>

        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: P.cardBg, borderColor: brand.coralSoftBorder }]}
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
        onRequestClose={closePasswordModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKeyboardAvoid}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); closePasswordModal(); }}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>

            <View style={[styles.modalContent, { backgroundColor: P.cardBg }]}>
              <View style={[styles.modalHeader, { borderBottomColor: P.border }]}>
                <Text style={[styles.modalTitle, { color: P.text }]}>{t('settings.changePassword')}</Text>
                <TouchableOpacity onPress={closePasswordModal}>
                  <X size={24} color={P.text} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalFormBody}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: P.text }]}>{t('settings.currentPassword')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: P.inputBg, borderColor: P.inputBorder, color: P.text }]}
                    placeholder={t('settings.enterCurrentPassword')}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor={P.placeholder}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: P.text }]}>{t('settings.newPassword')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: P.inputBg, borderColor: P.inputBorder, color: P.text }]}
                    placeholder={t('settings.enterNewPassword')}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor={P.placeholder}
                    returnKeyType="next"
                  />
                  <Text style={[styles.inputHint, { color: P.textSecondary }]}>{t('settings.passwordMinHint')}</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: P.text }]}>{t('settings.confirmNewPassword')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: P.inputBg, borderColor: P.inputBorder, color: P.text }]}
                    placeholder={t('settings.confirmPasswordPlaceholder')}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor={P.placeholder}
                    returnKeyType="done"
                    onSubmitEditing={handleChangePassword}
                  />
                </View>
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: P.border }]}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: P.inputBg, borderColor: P.border }]}
                  onPress={() => { Keyboard.dismiss(); closePasswordModal(); }}
                >
                  <Text style={[styles.cancelButtonText, { color: P.textSecondary }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.changeButton, { backgroundColor: brand.blue }, passwordLoading && styles.changeButtonDisabled]}
                  onPress={handleChangePassword}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.changeButtonText}>{t('settings.changePassword')}</Text>
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
          <View style={[styles.helpModalContent, { backgroundColor: P.cardBg }]}>
            <View style={styles.helpModalHeader}>
              <Text style={[styles.helpModalTitle, { color: P.text }]}>
                {selectedHelpContent?.title}
              </Text>
              <TouchableOpacity
                style={styles.helpModalCloseButton}
                onPress={() => setShowHelpModal(false)}
                activeOpacity={0.7}
              >
                <X size={24} color={P.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.helpModalBody}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.helpModalSubtitle, { color: brand.blue }]}>
                {selectedHelpContent?.subtitle}
              </Text>
              <Text style={[styles.helpModalDescription, { color: P.textSecondary }]}>
                {selectedHelpContent?.description}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ---- Two-Factor Setup Modal (QR + confirm + recovery codes) ---- */}
      <Modal
        visible={show2FASetupModal}
        transparent
        animationType="slide"
        onRequestClose={setupStep === 'recovery' ? finishRecovery : close2FASetupModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKeyboardAvoid}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: P.cardBg }]}>
              <View style={[styles.modalHeader, { borderBottomColor: P.border }]}>
                <Text style={[styles.modalTitle, { color: P.text }]}>
                  {setupStep === 'scan'
                    ? t('settings.twoFactorSetupTitle')
                    : t('settings.twoFactorRecoveryTitle')}
                </Text>
                {setupStep === 'scan' && (
                  <TouchableOpacity onPress={close2FASetupModal}>
                    <X size={24} color={P.text} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalFormBody}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {setupStep === 'scan' ? (
                  <>
                    <Text style={[styles.twoFAStepText, { color: P.textSecondary }]}>
                      {t('settings.twoFactorScanHint')}
                    </Text>

                    <View style={styles.qrContainer}>
                      {twoFAOtpauthUri ? (
                        <View style={styles.qrBox}>
                          <QRCode value={twoFAOtpauthUri} size={200} />
                        </View>
                      ) : null}
                    </View>

                    <Text style={[styles.twoFAStepText, { color: P.textSecondary }]}>
                      {t('settings.twoFactorManualHint')}
                    </Text>

                    <TouchableOpacity
                      style={[styles.secretBox, { backgroundColor: P.inputBg, borderColor: P.inputBorder }]}
                      onPress={copySecret}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.secretText, { color: P.text }]} selectable>
                        {twoFASecret}
                      </Text>
                      {secretCopied ? (
                        <Check size={18} color={brand.turquoise} strokeWidth={2} />
                      ) : (
                        <Copy size={18} color={P.textSecondary} strokeWidth={2} />
                      )}
                    </TouchableOpacity>

                    <View style={styles.inputContainer}>
                      <Text style={[styles.inputLabel, { color: P.text }]}>
                        {t('settings.twoFactorEnterCodeLabel')}
                      </Text>
                      <TextInput
                        style={[styles.input, styles.codeInput, { backgroundColor: P.inputBg, borderColor: P.inputBorder, color: P.text }]}
                        placeholder="123456"
                        value={twoFACode}
                        onChangeText={(v) => setTwoFACode(v.replace(/[^0-9]/g, '').slice(0, 6))}
                        keyboardType="number-pad"
                        maxLength={6}
                        placeholderTextColor={P.placeholder}
                        returnKeyType="done"
                        onSubmitEditing={submit2FAConfirm}
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={[styles.twoFAWarning, { color: P.danger }]}>
                      {t('settings.twoFactorRecoveryWarning')}
                    </Text>

                    <View style={[styles.recoveryGrid, { backgroundColor: P.inputBg, borderColor: P.inputBorder }]}>
                      {recoveryCodes.map((code) => (
                        <Text key={code} style={[styles.recoveryCode, { color: P.text }]} selectable>
                          {code}
                        </Text>
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
                  </>
                )}
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: P.border }]}>
                {setupStep === 'scan' ? (
                  <>
                    <TouchableOpacity
                      style={[styles.cancelButton, { backgroundColor: P.inputBg, borderColor: P.border }]}
                      onPress={() => { Keyboard.dismiss(); close2FASetupModal(); }}
                    >
                      <Text style={[styles.cancelButtonText, { color: P.textSecondary }]}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.changeButton, { backgroundColor: brand.blue }, updating2FA && styles.changeButtonDisabled]}
                      onPress={submit2FAConfirm}
                      disabled={updating2FA}
                    >
                      {updating2FA ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.changeButtonText}>{t('settings.twoFactorVerify')}</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={[styles.changeButton, { backgroundColor: brand.blue, flex: 1 }]}
                    onPress={finishRecovery}
                  >
                    <Text style={styles.changeButtonText}>{t('settings.twoFactorDone')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ---- Two-Factor Disable Modal (verify current code) ---- */}
      <Modal
        visible={show2FADisableModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShow2FADisableModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKeyboardAvoid}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setShow2FADisableModal(false); }}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>

            <View style={[styles.modalContent, { backgroundColor: P.cardBg }]}>
              <View style={[styles.modalHeader, { borderBottomColor: P.border }]}>
                <Text style={[styles.modalTitle, { color: P.text }]}>{t('settings.twoFactorDisableTitle')}</Text>
                <TouchableOpacity onPress={() => setShow2FADisableModal(false)}>
                  <X size={24} color={P.text} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalFormBody}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.twoFADisableIcon}>
                  <KeyRound size={28} color={brand.coral} strokeWidth={2} />
                </View>
                <Text style={[styles.twoFAStepText, { color: P.textSecondary, textAlign: 'center' }]}>
                  {t('settings.twoFactorDisableHint')}
                </Text>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, styles.codeInput, { backgroundColor: P.inputBg, borderColor: P.inputBorder, color: P.text }]}
                    placeholder={t('settings.twoFactorCodePlaceholder')}
                    value={disableCode}
                    onChangeText={(v) => setDisableCode(v.replace(/\s/g, '').slice(0, 11))}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    placeholderTextColor={P.placeholder}
                    returnKeyType="done"
                    onSubmitEditing={submit2FADisable}
                  />
                </View>
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: P.border }]}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: P.inputBg, borderColor: P.border }]}
                  onPress={() => { Keyboard.dismiss(); setShow2FADisableModal(false); }}
                >
                  <Text style={[styles.cancelButtonText, { color: P.textSecondary }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.changeButton, { backgroundColor: brand.coral }, updating2FA && styles.changeButtonDisabled]}
                  onPress={submit2FADisable}
                  disabled={updating2FA}
                >
                  {updating2FA ? (
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

      <LanguageSelectorModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
    </View>
  );
}

const makeStyles = (P: DoctorPalette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.pageBg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: P.pageBg,
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
    color: P.textSecondary,
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.cardBg,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: P.softBorder,
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
    color: P.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: P.textSecondary,
  },
  menuValue: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
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
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.dangerBg,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: P.danger,
  },
  helpModalOverlay: {
    flex: 1,
    backgroundColor: P.overlay,
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
    borderBottomColor: P.border,
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
  modalKeyboardAvoid: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: P.overlay,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '85%',
    shadowColor: P.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalScrollView: {
    paddingHorizontal: 24,
  },
  modalFormBody: {
    paddingTop: 20,
    paddingBottom: 8,
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 6,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  changeButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
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
  twoFAStepText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  qrBox: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  secretBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 18,
  },
  secretText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
    flex: 1,
  },
  codeInput: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 6,
    textAlign: 'center',
  },
  twoFAWarning: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  recoveryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  recoveryCode: {
    width: '48%',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
    paddingVertical: 6,
    textAlign: 'center',
  },
  copyRecoveryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 8,
  },
  copyRecoveryText: {
    fontSize: 15,
    fontWeight: '600',
  },
  twoFADisableIcon: {
    alignItems: 'center',
    marginBottom: 12,
  },
});
