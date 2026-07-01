import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { Building2, ChevronRight } from 'lucide-react-native';
import type { ReceptionDoctor } from '@/utils/receptionApi';

// Tappable card for one doctor in the picker step.
export default function DoctorCard({
  doctor,
  selected,
  onPress,
}: {
  doctor: ReceptionDoctor;
  selected?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const clinicCount = doctor.clinics?.length || 0;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: selected ? colors.primary : 'transparent' },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {doctor.image_url ? (
        <Image source={{ uri: doctor.image_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {(doctor.first_name?.[0] || '') + (doctor.last_name?.[0] || '')}
          </Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {t('reception.doctorName', { name: `${doctor.first_name} ${doctor.last_name}` })}
        </Text>
        {doctor.specialization ? (
          <Text style={[styles.spec, { color: colors.textSecondary }]} numberOfLines={1}>
            {doctor.specialization}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Building2 size={12} color={colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {t('reception.clinicCount', { count: clinicCount })}
          </Text>
        </View>
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
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E2E8F0' },
  avatarFallback: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 16, fontWeight: '700' },
  spec: { fontSize: 13 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  meta: { fontSize: 12.5 },
});
