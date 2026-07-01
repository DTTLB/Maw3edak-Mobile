import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Animated, Pressable, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { X, ShieldCheck, Check, Fingerprint } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

interface ImageCaptchaProps {
  visible: boolean;
  onVerify: () => void;
  onClose: () => void;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// How long the user must hold to pass verification.
const HOLD_DURATION = 2500;

const RING_SIZE = 180;
const STROKE_WIDTH = 12;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function haptic(fn: () => void) {
  if (Platform.OS === 'web') return;
  try { fn(); } catch { /* haptics unavailable — ignore */ }
}

export default function ImageCaptcha({ visible, onVerify, onClose }: ImageCaptchaProps) {
  const { t } = useTranslation();
  const progress = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const runningAnim = useRef<Animated.CompositeAnimation | null>(null);
  const succeeded = useRef(false);

  const [verified, setVerified] = useState(false);
  const [holding, setHolding] = useState(false);
  const [percent, setPercent] = useState(0);

  // Keep a live percentage for the label.
  useEffect(() => {
    const id = progress.addListener(({ value }) => setPercent(Math.round(value * 100)));
    return () => progress.removeListener(id);
  }, [progress]);

  const reset = useCallback(() => {
    runningAnim.current?.stop();
    progress.stopAnimation();
    progress.setValue(0);
    scale.setValue(1);
    succeeded.current = false;
    setVerified(false);
    setHolding(false);
    setPercent(0);
  }, [progress, scale]);

  // Reset every time the modal opens.
  useEffect(() => {
    if (visible) reset();
  }, [visible, reset]);

  const handleSuccess = () => {
    if (succeeded.current) return;
    succeeded.current = true;
    setVerified(true);
    setHolding(false);
    haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    // Brief pause so the user sees the checkmark, then close.
    setTimeout(() => {
      onVerify();
      onClose();
    }, 700);
  };

  const startHold = () => {
    if (verified) return;
    setHolding(true);
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true }).start();

    runningAnim.current = Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_DURATION,
      useNativeDriver: false, // strokeDashoffset is not supported by the native driver
    });
    runningAnim.current.start(({ finished }) => {
      if (finished) handleSuccess();
    });
  };

  const endHold = () => {
    if (verified) return;
    setHolding(false);
    runningAnim.current?.stop();
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    // Drain the ring back to empty when released early.
    Animated.timing(progress, {
      toValue: 0,
      duration: 350,
      useNativeDriver: false,
    }).start();
  };

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const label = verified ? t('components.verified') : holding ? `${percent}%` : t('components.hold');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <ShieldCheck size={24} color="#10b981" strokeWidth={2} />
              <Text style={styles.headerTitle}>{t('components.verifyHuman')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6b7280" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Pressable
              onPressIn={startHold}
              onPressOut={endHold}
              disabled={verified}
              hitSlop={8}
            >
              <Animated.View style={[styles.ringWrapper, { transform: [{ scale }] }]}>
                <Svg width={RING_SIZE} height={RING_SIZE}>
                  {/* Track */}
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RADIUS}
                    stroke="#e5e7eb"
                    strokeWidth={STROKE_WIDTH}
                    fill="none"
                  />
                  {/* Progress */}
                  <AnimatedCircle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RADIUS}
                    stroke="#10b981"
                    strokeWidth={STROKE_WIDTH}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={strokeDashoffset}
                    transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                  />
                </Svg>

                <View style={styles.centerContent}>
                  {verified ? (
                    <Check size={52} color="#10b981" strokeWidth={2.5} />
                  ) : (
                    <Fingerprint size={48} color={holding ? '#10b981' : '#9ca3af'} strokeWidth={2} />
                  )}
                  <Text style={[styles.ringLabel, (holding || verified) && styles.ringLabelActive]}>
                    {label}
                  </Text>
                </View>
              </Animated.View>
            </Pressable>

            <Text style={styles.instruction}>
              {verified ? t('components.youreVerified') : t('components.pressAndHold')}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: width - 48,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: 'center',
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ringLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 1,
  },
  ringLabelActive: {
    color: '#10b981',
  },
  instruction: {
    marginTop: 28,
    fontSize: 15,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
});
