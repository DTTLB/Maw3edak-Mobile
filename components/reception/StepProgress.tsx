import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Check } from 'lucide-react-native';

export interface WizardStep {
  id: string;
  label: string;
  icon: any;
}

// Horizontal step indicator for the booking wizard. Steps before the active one
// render as completed (check mark); the active one is highlighted.
export default function StepProgress({
  steps,
  currentIndex,
}: {
  steps: WizardStep[];
  currentIndex: number;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isDone = index < currentIndex;
        const Icon = step.icon;
        const filled = isActive || isDone;
        return (
          <View key={step.id} style={styles.item}>
            <View
              style={[
                styles.circle,
                { backgroundColor: filled ? colors.primary : colors.backgroundSecondary },
              ]}
            >
              {isDone ? (
                <Check size={16} color="#FFFFFF" strokeWidth={3} />
              ) : (
                <Icon size={16} color={isActive ? '#FFFFFF' : colors.textTertiary} strokeWidth={2.5} />
              )}
            </View>
            <Text
              style={[
                styles.label,
                { color: filled ? colors.primary : colors.textTertiary },
              ]}
              numberOfLines={1}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  item: { flex: 1, alignItems: 'center', gap: 6 },
  circle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 11, fontWeight: '700' },
});
