import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { X, User, Building2, Trash2, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import {
  getSlots,
  reschedule,
  cancel,
  toDateKey,
  formatTime12,
  normalizeTime,
  type ReceptionAppointment,
  type ReceptionSlot,
} from '@/utils/receptionApi';
import BookingCalendar from '@/components/reception/BookingCalendar';
import SlotGrid from '@/components/reception/SlotGrid';
import StatusBadge from '@/components/reception/StatusBadge';

const MAX_ADVANCE_DAYS = 60;

// Edit sheet for an existing appointment: reschedule (date + time) or delete
// (cancel). Reuses the booking calendar + slot grid so the UX matches the
// booking wizard. Save / delete hit the business-* endpoints.
export default function AppointmentEditModal({
  visible,
  appointment,
  userId,
  onClose,
  onChanged,
}: {
  visible: boolean;
  appointment: ReceptionAppointment | null;
  userId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const today = useMemo(() => new Date(), []);
  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + MAX_ADVANCE_DAYS);
    return d;
  }, [today]);

  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<ReceptionSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [customTime, setCustomTime] = useState('');
  const [customTimeError, setCustomTimeError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Seed local state from the appointment each time the modal opens.
  useEffect(() => {
    if (visible && appointment) {
      const parsed = new Date(`${appointment.date}T00:00:00`);
      setDate(isNaN(parsed.getTime()) ? new Date() : parsed);
      setTime(appointment.time || null);
      setCustomTime('');
      setCustomTimeError('');
    }
  }, [visible, appointment]);

  const loadSlots = useCallback(async () => {
    if (!appointment || !date) return;
    setLoadingSlots(true);
    try {
      const { slots: result } = await getSlots(appointment.doctorId, appointment.clinicId, toDateKey(date));
      // Grey out past times when the target date is today.
      const isToday = toDateKey(date) === toDateKey(new Date());
      const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
      const adjusted = result.map((s) => {
        if (!isToday) return s;
        const [h, m] = s.time.split(':').map(Number);
        return h * 60 + m <= nowMins ? { ...s, available: false } : s;
      });
      setSlots(adjusted);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [appointment, date]);

  useEffect(() => {
    if (visible) loadSlots();
  }, [visible, loadSlots]);

  const handleAddCustomTime = () => {
    const normalized = normalizeTime(customTime);
    if (!normalized) {
      setCustomTimeError(t('reception.invalidTime'));
      return;
    }
    const clash = slots.find((s) => s.time === normalized && !s.available);
    if (clash) {
      setCustomTimeError(t('reception.timeTaken'));
      return;
    }
    setCustomTimeError('');
    setCustomTime('');
    setTime(normalized);
  };

  const handleSave = async () => {
    if (!appointment || !date || !time) return;
    setSaving(true);
    try {
      await reschedule(userId, appointment.id, toDateKey(date), time);
      onChanged();
      onClose();
    } catch (e: any) {
      Alert.alert(t('reception.errorGeneric'), e?.message || '');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!appointment) return;
    Alert.alert(t('reception.cancelTitle'), t('reception.cancelMessage'), [
      { text: t('reception.cancelNo'), style: 'cancel' },
      {
        text: t('reception.cancelYes'),
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await cancel(userId, appointment.id);
            onChanged();
            onClose();
          } catch (e: any) {
            Alert.alert(t('reception.errorGeneric'), e?.message || '');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const unchanged =
    !!appointment && !!date && toDateKey(date) === appointment.date && time === appointment.time;

  if (!appointment) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <SafeAreaView style={[styles.sheet, { backgroundColor: colors.backgroundSecondary }]} edges={['bottom']}>
          {/* Header */}
          <View style={[styles.head, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.headTitle, { color: colors.text }]}>{t('reception.editTitle')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.headClose}>
              <X size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {/* Summary */}
            <View style={[styles.summary, { backgroundColor: colors.card }]}>
              <View style={styles.summaryTop}>
                <Text style={[styles.summaryName, { color: colors.text }]} numberOfLines={1}>
                  {appointment.patientName || t('reception.unknownPatient')}
                </Text>
                <StatusBadge status={appointment.status} />
              </View>
              <SummaryRow icon={User} value={t('reception.doctorName', { name: appointment.doctorName })} colors={colors} />
              {appointment.clinicName ? (
                <SummaryRow icon={Building2} value={appointment.clinicName} colors={colors} />
              ) : null}
            </View>

            {/* Reschedule: date */}
            <Text style={[styles.section, { color: colors.text }]}>{t('reception.editDateLabel')}</Text>
            <BookingCalendar selectedDate={date} onSelect={(d) => { setDate(d); setTime(null); }} minDate={today} maxDate={maxDate} />

            {/* Reschedule: time */}
            <Text style={[styles.section, { color: colors.text, marginTop: 18 }]}>{t('reception.editTimeLabel')}</Text>
            <SlotGrid slots={slots} selected={time} onSelect={setTime} loading={loadingSlots} />

            {/* Custom time */}
            <View style={[styles.customWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.customHint, { color: colors.textSecondary }]}>{t('reception.customTimeHint')}</Text>
              <View style={styles.customRow}>
                <TextInput
                  style={[styles.customInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
                  placeholder="14:30"
                  placeholderTextColor={colors.textTertiary}
                  value={customTime}
                  onChangeText={setCustomTime}
                  keyboardType="numbers-and-punctuation"
                  autoCorrect={false}
                />
                <TouchableOpacity style={[styles.customAdd, { backgroundColor: colors.primary }]} onPress={handleAddCustomTime} activeOpacity={0.85}>
                  <Text style={styles.customAddText}>{t('reception.addCustomTime')}</Text>
                </TouchableOpacity>
              </View>
              {customTimeError ? <Text style={styles.customError}>{customTimeError}</Text> : null}
              {time ? (
                <Text style={[styles.selectedTime, { color: colors.primary }]}>
                  {t('reception.editSelected', { time: formatTime12(time) })}
                </Text>
              ) : null}
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.deleteBtn, { borderColor: '#FCA5A5' }]}
              onPress={handleDelete}
              disabled={deleting || saving}
              activeOpacity={0.8}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <>
                  <Trash2 size={18} color="#DC2626" strokeWidth={2} />
                  <Text style={styles.deleteText}>{t('reception.editDelete')}</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }, (unchanged || !time || saving) && styles.btnDisabled]}
              onPress={handleSave}
              disabled={unchanged || !time || saving || deleting}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.saveText}>{t('reception.editSave')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function SummaryRow({ icon: Icon, value, colors }: { icon: any; value: string; colors: any }) {
  return (
    <View style={summaryRowStyles.row}>
      <Icon size={15} color={colors.textSecondary} strokeWidth={2} />
      <Text style={[summaryRowStyles.text, { color: colors.textSecondary }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const summaryRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  text: { fontSize: 14, fontWeight: '600', flex: 1 },
});

const makeStyles = (colors: any) =>
  StyleSheet.create({
    scrim: { flex: 1, backgroundColor: 'rgba(2,6,23,0.5)', justifyContent: 'flex-end' },
    sheet: { maxHeight: '92%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },

    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    headTitle: { fontSize: 18, fontWeight: '800' },
    headClose: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },

    body: { flexGrow: 0 },
    bodyContent: { padding: 16, paddingBottom: 24 },

    summary: { borderRadius: 16, padding: 14, marginBottom: 18 },
    summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    summaryName: { fontSize: 16, fontWeight: '800', flex: 1 },

    section: { fontSize: 15, fontWeight: '800', marginBottom: 10 },

    customWrap: { borderRadius: 16, borderWidth: 1, padding: 14, marginTop: 16, gap: 10 },
    customHint: { fontSize: 12.5, lineHeight: 18 },
    customRow: { flexDirection: 'row', gap: 10 },
    customInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, fontWeight: '600' },
    customAdd: { paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
    customAddText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    customError: { fontSize: 12.5, color: '#DC2626', fontWeight: '600' },
    selectedTime: { fontSize: 13.5, fontWeight: '700' },

    footer: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1 },
    deleteBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14, borderWidth: 1.5,
    },
    deleteText: { fontSize: 14.5, fontWeight: '700', color: '#DC2626' },
    saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
    saveText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
    btnDisabled: { opacity: 0.5 },
  });
