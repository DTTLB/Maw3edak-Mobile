import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { Phone, Hash, ChevronRight } from 'lucide-react-native';
import type { ReceptionPatient } from '@/utils/receptionApi';

// Tappable card for one patient in the picker step.
export default function PatientCard({
  patient,
  selected,
  onPress,
}: {
  patient: ReceptionPatient;
  selected?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const initials = (patient.full_name || '?')
    .split(' ')
    .map((n) => n[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: selected ? colors.primary : 'transparent' },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {patient.full_name || t('reception.unknownPatient')}
        </Text>
        <View style={styles.metaRow}>
          <Hash size={12} color={colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
            {patient.medical_id}
          </Text>
        </View>
        {patient.phone ? (
          <View style={styles.metaRow}>
            <Phone size={12} color={colors.textSecondary} strokeWidth={2} />
            <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
              {patient.phone}
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
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 16, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { fontSize: 12.5, flexShrink: 1 },
});
