import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface BackButtonProps {
  /** Icon color — pass the screen's text/primary color so it adapts to the theme. */
  color: string;
  size?: number;
  /** Override the default behaviour (router.back). */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shared header back button. Falls back to no-op when there is no screen to
 * go back to so it never crashes on a root screen.
 */
export default function BackButton({ color, size = 24, onPress, style }: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.backButton, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <ArrowLeft size={size} color={color} strokeWidth={2} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
