import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView , useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  X,
  QrCode,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Link2,
  RefreshCw,
  Camera as CameraIcon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { config } from '@/utils/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FRAME_SIZE = Math.min(SCREEN_WIDTH * 0.72, 300);

type Step = 'scanning' | 'confirm' | 'linking' | 'success' | 'error';

export interface QrScannerErrorInfo {
  title: string;
  message: string;
  canRetry: boolean; // whether a retry button is shown
  /**
   * 'rescan' (default) re-opens the camera for a fresh scan ("Scan again").
   * 'resend' re-sends the SAME token to the endpoint ("Retry") — used for
   * transient network failures where the scanned token is still valid.
   */
  retryMode?: 'rescan' | 'resend';
  retryLabel?: string;
}

export interface QrLinkScannerConfig {
  /** Edge Function path, e.g. 'redeem-qr-token' or 'redeem-qr-user-token'. */
  endpoint: string;
  /** Body field name carrying the caller's own identity, e.g. 'medical_id' | 'global_id'. */
  identityField: string;
  /** The identity value, read from the authenticated session (never typed/scanned). */
  identityValue?: string;
  /** Doctor endpoint requires an explicit `apikey` header in addition to Authorization. */
  sendApikeyHeader?: boolean;
  /** Response keys to read the linked entity's display name from, in priority order. */
  nameKeys: string[];
  /** Shown when no name is present, so the success copy always names *something*. */
  nameFallback: string;
  /**
   * Error copy keyed by the backend's stable `code`. Must include 'network' and
   * 'unknown'. Every key other than those two is treated as a recognized
   * backend error code; anything else falls back to 'unknown'.
   */
  errorCopy: Record<string, QrScannerErrorInfo>;
  /** Error code to surface when the session has no identity value (abort pre-call). */
  missingIdentityCode: string;
  /** User-facing strings (entity wording differs between patient/doctor). */
  text: {
    headerTitle: string;
    cameraTitle: string;
    cameraHint: string;
    webBody: string;
    permissionBody: string;
    confirmTitle: string;
    confirmBody: string;
    noticeText: string;
    linkingBody: string;
    successLinkedTitle: string;
    successAlreadyTitle: string;
    successLinkedMessage: (name: string) => string;
    successAlreadyMessage: (name: string) => string;
  };
  /** Where "Done" / finish navigates (e.g. back to the relevant home tabs). */
  onFinish: () => void;
  /** Called once when a link succeeds (linked or already_linked) — refresh hook. */
  onLinked?: () => void;
}

/**
 * The QR may encode the raw token, a URL containing `?token=`, or a small JSON
 * payload like {"token":"..."}. Extract the token defensively from any of these.
 * The token is opaque and is never logged.
 */
function extractToken(raw: string): string | null {
  if (!raw) return null;
  const value = raw.trim();

  // JSON payload
  if (value.startsWith('{')) {
    try {
      const parsed = JSON.parse(value);
      const t = parsed.token || parsed.qr_token || parsed.code;
      if (typeof t === 'string' && t.length > 0) return t.trim();
    } catch {
      // fall through
    }
  }

  // URL / deep link containing a token query param
  if (value.includes('token=')) {
    const match = value.match(/[?&]token=([^&\s]+)/);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }

  // Otherwise treat the whole payload as the token, as long as it looks like one
  // (no spaces, reasonable length). Avoids accidentally accepting arbitrary text.
  if (!/\s/.test(value) && value.length >= 6 && value.length <= 512) {
    return value;
  }

  return null;
}

