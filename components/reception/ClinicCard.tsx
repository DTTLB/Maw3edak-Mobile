import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Building2, MapPin, ChevronRight } from 'lucide-react-native';
import type { ReceptionClinic } from '@/utils/receptionApi';

// Tappable card for one clinic in the picker step.
export default function ClinicCard({
  clinic,
  selected,
  onPress,
}: {
  clinic: ReceptionClinic;
  selected?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: selected ? colors.primary : 'transparent' },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight || '#EAF3FC' }]}>
        <Building2 size={26} color={colors.primary} strokeWidth={2} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{clinic.name}</Text>
        {clinic.address ? (
          <View style={styles.addressRow}>
            <MapPin size={13} color={colors.textSecondary} strokeWidth={2} />
            <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={2}>
              {clinic.address}
            </Text>
          </View>
        ) : null}
      </View>
      <ChevronRight size={22} color={colors.primary} strokeWidth={2} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  iconWrap: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: '700' },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
  address: { flex: 1, fontSize: 13, lineHeight: 18 },
});
