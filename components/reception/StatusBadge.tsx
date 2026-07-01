import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Clock, CheckCircle2, XCircle, CircleCheck, Calendar } from 'lucide-react-native';

// Color-coded appointment status pill.
//   pending            -> amber  ("Pending confirmation")
//   confirmed/scheduled-> green
//   completed          -> grey
//   cancelled          -> red
const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; labelKey: string }> = {
  pending:   { color: '#B45309', bg: '#FEF3C7', icon: Clock,       labelKey: 'reception.statusPending' },
  confirmed: { color: '#15803D', bg: '#DCFCE7', icon: CircleCheck, labelKey: 'reception.statusConfirmed' },
  scheduled: { color: '#15803D', bg: '#DCFCE7', icon: CircleCheck, labelKey: 'reception.statusScheduled' },
  completed: { color: '#475569', bg: '#F1F5F9', icon: CheckCircle2, labelKey: 'reception.statusCompleted' },
  cancelled: { color: '#DC2626', bg: '#FEE2E2', icon: XCircle,     labelKey: 'reception.statusCancelled' },
};

export default function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const cfg = STATUS_CONFIG[status?.toLowerCase()] ?? {
    color: '#475569', bg: '#F1F5F9', icon: Calendar, labelKey: 'reception.statusUnknown',
  };
  const Icon = cfg.icon;

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Icon size={12} color={cfg.color} strokeWidth={2.5} />
      <Text style={[styles.text, { color: cfg.color }]} numberOfLines={1}>{t(cfg.labelKey)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '700' },
});
