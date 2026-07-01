import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { toDateKey } from '@/utils/receptionApi';

// Modal "From – To" date range picker (no external dependency). Unlike the
// booking calendar, past dates are selectable and there is no 30-day window —
// reception filters their appointment feed across any range.

function monthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function fromKey(key: string | null): Date | null {
  return key ? new Date(`${key}T00:00:00`) : null;
}

export default function DateRangePicker({
  visible,
  from,
  to,
  onApply,
  onClose,
}: {
  visible: boolean;
  from: string | null;
  to: string | null;
  onApply: (from: string | null, to: string | null) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();

  // Pending selection while the modal is open; committed only on "Apply".
  const [pendingFrom, setPendingFrom] = useState<string | null>(from);
  const [pendingTo, setPendingTo] = useState<string | null>(to);
  const [cursor, setCursor] = useState<Date>(monthStart(fromKey(from) || new Date()));

  // Re-sync pending state whenever the modal (re)opens.
  useEffect(() => {
    if (visible) {
      setPendingFrom(from);
      setPendingTo(to);
      setCursor(monthStart(fromKey(from) || new Date()));
    }
  }, [visible, from, to]);

  const weekdayLabels = useMemo(() => {
    const base = new Date(2023, 0, 1); // a Sunday
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d.toLocaleDateString(i18n.language || 'en', { weekday: 'short' });
    });
  }, [i18n.language]);

  const cells = useMemo(() => {
    const first = monthStart(cursor);
    const leading = first.getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < leading; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [cursor]);

  const onDayPress = (date: Date) => {
    const key = toDateKey(date);
    // Start a fresh range when nothing is selected, both ends are set, or the
    // new date falls before the current start.
    if (!pendingFrom || (pendingFrom && pendingTo) || key < pendingFrom) {
      setPendingFrom(key);
      setPendingTo(null);
    } else {
      setPendingTo(key);
    }
  };

  const inRange = (key: string) => {
    if (!pendingFrom) return false;
    const end = pendingTo || pendingFrom;
    return key >= pendingFrom && key <= end;
  };
  const isEndpoint = (key: string) => key === pendingFrom || key === pendingTo;

  const goPrev = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const goNext = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));

  const setToday = () => {
    const key = toDateKey(new Date());
    setPendingFrom(key);
    setPendingTo(null);
    setCursor(monthStart(new Date()));
  };

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.head, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t('reception.dateRangeTitle')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Selected range summary */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryBox}>
              <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>{t('reception.filterFrom')}</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {pendingFrom ? new Date(`${pendingFrom}T00:00:00`).toLocaleDateString(i18n.language || undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
              </Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>{t('reception.filterTo')}</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {pendingTo ? new Date(`${pendingTo}T00:00:00`).toLocaleDateString(i18n.language || undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : (pendingFrom ? t('reception.rangeOpenEnd') : '—')}
              </Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Month header */}
            <View style={styles.monthHeader}>
              <TouchableOpacity onPress={goPrev} style={[styles.navBtn, { backgroundColor: colors.backgroundSecondary }]} activeOpacity={0.7}>
                <ChevronLeft size={22} color={colors.primary} strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={[styles.monthTitle, { color: colors.text }]}>
                {cursor.toLocaleDateString(i18n.language || 'en', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={goNext} style={[styles.navBtn, { backgroundColor: colors.backgroundSecondary }]} activeOpacity={0.7}>
                <ChevronRight size={22} color={colors.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Weekday row */}
            <View style={styles.weekRow}>
              {weekdayLabels.map((w, i) => (
                <Text key={i} style={[styles.weekday, { color: colors.textTertiary }]}>{w}</Text>
              ))}
            </View>

            {/* Day grid */}
            <View style={styles.grid}>
              {cells.map((date, idx) => {
                if (!date) return <View key={`e${idx}`} style={styles.cell} />;
                const key = toDateKey(date);
                const endpoint = isEndpoint(key);
                const within = inRange(key);
                return (
                  <View key={key} style={styles.cell}>
                    {within && !endpoint ? (
                      <View style={[styles.rangeFill, { backgroundColor: colors.primary + '22' }]} />
                    ) : null}
                    <TouchableOpacity
                      onPress={() => onDayPress(date)}
                      activeOpacity={0.8}
                      style={[styles.day, endpoint && { backgroundColor: colors.primary }]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          { color: colors.text },
                          within && !endpoint && { color: colors.primary, fontWeight: '700' },
                          endpoint && { color: '#FFFFFF', fontWeight: '800' },
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={[styles.todayBtn, { borderColor: colors.border }]} onPress={setToday} activeOpacity={0.7}>
              <Text style={[styles.todayText, { color: colors.primary }]}>{t('reception.rangeToday')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.clearBtn, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => { onApply(null, null); onClose(); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.clearText, { color: colors.text }]}>{t('reception.clearFilters')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: colors.primary }]}
              onPress={() => { onApply(pendingFrom, pendingTo); onClose(); }}
              activeOpacity={0.7}
            >
              <Text style={styles.applyText}>{t('reception.rangeApply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    scrim: { flex: 1, backgroundColor: 'rgba(2,6,23,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    card: { width: '100%', maxWidth: 420, borderRadius: 22, paddingHorizontal: 18, paddingBottom: 16, maxHeight: '85%' },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1 },
    title: { fontSize: 17, fontWeight: '800' },

    summaryRow: { flexDirection: 'row', gap: 10, paddingVertical: 14 },
    summaryBox: { flex: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'transparent' },
    summaryLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
    summaryValue: { fontSize: 14.5, fontWeight: '700', marginTop: 2 },

    monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    navBtn: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    monthTitle: { fontSize: 17, fontWeight: '800' },
    weekRow: { flexDirection: 'row', marginBottom: 6 },
    weekday: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: { width: `${100 / 7}%`, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', padding: 2 },
    rangeFill: { ...StyleSheet.absoluteFillObject, marginVertical: 2 },
    day: { width: '100%', height: '100%', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    dayText: { fontSize: 15, fontWeight: '600' },

    footer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 14 },
    todayBtn: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
    todayText: { fontSize: 14, fontWeight: '700' },
    clearBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
    clearText: { fontSize: 14, fontWeight: '700' },
    applyBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
    applyText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  });
