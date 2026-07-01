import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { CircleCheck, CircleAlert } from 'lucide-react-native';

export type ToastType = 'success' | 'error';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

const HIDE_DELAY = 2600;

/**
 * Lightweight toast state manager. The app has no toast primitive, so this keeps the
 * footprint small: one state value, an auto-hide timer, and a presentational <Toast />.
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ visible: true, message, type });
    timer.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, HIDE_DELAY);
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { toast, showToast };
}

interface ToastProps {
  visible: boolean;
  message: string;
  type: ToastType;
}

export function Toast({ visible, message, type }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: visible ? 0 : 20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, opacity, translateY]);

  const isSuccess = type === 'success';
  const Icon = isSuccess ? CircleCheck : CircleAlert;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <View
        style={[
          styles.toast,
          isSuccess ? styles.toastSuccess : styles.toastError,
        ]}
      >
        <Icon size={20} color="#ffffff" strokeWidth={2.5} />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    maxWidth: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastSuccess: {
    backgroundColor: '#15C2B0',
  },
  toastError: {
    backgroundColor: '#FF6F61',
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
