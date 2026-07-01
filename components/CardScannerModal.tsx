import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Camera, RefreshCw, Scan } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { config } from '@/utils/config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScannedCardData {
  cardNumber: string;
  expiry: string;
  holderName: string;
  brand: string;
}

interface CardScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onCardScanned: (data: ScannedCardData) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = CARD_WIDTH * 0.63;

export function CardScannerModal({ visible, onClose, onCardScanned }: CardScannerModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || scanning) return;
    setError(null);
    setScanning(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.4,
        skipProcessing: true,
      });

      if (!photo?.base64) {
        setError(t('components.couldNotCapture'));
        setScanning(false);
        return;
      }

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-scan-card`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageBase64: photo.base64 }),
        }
      );

      const result = await response.json();

      if (result.success && result.cardNumber) {
        onCardScanned({
          cardNumber: result.cardNumber,
          expiry: result.expiry || '',
          holderName: result.holderName || '',
          brand: result.brand || 'Other',
        });
      } else {
        setError(result.error || t('components.couldNotReadCard'));
      }
    } catch {
      setError(t('components.failedToProcessImage'));
    } finally {
      setScanning(false);
    }
  }, [scanning, onCardScanned, t]);

  if (!visible) return null;

  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={[styles.webFallback, { backgroundColor: colors.card }]}>
            <Camera size={48} color={colors.primary} strokeWidth={1.5} />
            <Text style={[styles.webFallbackTitle, { color: colors.text }]}>{t('components.cameraNotAvailable')}</Text>
            <Text style={[styles.webFallbackText, { color: colors.textSecondary }]}>
              {t('components.cardScanRequiresDevice')}
            </Text>
            <TouchableOpacity style={[styles.webFallbackBtn, { backgroundColor: colors.primary }]} onPress={onClose}>
              <Text style={styles.webFallbackBtnText}>{t('components.enterManually')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  if (!permission?.granted) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={[styles.permissionContainer, { backgroundColor: colors.card, paddingBottom: insets.bottom + 24 }]}>
            <View style={[styles.permissionIconBg, { backgroundColor: colors.primaryLight }]}>
              <Camera size={40} color={colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={[styles.permissionTitle, { color: colors.text }]}>{t('components.cameraAccessRequired')}</Text>
            <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
              {t('components.cameraAccessCardMessage')}
            </Text>
            <TouchableOpacity
              style={[styles.permissionBtn, { backgroundColor: colors.primary }]}
              onPress={requestPermission}
              activeOpacity={0.8}
            >
              <Text style={styles.permissionBtnText}>{t('components.allowCameraAccess')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.permissionSkipBtn} onPress={onClose}>
              <Text style={[styles.permissionSkipText, { color: colors.textSecondary }]}>{t('components.enterManually')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

        <View style={styles.topBar} pointerEvents="box-none">
          <View style={{ height: insets.top + 16 }} />
          <View style={styles.topBarContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <X size={22} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.scanTitle}>{t('components.scanCard')}</Text>
            <View style={{ width: 44 }} />
          </View>
        </View>

        <View style={styles.scanAreaContainer} pointerEvents="none">
          <View style={styles.scanAreaWrapper}>
            <View style={[styles.cardFrame, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              {scanning && (
                <View style={styles.scanLineContainer}>
                  <View style={styles.scanLine} />
                </View>
              )}
            </View>
            <Text style={styles.scanHint}>
              {t('components.positionCardInFrame')}
            </Text>
            <Text style={styles.scanSubHint}>
              {t('components.ensureCardDetailsVisible')}
            </Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
          {scanning ? (
            <View style={styles.scanningState}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.scanningText}>{t('components.readingCardDetails')}</Text>
            </View>
          ) : (
            <View style={styles.captureArea}>
              {error && (
                <TouchableOpacity style={styles.retryHint} onPress={() => setError(null)}>
                  <RefreshCw size={14} color="rgba(255,255,255,0.7)" strokeWidth={2} />
                  <Text style={styles.retryHintText}>{t('components.tapToTryAgain')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCapture}
                activeOpacity={0.85}
              >
                <View style={styles.captureButtonInner}>
                  <Scan size={28} color="#FFFFFF" strokeWidth={2} />
                </View>
              </TouchableOpacity>
              <Text style={styles.captureTip}>{t('components.tapToScan')}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  webFallback: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  webFallbackTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  webFallbackText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  webFallbackBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 8,
  },
  webFallbackBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 32,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 12,
  },
  permissionIconBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  permissionBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionSkipBtn: {
    paddingVertical: 12,
  },
  permissionSkipText: {
    fontSize: 15,
    fontWeight: '500',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scanAreaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanAreaWrapper: {
    alignItems: 'center',
    gap: 20,
  },
  cardFrame: {
    borderRadius: 16,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  scanLineContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  scanLine: {
    height: 2,
    backgroundColor: 'rgba(100,200,255,0.7)',
    shadowColor: '#64C8FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  scanHint: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  scanSubHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  errorBanner: {
    position: 'absolute',
    bottom: 200,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(239,68,68,0.9)',
    borderRadius: 12,
    padding: 14,
    zIndex: 20,
  },
  errorBannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanningState: {
    alignItems: 'center',
    gap: 16,
    paddingBottom: 8,
  },
  scanningText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  captureArea: {
    alignItems: 'center',
    gap: 12,
  },
  retryHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  retryHintText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureTip: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
});
