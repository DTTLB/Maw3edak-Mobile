import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { toDateKey } from '@/utils/receptionApi';

// Lightweight monthly calendar (no external dependency). Past dates and dates
// outside [minDate, maxDate] are disabled. Month navigation is clamped to the
// months containing minDate and maxDate.
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function monthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function BookingCalendar({
  selectedDate,
  onSelect,
  minDate,
  maxDate,
  hint,
}: {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  minDate: Date;
  maxDate: Date;
  // Footer hint. Defaults to the booking-window text; pass "" to hide it (e.g.
  // when the calendar is reused as a generic date-range picker).
  hint?: string;
}) {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const min = startOfDay(minDate);
  const max = startOfDay(maxDate);
  // Open on the selected month, else the current month (clamped into range) —
  // not on minDate, which could be years in the past for a range filter.
  const initialCursor = useMemo(() => {
    if (selectedDate) return monthStart(selectedDate);
    const today = startOfDay(new Date());
    const clamped = today < min ? min : today > max ? max : today;
    return monthStart(clamped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [cursor, setCursor] = useState<Date>(initialCursor);
  const hintText = hint === undefined ? t('reception.bookingWindowHint') : hint;

  const weekdayLabels = useMemo(() => {
    // Sun..Sat short names, localized to the active language.
    const base = new Date(2023, 0, 1); // Jan 1 2023 is a Sunday
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d.toLocaleDateString(i18n.language || 'en', { weekday: 'short' });
    });
  }, [i18n.language]);

  const cells = useMemo(() => {
    const first = monthStart(cursor);
    const leading = first.getDay(); // 0=Sun
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < leading; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [cursor]);

  const canPrev = monthStart(cursor) > monthStart(min);
  const canNext = monthStart(cursor) < monthStart(max);

  const goPrev = () => {
    if (canPrev) setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  };
  const goNext = () => {
    if (canNext) setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.card }]}>
      {/* Month header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goPrev}
          disabled={!canPrev}
          style={[styles.navBtn, { backgroundColor: colors.backgroundSecondary }, !canPrev && styles.navDisabled]}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={canPrev ? colors.primary : colors.textTertiary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, { color: colors.text }]}>
          {cursor.toLocaleDateString(i18n.language || 'en', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity
          onPress={goNext}
          disabled={!canNext}
          style={[styles.navBtn, { backgroundColor: colors.backgroundSecondary }, !canNext && styles.navDisabled]}
          activeOpacity={0.7}
        >
          <ChevronRight size={22} color={canNext ? colors.primary : colors.textTertiary} strokeWidth={2.5} />
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
          const disabled = date < min || date > max;
          const isSelected = selectedDate ? sameDay(date, selectedDate) : false;
          return (
            <View key={toDateKey(date)} style={styles.cell}>
              <TouchableOpacity
                disabled={disabled}
                onPress={() => onSelect(date)}
                activeOpacity={0.8}
                style={[
                  styles.day,
                  isSelected && { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: colors.text },
                    isSelected && { color: '#FFFFFF', fontWeight: '800' },
                    disabled && { color: colors.textTertiary },
                  ]}
                >
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {hintText ? <Text style={[styles.hint, { color: colors.textTertiary }]}>{hintText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  navBtn: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  navDisabled: { opacity: 0.4 },
  monthTitle: { fontSize: 18, fontWeight: '800' },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', padding: 2 },
  day: { width: '100%', height: '100%', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  dayText: { fontSize: 15, fontWeight: '600' },
  hint: { fontSize: 12, textAlign: 'center', marginTop: 10 },
});
