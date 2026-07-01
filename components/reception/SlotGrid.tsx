import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { Clock } from 'lucide-react-native';
import { formatTime12, type ReceptionSlot } from '@/utils/receptionApi';

// Responsive grid of 30-minute time slots.
//   available  -> tappable, highlighted when selected
//   unavailable-> greyed out, disabled
// Handles its own loading and empty states.
export default function SlotGrid({
  slots,
  selected,
  onSelect,
  loading,
}: {
  slots: ReceptionSlot[];
  selected: string | null;
  onSelect: (time: string) => void;
  loading?: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.muted, { color: colors.textSecondary }]}>{t('reception.loadingSlots')}</Text>
      </View>
    );
  }

  const hasAvailable = slots.some((s) => s.available);
  if (slots.length === 0 || !hasAvailable) {
    return (
      <View style={styles.center}>
        <Clock size={44} color={colors.textTertiary} strokeWidth={1.5} />
        <Text style={[styles.muted, { color: colors.textSecondary }]}>{t('reception.noSlots')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {slots.map((slot) => {
        const isSelected = selected === slot.time;
        const disabled = !slot.available;
        return (
          <TouchableOpacity
            key={slot.time}
            disabled={disabled}
            onPress={() => onSelect(slot.time)}
            activeOpacity={0.8}
            style={[
              styles.chip,
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
              isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
              disabled && styles.chipDisabled,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: colors.text },
                isSelected && { color: '#FFFFFF' },
                disabled && { color: colors.textTertiary },
              ]}
            >
              {formatTime12(slot.time)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 10 },
  muted: { fontSize: 14, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    minWidth: '30%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  chipDisabled: { opacity: 0.45 },
  chipText: { fontSize: 14, fontWeight: '700' },
});