function readName(result: any, keys: string[], fallback: string): string {
  for (const key of keys) {
    const v = result?.[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return fallback;
}

export default function QrLinkScanner(config_: QrLinkScannerConfig) {
  const {
    endpoint,
    identityField,
    identityValue,
    sendApikeyHeader,
    nameKeys,
    nameFallback,
    errorCopy,
    missingIdentityCode,
    text,
    onFinish,
    onLinked,
  } = config_;

  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();

  const [step, setStep] = useState<Step>('scanning');
  const [token, setToken] = useState<string | null>(null);
  const [linkedName, setLinkedName] = useState<string>(nameFallback);
  const [alreadyLinked, setAlreadyLinked] = useState(false);
  const [errorCode, setErrorCode] = useState<string>('unknown');

  // Guard so the camera fires the redeem flow only once per scan.
  const scanLock = useRef(false);

  // Recognized backend error codes (everything except the two internal ones).
  const knownCodes = Object.keys(errorCopy).filter(
    (c) => c !== 'network' && c !== 'unknown'
  );

  const resetToScan = useCallback(() => {
    scanLock.current = false;
    setToken(null);
    setLinkedName(nameFallback);
    setAlreadyLinked(false);
    setStep('scanning');
  }, [nameFallback]);

  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (scanLock.current) return;
      const extracted = extractToken(result?.data ?? '');
      if (!extracted) {
        // Not a recognizable code — keep scanning silently.
        return;
      }
      scanLock.current = true; // single-fire: pause on decode
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
          () => {}
        );
      }
      setToken(extracted);
      setStep('confirm');
    },
    []
  );

  const handleConfirmLink = useCallback(async () => {
    if (!token) return;

    // Identity must come from the session. Abort before calling if it's absent.
    if (!identityValue) {
      setErrorCode(missingIdentityCode);
      setStep('error');
      return;
    }

    setStep('linking');

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${config.supabaseAnonKey}`,
        'Content-Type': 'application/json',
      };
      if (sendApikeyHeader) {
        headers.apikey = config.supabaseAnonKey;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/${endpoint}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ token, [identityField]: identityValue }),
        }
      );

      let result: any = {};
      try {
        result = await response.json();
      } catch {
        // non-JSON response — fall through to the network branch below.
        setErrorCode('network');
        setStep('error');
        return;
      }

      // Branch on the stable `code` field only (never HTTP status / message text).
      const code = (result?.code ?? '') as string;

      if (code === 'linked' || code === 'already_linked') {
        setLinkedName(readName(result, nameKeys, nameFallback));
        setAlreadyLinked(code === 'already_linked');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          ).catch(() => {});
        }
        onLinked?.();
        setStep('success');
        return;
      }

      setErrorCode(knownCodes.includes(code) ? code : 'unknown');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
          () => {}
        );
      }
      setStep('error');
    } catch {
      // Request never completed (offline, DNS, timeout, etc.).
      setErrorCode('network');
      setStep('error');
    }
  }, [
    token,
    identityValue,
    identityField,
    endpoint,
    sendApikeyHeader,
    missingIdentityCode,
    nameKeys,
    nameFallback,
    knownCodes,
    onLinked,
  ]);

  // ---- Web fallback (no camera) ----
  if (Platform.OS === 'web' && step === 'scanning') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header colors={colors} title={text.headerTitle} onClose={() => router.back()} />
        <View style={styles.centered}>
          <View style={[styles.iconBubble, { backgroundColor: colors.primaryLight }]}>
            <CameraIcon size={40} color={colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={[styles.stateTitle, { color: colors.text }]}>
            {t('components.openOnPhone')}
          </Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            {text.webBody}
          </Text>
          <PrimaryButton label={t('components.goBack')} color={colors.primary} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  // ---- Permission gate ----
  if (step === 'scanning' && !permission?.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header colors={colors} title={text.headerTitle} onClose={() => router.back()} />
        <View style={styles.centered}>
          <View style={[styles.iconBubble, { backgroundColor: colors.primaryLight }]}>
            <CameraIcon size={40} color={colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={[styles.stateTitle, { color: colors.text }]}>
            {t('components.cameraAccessNeeded')}
          </Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            {text.permissionBody}
          </Text>
          <PrimaryButton
            label={t('components.allowCamera')}
            color={colors.primary}
            onPress={requestPermission}
          />
          <TouchableOpacity style={styles.linkBtn} onPress={() => router.back()}>
            <Text style={[styles.linkBtnText, { color: colors.textSecondary }]}>
              {t('components.notNow')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---- Scanning (camera) ----
  if (step === 'scanning') {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />

        <View style={[styles.cameraTopBar, { paddingTop: insets.top + 12 }]} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.cameraCloseBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <X size={22} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.cameraTitle}>{text.cameraTitle}</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.cameraCenter} pointerEvents="none">
          <View style={[styles.frame, { width: FRAME_SIZE, height: FRAME_SIZE }]}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.cameraHint}>{text.cameraHint}</Text>
        </View>
      </View>
    );
  }

  // ---- Confirm ----
  if (step === 'confirm') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header colors={colors} title={text.headerTitle} onClose={() => router.back()} />
        <View style={styles.centered}>
          <View style={[styles.iconBubble, { backgroundColor: colors.primaryLight }]}>
            <Link2 size={40} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={[styles.stateTitle, { color: colors.text }]}>
            {text.confirmTitle}
          </Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            {text.confirmBody}
          </Text>

          <View style={[styles.noticeCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <ShieldCheck size={18} color={colors.success} strokeWidth={2} />
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
              {text.noticeText}
            </Text>
          </View>

          <PrimaryButton
            label={t('components.confirmAndLink')}
            color={colors.primary}
            onPress={handleConfirmLink}
          />
          <TouchableOpacity style={styles.linkBtn} onPress={resetToScan}>
            <Text style={[styles.linkBtnText, { color: colors.textSecondary }]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---- Linking (spinner) ----
  if (step === 'linking') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.text, marginTop: 20 }]}>
            {t('components.linking')}
          </Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            {text.linkingBody}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---- Success (linked or already linked) ----
  if (step === 'success') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <View style={[styles.iconBubble, { backgroundColor: colors.successLight }]}>
            <CheckCircle2 size={48} color={colors.success} strokeWidth={2} />
          </View>
          <Text style={[styles.stateTitle, { color: colors.text }]}>
            {alreadyLinked ? text.successAlreadyTitle : text.successLinkedTitle}
          </Text>
          <View style={styles.providerRow}>
            <Building2 size={18} color={colors.primary} strokeWidth={2} />
            <Text style={[styles.providerName, { color: colors.text }]}>
              {linkedName}
            </Text>
          </View>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            {alreadyLinked
              ? text.successAlreadyMessage(linkedName)
              : text.successLinkedMessage(linkedName)}
          </Text>
          <PrimaryButton label={t('common.done')} color={colors.primary} onPress={onFinish} />
        </View>
      </SafeAreaView>
    );
  }

  // ---- Error ----
  const info = errorCopy[errorCode] ?? errorCopy.unknown;
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header colors={colors} title={text.headerTitle} onClose={onFinish} />
      <View style={styles.centered}>
        <View style={[styles.iconBubble, { backgroundColor: colors.errorLight }]}>
          <AlertCircle size={48} color={colors.error} strokeWidth={2} />
        </View>
        <Text style={[styles.stateTitle, { color: colors.text }]}>{info.title}</Text>
        <Text style={[styles.stateText, { color: colors.textSecondary }]}>
          {info.message}
        </Text>

        {info.canRetry ? (
          <PrimaryButton
            label={
              info.retryLabel ??
              (info.retryMode === 'resend' ? t('common.retry') : t('components.scanAgain'))
            }
            color={colors.primary}
            icon={<RefreshCw size={18} color="#FFFFFF" strokeWidth={2} />}
            onPress={info.retryMode === 'resend' ? handleConfirmLink : resetToScan}
          />
        ) : (
          <PrimaryButton label={t('common.done')} color={colors.primary} onPress={onFinish} />
        )}
        <TouchableOpacity style={styles.linkBtn} onPress={onFinish}>
          <Text style={[styles.linkBtnText, { color: colors.textSecondary }]}>
            {t('components.backToHome')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ---- Small shared pieces ----

function Header({
  colors,
  title,
  onClose,
}: {
  colors: any;
  title: string;
  onClose: () => void;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerBtn} onPress={onClose} activeOpacity={0.7}>
        <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
      </TouchableOpacity>
      <View style={styles.headerTitleRow}>
        <QrCode size={18} color={colors.primary} strokeWidth={2} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
      </View>
      <View style={{ width: 40 }} />
    </View>
  );
}

function PrimaryButton({
  label,
  color,
  onPress,
  icon,
}: {
  label: string;
  color: string;
  onPress: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {icon}
      <Text style={styles.primaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconBubble: {
    width: 96,
    height: 96,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stateTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  stateText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  providerName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 28,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  linkBtn: {
    paddingVertical: 14,
    marginTop: 4,
  },
  linkBtnText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  // Camera
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  cameraCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cameraCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  frame: {
    borderRadius: 20,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#FFFFFF',
    borderWidth: 4,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },
  cameraHint: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 40,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
