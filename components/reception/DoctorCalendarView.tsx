import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronLeft, ChevronRight, Plus, Pencil } from 'lucide-react-native';
import { toDateKey, formatTime12, type ReceptionAppointment } from '@/utils/receptionApi';

// =============================================================================
// DoctorCalendarView
// -----------------------------------------------------------------------------
// Day / Week / Month calendar for the receptionist's "Doctor Calendar" screen.
// Receives the already-filtered appointment list (for the selected doctors) and
// renders it without any external calendar dependency.
//
// When `onAdd` / `onEditAppt` are provided, each view exposes "+ Add" buttons
// (per hour / per day / per cell) and makes appointment blocks tappable for
// editing. Omitting them keeps the calendar read-only (e.g. Patient Calendar).
// =============================================================================

type CalView = 'day' | 'week' | 'month';

// Fixed light status palette — mirrors StatusBadge so a block's colour matches
// its pill elsewhere in the reception flow (intentionally theme-independent).
const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  pending:   { bg: '#FEF3C7', border: '#FCD34D', text: '#B45309' },
  confirmed: { bg: '#DCFCE7', border: '#86EFAC', text: '#15803D' },
  scheduled: { bg: '#DCFCE7', border: '#86EFAC', text: '#15803D' },
  completed: { bg: '#F1F5F9', border: '#CBD5E1', text: '#475569' },
  cancelled: { bg: '#FEE2E2', border: '#FCA5A5', text: '#DC2626' },
};
function statusColor(status: string) {
  return STATUS_COLORS[status?.toLowerCase()] ?? { bg: '#E0F2F1', border: '#5EEAD4', text: '#0F766E' };
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
function startOfWeek(d: Date) {
  // Week starts on Sunday to match the web calendar.
  return addDays(startOfDay(d), -d.getDay());
}
function monthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function hourOf(time: string) {
  return parseInt((time || '0').split(':')[0], 10) || 0;
}

export default function DoctorCalendarView({
  appointments,
  onAdd,
  onEditAppt,
  showDoctor = false,
}: {
  appointments: ReceptionAppointment[];
  onAdd?: (date: Date, time?: string) => void;
  onEditAppt?: (appt: ReceptionAppointment) => void;
  // Force the doctor name onto every block (incl. compact week/month blocks).
  // Used by the Patient Calendar, where the patient is fixed and the doctor is
  // the distinguishing detail.
  showDoctor?: boolean;
}) {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [view, setView] = useState<CalView>('day');
  const [cursor, setCursor] = useState<Date>(startOfDay(new Date()));
  const today = startOfDay(new Date());

  // Index every appointment by its date key for O(1) per-day lookups.
  const byDate = useMemo(() => {
    const map = new Map<string, ReceptionAppointment[]>();
    for (const a of appointments) {
      if (!a.date) continue;
      const list = map.get(a.date) || [];
      list.push(a);
      map.set(a.date, list);
    }
    for (const list of map.values()) {
      list.sort((x, y) => (x.time || '').localeCompare(y.time || ''));
    }
    return map;
  }, [appointments]);

  const apptsOn = (d: Date) => byDate.get(toDateKey(d)) || [];

  const step = (dir: -1 | 1) => {
    if (view === 'day') setCursor((c) => addDays(c, dir));
    else if (view === 'week') setCursor((c) => addDays(c, dir * 7));
    else setCursor((c) => new Date(c.getFullYear(), c.getMonth() + dir, 1));
  };

  // Header label reflects the active view's range.
  const headerLabel = useMemo(() => {
    if (view === 'day') {
      return cursor.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (view === 'week') {
      const ws = startOfWeek(cursor);
      const we = addDays(ws, 6);
      const left = ws.toLocaleDateString(lang, { day: 'numeric', month: 'short' });
      const right = we.toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' });
      return `${left} – ${right}`;
    }
    return cursor.toLocaleDateString(lang, { month: 'long', year: 'numeric' });
  }, [view, cursor, lang]);

  return (
    <View>
      {/* View switch */}
      <View style={styles.controls}>
        <View style={styles.segment}>
          {(['day', 'week', 'month'] as CalView[]).map((v) => {
            const active = view === v;
            return (
              <TouchableOpacity
                key={v}
                style={[styles.segBtn, active && { backgroundColor: colors.primary }]}
                onPress={() => setView(v)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segText, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
                  {t(`reception.calView_${v}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity
          style={[styles.todayBtn, { borderColor: colors.border }]}
          onPress={() => setCursor(today)}
          activeOpacity={0.8}
        >
          <Text style={[styles.todayText, { color: colors.primary }]}>{t('reception.calToday')}</Text>
        </TouchableOpacity>
      </View>

      {/* Date navigator */}
      <View style={styles.navRow}>
        <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.backgroundSecondary }]} onPress={() => step(-1)} activeOpacity={0.7}>
          <ChevronLeft size={20} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[styles.navLabel, { color: colors.text }]} numberOfLines={1}>{headerLabel}</Text>
        <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.backgroundSecondary }]} onPress={() => step(1)} activeOpacity={0.7}>
          <ChevronRight size={20} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {view === 'day' && (
        <DayView date={cursor} appts={apptsOn(cursor)} colors={colors} styles={styles} t={t} onAdd={onAdd} onEditAppt={onEditAppt} showDoctor={showDoctor} />
      )}
      {view === 'week' && (
        <WeekView cursor={cursor} apptsOn={apptsOn} today={today} colors={colors} styles={styles} t={t} lang={lang} onAdd={onAdd} onEditAppt={onEditAppt} showDoctor={showDoctor} />
      )}
      {view === 'month' && (
        <MonthView cursor={cursor} apptsOn={apptsOn} today={today} colors={colors} styles={styles} t={t} lang={lang} onAdd={onAdd} onEditAppt={onEditAppt} showDoctor={showDoctor} />
      )}
    </View>
  );
}

// ---- Day view ---------------------------------------------------------------
// Full 24-hour timeline (12 AM–11 PM) so any appointment time is visible and a
// doctor with no fixed schedule still shows the whole day.
const DAY_HOURS = Array.from({ length: 24 }, (_, i) => i);
function DayView({ date, appts, colors, styles, t, onAdd, onEditAppt, showDoctor }: any) {
  return (
    <View style={[styles.dayWrap, { backgroundColor: colors.card }]}>
      {DAY_HOURS.map((h: number) => {
        const inHour = (appts as ReceptionAppointment[]).filter((a) => hourOf(a.time) === h);
        const hh = String(h).padStart(2, '0');
        const label = formatTime12(`${hh}:00`);
        return (
          <View key={h} style={[styles.hourRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.hourLabel, { color: colors.textTertiary }]}>{label}</Text>
            <View style={styles.hourBody}>
              {inHour.map((a) => (
                <ApptBlock key={String(a.id)} appt={a} colors={colors} styles={styles} t={t} onEditAppt={onEditAppt} showDoctor={showDoctor} />
              ))}
              {onAdd ? (
                <TouchableOpacity
                  style={[styles.hourAdd, { borderColor: colors.border }]}
                  onPress={() => onAdd(date, `${hh}:00`)}
                  activeOpacity={0.7}
                >
                  <Plus size={15} color={colors.primary} strokeWidth={2.5} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ---- Week view --------------------------------------------------------------
// Seven fixed-width day columns inside a horizontal scroller (mobile-friendly).
function WeekView({ cursor, apptsOn, today, colors, styles, t, lang, onAdd, onEditAppt, showDoctor }: any) {
  const days = useMemo(() => {
    const ws = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  }, [cursor]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekScroll}>
      {days.map((d: Date) => {
        const list = apptsOn(d) as ReceptionAppointment[];
        const isToday = sameDay(d, today);
        return (
          <View
            key={toDateKey(d)}
            style={[
              styles.weekCol,
              { backgroundColor: colors.card, borderColor: isToday ? colors.primary : colors.border },
            ]}
          >
            <View style={styles.weekColHead}>
              <Text style={[styles.weekDow, { color: isToday ? colors.primary : colors.textSecondary }]}>
                {d.toLocaleDateString(lang, { weekday: 'short' })}
              </Text>
              <Text style={[styles.weekDayNum, { color: isToday ? colors.primary : colors.text }]}>
                {d.getDate()}
              </Text>
            </View>
            <View style={styles.weekColBody}>
              {list.length === 0 ? (
                <Text style={[styles.weekEmpty, { color: colors.textTertiary }]}>{t('reception.calNoAppointments')}</Text>
              ) : (
                list.map((a) => (
                  <ApptBlock key={String(a.id)} appt={a} colors={colors} styles={styles} t={t} compact onEditAppt={onEditAppt} showDoctor={showDoctor} />
                ))
              )}
            </View>
            {onAdd ? (
              <TouchableOpacity
                style={[styles.weekAdd, { borderTopColor: colors.border }]}
                onPress={() => onAdd(d)}
                activeOpacity={0.7}
              >
                <Plus size={15} color={colors.primary} strokeWidth={2.5} />
                <Text style={[styles.weekAddText, { color: colors.primary }]}>{t('reception.calAdd')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

// ---- Month view -------------------------------------------------------------
function MonthView({ cursor, apptsOn, today, colors, styles, t, lang, onAdd, onEditAppt, showDoctor }: any) {
  const weekdayLabels = useMemo(() => {
    const base = new Date(2023, 0, 1); // a Sunday
    return Array.from({ length: 7 }, (_, i) =>
      addDays(base, i).toLocaleDateString(lang, { weekday: 'narrow' })
    );
  }, [lang]);

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

  return (
    <View style={[styles.monthWrap, { backgroundColor: colors.card }]}>
      <View style={styles.monthWeekRow}>
        {weekdayLabels.map((w, i) => (
          <Text key={i} style={[styles.monthDow, { color: colors.textTertiary }]}>{w}</Text>
        ))}
      </View>
      <View style={styles.monthGrid}>
        {cells.map((date, idx) => {
          if (!date) return <View key={`e${idx}`} style={[styles.monthCell, { borderColor: colors.border }]} />;
          const list = apptsOn(date) as ReceptionAppointment[];
          const isToday = sameDay(date, today);
          return (
            <TouchableOpacity
              key={toDateKey(date)}
              style={[styles.monthCell, { borderColor: colors.border }]}
              activeOpacity={onAdd ? 0.6 : 1}
              disabled={!onAdd}
              onPress={() => onAdd && onAdd(date)}
            >
              <Text
                style={[
                  styles.monthDayNum,
                  { color: colors.text },
                  isToday && { color: '#FFFFFF', backgroundColor: colors.primary },
                ]}
              >
                {date.getDate()}
              </Text>
              {list.slice(0, 2).map((a) => {
                const c = statusColor(a.status);
                return (
                  <TouchableOpacity
                    key={String(a.id)}
                    style={[styles.monthChip, { backgroundColor: c.bg }]}
                    activeOpacity={onEditAppt ? 0.6 : 1}
                    disabled={!onEditAppt}
                    onPress={() => onEditAppt && onEditAppt(a)}
                  >
                    <Text style={[styles.monthChipText, { color: c.text }]} numberOfLines={1}>
                      {formatTime12(a.time)}{' '}
                      {showDoctor
                        ? (a.doctorName || t('reception.unknownPatient'))
                        : (a.patientName || t('reception.unknownPatient'))}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {list.length > 2 ? (
                <Text style={[styles.monthMore, { color: colors.textSecondary }]}>+{list.length - 2}</Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ---- Shared pieces ----------------------------------------------------------
function ApptBlock({ appt, colors, styles, t, compact, onEditAppt, showDoctor }: any) {
  const c = statusColor(appt.status);
  return (
    <TouchableOpacity
      style={[styles.block, { backgroundColor: c.bg, borderLeftColor: c.border }]}
      activeOpacity={onEditAppt ? 0.7 : 1}
      disabled={!onEditAppt}
      onPress={() => onEditAppt && onEditAppt(appt)}
    >
      <View style={styles.blockTextWrap}>
        <Text style={[styles.blockName, { color: c.text }]} numberOfLines={1}>
          {appt.patientName || t('reception.unknownPatient')}
        </Text>
        <Text style={[styles.blockTime, { color: c.text }]} numberOfLines={1}>
          {formatTime12(appt.time)}
          {appt.endTime ? ` – ${formatTime12(appt.endTime)}` : ''}
        </Text>
        {(!compact || showDoctor) && appt.doctorName ? (
          <Text style={[styles.blockDoctor, { color: colors.textSecondary }]} numberOfLines={1}>
            {/* doctorName already arrives prefixed with "Dr." from the backend. */}
            {appt.doctorName}
          </Text>
        ) : null}
      </View>
      {onEditAppt ? <Pencil size={13} color={c.text} strokeWidth={2} /> : null}
    </TouchableOpacity>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10 },
    segment: { flexDirection: 'row', backgroundColor: colors.backgroundSecondary, borderRadius: 12, padding: 3, flex: 1 },
    segBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
    segText: { fontSize: 13.5, fontWeight: '700' },
    todayBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1 },
    todayText: { fontSize: 13.5, fontWeight: '700' },

    navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 },
    navBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    navLabel: { flex: 1, textAlign: 'center', fontSize: 15.5, fontWeight: '800' },

    // Day
    dayWrap: {
      borderRadius: 18,
      overflow: 'hidden',
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 2,
    },
    hourRow: { flexDirection: 'row', borderTopWidth: 1, minHeight: 56, paddingVertical: 6, paddingHorizontal: 12 },
    hourLabel: { width: 66, fontSize: 12.5, fontWeight: '700', paddingTop: 4 },
    hourBody: { flex: 1, gap: 6 },
    hourAdd: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderRadius: 10,
      paddingVertical: 7,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayEmpty: { borderRadius: 18, padding: 40, alignItems: 'center' },
    dayEmptyText: { fontSize: 14.5, fontWeight: '600' },

    // Appointment block
    block: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderLeftWidth: 4, paddingVertical: 8, paddingHorizontal: 10 },
    blockTextWrap: { flex: 1, gap: 2 },
    blockName: { fontSize: 13.5, fontWeight: '800' },
    blockTime: { fontSize: 12, fontWeight: '600' },
    blockDoctor: { fontSize: 11.5, fontWeight: '500' },

    // Week
    weekScroll: { gap: 10, paddingBottom: 4 },
    weekCol: { width: 150, borderRadius: 16, borderWidth: 1.5, overflow: 'hidden', minHeight: 220 },
    weekColHead: { alignItems: 'center', paddingVertical: 10, gap: 2 },
    weekDow: { fontSize: 12.5, fontWeight: '700', textTransform: 'uppercase' },
    weekDayNum: { fontSize: 20, fontWeight: '800' },
    weekColBody: { paddingHorizontal: 8, paddingBottom: 10, gap: 6, flex: 1 },
    weekEmpty: { fontSize: 12, textAlign: 'center', paddingVertical: 16 },
    weekAdd: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 10,
      borderTopWidth: 1,
    },
    weekAddText: { fontSize: 12.5, fontWeight: '700' },

    // Month
    monthWrap: {
      borderRadius: 18,
      padding: 8,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 2,
    },
    monthWeekRow: { flexDirection: 'row', marginBottom: 4 },
    monthDow: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700' },
    monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    monthCell: { width: `${100 / 7}%`, minHeight: 76, borderWidth: 0.5, padding: 3, gap: 2 },
    monthDayNum: {
      fontSize: 12,
      fontWeight: '700',
      width: 22,
      height: 22,
      borderRadius: 11,
      textAlign: 'center',
      lineHeight: 22,
      overflow: 'hidden',
      alignSelf: 'flex-start',
    },
    monthChip: { borderRadius: 5, paddingHorizontal: 4, paddingVertical: 2 },
    monthChipText: { fontSize: 9, fontWeight: '700' },
    monthMore: { fontSize: 9.5, fontWeight: '700', paddingLeft: 2 },
  });
