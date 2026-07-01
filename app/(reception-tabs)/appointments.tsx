import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import {
  Calendar,
  Clock,
  Building2,
  User,
  CalendarDays,
  RefreshCw,
  ChevronDown,
  Check,
  X,
  SlidersHorizontal,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  listMyAppointments,
  setStatus as setApptStatus,
  SETTABLE_STATUSES,
  type SettableStatus,
  formatTime12,
  type ReceptionAppointment,
} from '@/utils/receptionApi';
import StatusBadge from '@/components/reception/StatusBadge';
import DateRangePicker from '@/components/reception/DateRangePicker';

type TabId = 'upcoming' | 'past';

function startOfToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateFull(dateStr: string, lang?: string) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(lang || undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ReceptionAppointmentsScreen() {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const { session } = useAuth();

  const userId = session?.user?.realUserId || session?.user?.global_id || '';
  const companyId = session?.user?.company_id || null;

  const [appointments, setAppointments] = useState<ReceptionAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<TabId>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | number | null>(null);

  // Filters (null = all). `openFilter` controls which option modal is visible.
  // The date filter is a From–To range, defaulting to "today onward" so the
  // feed opens on the current day's appointments rather than the full history.
  const [filterDoctor, setFilterDoctor] = useState<string | null>(null);
  const [filterClinic, setFilterClinic] = useState<string | null>(null);
  const [filterFrom, setFilterFrom] = useState<string | null>(startOfToday());
  const [filterTo, setFilterTo] = useState<string | null>(null);
  const [openFilter, setOpenFilter] = useState<'doctor' | 'clinic' | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const data = await listMyAppointments(userId, companyId);
      setAppointments(data);
    } catch (e) {
      console.error('Failed to load reception appointments:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, companyId]);

  // Refresh on focus so a freshly-booked appointment shows up immediately.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const todayKey = startOfToday();

  // Distinct filter options derived from the full data set (stable regardless of
  // the active tab so a filter never hides its own option).
  const { doctorOptions, clinicOptions } = useMemo(() => {
    const docs = new Set<string>();
    const clinics = new Set<string>();
    for (const a of appointments) {
      if (a.doctorName) docs.add(a.doctorName);
      if (a.clinicName) clinics.add(a.clinicName);
    }
    return {
      doctorOptions: Array.from(docs).sort(),
      clinicOptions: Array.from(clinics).sort(),
    };
  }, [appointments]);

  const activeFilterCount = [filterDoctor, filterClinic, filterFrom || filterTo].filter(Boolean).length;

  const { upcoming, past } = useMemo(() => {
    const up: ReceptionAppointment[] = [];
    const pa: ReceptionAppointment[] = [];
    for (const a of appointments) {
      // Apply doctor / clinic / date-range filters first.
      if (filterDoctor && a.doctorName !== filterDoctor) continue;
      if (filterClinic && a.clinicName !== filterClinic) continue;
      if (filterFrom && a.date < filterFrom) continue;
      if (filterTo && a.date > filterTo) continue;

      const isCancelled = a.status === 'cancelled';
      const isPast = a.date < todayKey || a.status === 'completed' || isCancelled;
      // Cancelled/completed always live in Past; otherwise split by date.
      if (a.date >= todayKey && !isPast) up.push(a);
      else pa.push(a);
    }
    // Upcoming ascending (soonest first); past descending (most recent first).
    up.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    pa.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    return { upcoming: up, past: pa };
  }, [appointments, todayKey, filterDoctor, filterClinic, filterFrom, filterTo]);

  const shown = tab === 'upcoming' ? upcoming : past;

  const clearFilters = () => {
    setFilterDoctor(null);
    setFilterClinic(null);
    setFilterFrom(null);
    setFilterTo(null);
  };

  // Compact label for the date-range filter chip.
  const dateChipLabel = useMemo(() => {
    if (!filterFrom && !filterTo) return t('reception.filterDate');
    const fmt = (s: string) => new Date(`${s}T00:00:00`).toLocaleDateString(i18n.language || undefined, { day: '2-digit', month: 'short' });
    const start = filterFrom ? fmt(filterFrom) : '…';
    const end = filterTo ? fmt(filterTo) : t('reception.rangeOpenEnd');
    return `${start} – ${end}`;
  }, [filterFrom, filterTo, i18n.language, t]);

  // Resolve the option list + current value + setter for the open filter modal
  // (doctor / clinic only — the date filter uses the range picker below).
  const filterModal = useMemo(() => {
    if (openFilter === 'doctor')
      return { title: t('reception.filterDoctor'), options: doctorOptions, value: filterDoctor, set: setFilterDoctor };
    if (openFilter === 'clinic')
      return { title: t('reception.filterClinic'), options: clinicOptions, value: filterClinic, set: setFilterClinic };
    return null;
  }, [openFilter, doctorOptions, clinicOptions, filterDoctor, filterClinic, t]);

  // Status-change dialog state (null = closed). Reuses an in-app modal so it
  // looks and behaves identically on every platform, including web.
  const [statusAppt, setStatusAppt] = useState<ReceptionAppointment | null>(null);
  const [statusError, setStatusError] = useState('');

  const applyStatus = useCallback(async (appt: ReceptionAppointment, status: SettableStatus) => {
    setStatusAppt(null);
    setCancellingId(appt.id);
    try {
      await setApptStatus(userId, appt.id, status);
      // Optimistically reflect the new status.
      setAppointments((prev) =>
        prev.map((a) => (a.id === appt.id ? { ...a, status } : a))
      );
    } catch (e: any) {
      setStatusError(e?.message || t('reception.errorGeneric'));
    } finally {
      setCancellingId(null);
    }
  }, [userId, t]);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('reception.appointmentsTitle')}</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {(['upcoming', 'past'] as TabId[]).map((id) => {
          const active = tab === id;
          const count = id === 'upcoming' ? upcoming.length : past.length;
          return (
            <TouchableOpacity
              key={id}
              style={[styles.tab, active && { borderBottomColor: colors.primary }]}
              onPress={() => setTab(id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, { color: active ? colors.primary : colors.textSecondary }]}>
                {t(id === 'upcoming' ? 'reception.tabUpcoming' : 'reception.tabPast')} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Filter bar */}
      <View style={[styles.filterBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <SlidersHorizontal size={16} color={colors.textSecondary} strokeWidth={2} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
          <FilterChip
            label={filterDoctor || t('reception.filterDoctor')}
            active={!!filterDoctor}
            onPress={() => setOpenFilter('doctor')}
            colors={colors}
          />
          <FilterChip
            label={filterClinic || t('reception.filterClinic')}
            active={!!filterClinic}
            onPress={() => setOpenFilter('clinic')}
            colors={colors}
          />
          <FilterChip
            label={dateChipLabel}
            active={!!(filterFrom || filterTo)}
            onPress={() => setDatePickerOpen(true)}
            colors={colors}
          />
          {activeFilterCount > 0 ? (
            <TouchableOpacity style={styles.clearChip} onPress={clearFilters} activeOpacity={0.7}>
              <X size={14} color="#DC2626" strokeWidth={2.5} />
              <Text style={styles.clearChipText}>{t('reception.clearFilters')}</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={shown.length === 0 ? styles.emptyContent : styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {shown.length === 0 ? (
            <View style={styles.center}>
              <CalendarDays size={56} color={colors.textTertiary} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('reception.noAppointmentsTitle')}</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {tab === 'upcoming' ? t('reception.noUpcoming') : t('reception.noPast')}
              </Text>
            </View>
          ) : (
            shown.map((appt) => (
              <View key={String(appt.id)} style={[styles.apptCard, { backgroundColor: colors.card }]}>
                <View style={styles.apptTop}>
                  <View style={styles.apptDateWrap}>
                    <Calendar size={14} color={colors.textSecondary} strokeWidth={2} />
                    <Text style={[styles.apptDate, { color: colors.text }]}>
                      {formatDateFull(appt.date, i18n.language)}
                    </Text>
                  </View>
                  <StatusBadge status={appt.status} />
                </View>

                <View style={styles.apptRows}>
                  <Row icon={User} value={appt.patientName} sub={appt.medicalId} colors={colors} />
                  <Row icon={User} value={appt.doctorName} colors={colors} />
                  <Row icon={Building2} value={appt.clinicName} sub={appt.clinicAddress} colors={colors} />
                  <Row
                    icon={Clock}
                    value={appt.time ? `${formatTime12(appt.time)}${appt.endTime ? ` – ${formatTime12(appt.endTime)}` : ''}` : ''}
                    colors={colors}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.statusBtn, { borderColor: colors.border }]}
                  onPress={() => setStatusAppt(appt)}
                  disabled={cancellingId === appt.id}
                  activeOpacity={0.7}
                >
                  {cancellingId === appt.id ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <RefreshCw size={16} color={colors.primary} strokeWidth={2} />
                      <Text style={[styles.statusBtnText, { color: colors.primary }]}>{t('reception.changeStatus')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Filter option selector */}
      <Modal visible={!!filterModal} transparent animationType="fade" onRequestClose={() => setOpenFilter(null)}>
        <TouchableOpacity style={styles.modalScrim} activeOpacity={1} onPress={() => setOpenFilter(null)}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHead, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{filterModal?.title}</Text>
              <TouchableOpacity onPress={() => setOpenFilter(null)} hitSlop={10}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {/* "All" row clears this filter. */}
              <ModalOption
                label={t('reception.filterAll')}
                selected={!filterModal?.value}
                onPress={() => { filterModal?.set(null); setOpenFilter(null); }}
                colors={colors}
              />
              {(filterModal?.options || []).map((opt) => (
                <ModalOption
                  key={opt}
                  label={opt}
                  selected={filterModal?.value === opt}
                  onPress={() => { filterModal?.set(opt); setOpenFilter(null); }}
                  colors={colors}
                />
              ))}
              {(filterModal?.options.length || 0) === 0 ? (
                <Text style={[styles.modalEmpty, { color: colors.textSecondary }]}>{t('reception.filterNone')}</Text>
              ) : null}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Date range filter */}
      <DateRangePicker
        visible={datePickerOpen}
        from={filterFrom}
        to={filterTo}
        onApply={(f, tt) => { setFilterFrom(f); setFilterTo(tt); }}
        onClose={() => setDatePickerOpen(false)}
      />

      {/* Change-status selector — lists the statuses reception may set. */}
      <Modal
        visible={!!statusAppt}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusAppt(null)}
      >
        <TouchableOpacity style={styles.modalScrim} activeOpacity={1} onPress={() => setStatusAppt(null)}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHead, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('reception.statusChangeTitle')}</Text>
              <TouchableOpacity onPress={() => setStatusAppt(null)} hitSlop={10}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.statusModalMsg, { color: colors.textSecondary }]}>{t('reception.statusChangeMessage')}</Text>
            <View style={styles.statusOptions}>
              {SETTABLE_STATUSES.map((s) => {
                const current = statusAppt?.status === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusOption, { borderColor: colors.border }, current && { backgroundColor: colors.backgroundSecondary }]}
                    disabled={current}
                    onPress={() => statusAppt && applyStatus(statusAppt, s)}
                    activeOpacity={0.7}
                  >
                    <StatusBadge status={s} />
                    {current ? <Check size={18} color={colors.primary} strokeWidth={2.5} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Status-change error — mobile-style dialog. */}
      <Modal
        visible={!!statusError}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusError('')}
      >
        <View style={styles.modalScrim}>
          <View style={[styles.modalCard, styles.confirmCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.confirmTitle, { color: colors.text }]}>{t('reception.errorGeneric')}</Text>
            <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>{statusError}</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                onPress={() => setStatusError('')}
                activeOpacity={0.7}
              >
                <Text style={[styles.confirmBtnText, { color: '#FFFFFF' }]}>{t('reception.ok')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FilterChip({ label, active, onPress, colors }: { label: string; active: boolean; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        chipStyles.chip,
        { backgroundColor: active ? colors.primary : colors.backgroundSecondary, borderColor: active ? colors.primary : colors.border },
      ]}
    >
      <Text style={[chipStyles.label, { color: active ? '#FFFFFF' : colors.textSecondary }]} numberOfLines={1}>{label}</Text>
      <ChevronDown size={14} color={active ? '#FFFFFF' : colors.textSecondary} strokeWidth={2.5} />
    </TouchableOpacity>
  );
}

function ModalOption({ label, selected, onPress, colors }: { label: string; selected: boolean; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity style={modalOptStyles.row} onPress={onPress} activeOpacity={0.7}>
      <Text style={[modalOptStyles.label, { color: colors.text }]} numberOfLines={1}>{label}</Text>
      {selected ? <Check size={18} color={colors.primary} strokeWidth={2.5} /> : null}
    </TouchableOpacity>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 200,
  },
  label: { fontSize: 13, fontWeight: '700', flexShrink: 1 },
});

const modalOptStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, gap: 12 },
  label: { fontSize: 15, fontWeight: '600', flex: 1 },
});

function Row({ icon: Icon, value, sub, colors }: { icon: any; value: string; sub?: string; colors: any }) {
  if (!value) return null;
  return (
    <View style={rowStyles.row}>
      <Icon size={15} color={colors.textSecondary} strokeWidth={2} />
      <View style={rowStyles.text}>
        <Text style={[rowStyles.value, { color: colors.text }]} numberOfLines={1}>{value}</Text>
        {sub ? <Text style={[rowStyles.sub, { color: colors.textTertiary }]} numberOfLines={1}>{sub}</Text> : null}
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { flex: 1 },
  value: { fontSize: 14.5, fontWeight: '600' },
  sub: { fontSize: 12 },
});

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1 },
    headerTitle: { fontSize: 20, fontWeight: '800' },

    tabsRow: { flexDirection: 'row', borderBottomWidth: 1 },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabText: { fontSize: 14.5, fontWeight: '700' },

    filterBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
    filterChips: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
    clearChip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
      borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: '#FEE2E2',
    },
    clearChipText: { fontSize: 13, fontWeight: '700', color: '#DC2626' },

    modalScrim: { flex: 1, backgroundColor: 'rgba(2,6,23,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    modalCard: { width: '100%', maxWidth: 420, borderRadius: 22, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 16, maxHeight: '70%' },
    modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1 },
    modalTitle: { fontSize: 17, fontWeight: '800' },
    modalList: { paddingTop: 4 },
    modalEmpty: { fontSize: 14, textAlign: 'center', paddingVertical: 20 },
    confirmCard: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 18 },
    confirmTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
    confirmMessage: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
    confirmActions: { flexDirection: 'row', gap: 10 },
    confirmBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    confirmBtnText: { fontSize: 15, fontWeight: '700' },

    scroll: { flex: 1 },
    listContent: { padding: 16, gap: 12 },
    emptyContent: { flexGrow: 1, justifyContent: 'center' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
    emptyTitle: { fontSize: 19, fontWeight: '700', marginTop: 6 },
    emptyText: { fontSize: 14, textAlign: 'center' },

    apptCard: {
      borderRadius: 18,
      padding: 16,
      gap: 14,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 2,
    },
    apptTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    apptDateWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    apptDate: { fontSize: 14.5, fontWeight: '700' },
    apptRows: { gap: 10 },

    statusBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 11,
      borderRadius: 12,
      borderWidth: 1.5,
    },
    statusBtnText: { fontSize: 14, fontWeight: '700' },

    statusModalMsg: { fontSize: 14, lineHeight: 20, paddingTop: 14 },
    statusOptions: { paddingTop: 10, paddingBottom: 4, gap: 10 },
    statusOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1,
    },
  });
