import React, { useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';

interface OtpInputProps {
  /** Current code as a plain string (e.g. "1234"). */
  value: string;
  /** Called with the full code string whenever a box changes. */
  onChange: (code: string) => void;
  /** Number of boxes. Defaults to 6. */
  length?: number;
  /** Accent color for the filled/focused box border. */
  accentColor?: string;
  /** Show the error styling on every box. */
  hasError?: boolean;
  /** Focus the first box on mount. */
  autoFocus?: boolean;
  /** Called once the code is fully filled (all boxes). */
  onComplete?: (code: string) => void;
  editable?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Segmented one-time-code input: one box per digit, with auto-advance on type,
 * back-navigation on Backspace, and full-code paste/autofill support.
 * Controlled by a single string so callers keep their existing string state.
 */
export default function OtpInput({
  value,
  onChange,
  length = 6,
  accentColor = '#2D7DD2',
  hasError = false,
  autoFocus = false,
  onComplete,
  editable = true,
  containerStyle,
}: OtpInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const commit = (next: string[]) => {
    const code = next.join('').replace(/[^0-9]/g, '').slice(0, length);
    onChange(code);
    if (code.length === length) {
      onComplete?.(code);
    }
  };

  const handleChange = (index: number, text: string) => {
    const clean = text.replace(/[^0-9]/g, '');

    // Deletion inside the box.
    if (clean.length === 0) {
      const next = [...digits];
      next[index] = '';
      commit(next);
      return;
    }

    // Paste or OTP autofill that drops several digits into one box.
    if (clean.length > 1) {
      const next = [...digits];
      const chars = clean.split('').slice(0, length - index);
      chars.forEach((c, i) => {
        next[index + i] = c;
      });
      commit(next);
      const landing = index + chars.length;
      if (landing >= length) {
        inputRefs.current[length - 1]?.blur();
      } else {
        inputRefs.current[landing]?.focus();
      }
      return;
    }

    // Single digit: fill and advance.
    const next = [...digits];
    next[index] = clean;
    commit(next);
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    } else {
      inputRefs.current[index]?.blur();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputRefs.current[index] = ref;
          }}
          style={[
            styles.box,
            digit ? { borderColor: accentColor, backgroundColor: '#EAF3FC' } : null,
            hasError ? styles.boxError : null,
          ]}
          value={digit}
          onChangeText={(text) => handleChange(index, text)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
          keyboardType="number-pad"
          maxLength={length}
          editable={editable}
          selectTextOnFocus
          autoFocus={autoFocus && index === 0}
          textContentType="oneTimeCode"
          autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
          placeholder="•"
          placeholderTextColor="#d1d5db"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  box: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  boxError: {
    borderColor: '#FF6F61',
    backgroundColor: '#FFEDEB',
  },
});
