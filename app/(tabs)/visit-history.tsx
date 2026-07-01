import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getSession } from '@/utils/auth';
import { config } from '@/utils/config';
import {
  Calendar,
  Clock,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Stethoscope,
  DoorOpen,
  Layers,
  BadgeDollarSign,
  Timer,
  Hash,
  Filter,
  X,
} from 'lucide-react-native';
import BackButton from '@/components/BackButton';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  end_date: string | null;
  end_time: string | null;
  status: string;
  notes: string | null;
  duration: string | null;
  isCustom?: boolean;
  created_at?: string;
  doctors: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  } | null;
  clinics: {
    id: string;
    name: string;
    address: string;
    phone: string;
  } | null;
  services?: {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    duration: number | null;
  } | null;
  rooms?: {
    id: string;
    room_number: string;
    room_type: string | null;
    floor: number | null;
  } | null;
  companies?: {
    id: string;
    name: string;
  } | null;
}

interface DoctorGroup {
  doctorId: string;
  doctorName: string;
  appointments: Appointment[];
  expanded: boolean;
}

type DateFilter = 'all' | 'this_month' | 'last_3_months' | 'last_6_months' | 'this_year';

const DATE_FILTER_OPTIONS: { key: DateFilter; labelKey: string }[] = [
  { key: 'all',           labelKey: 'visitHistory.filterAllTime' },
  { key: 'this_month',    labelKey: 'visitHistory.filterThisMonth' },
  { key: 'last_3_months', labelKey: 'visitHistory.filterLast3Months' },
  { key: 'last_6_months', labelKey: 'visitHistory.filterLast6Months' },
  { key: 'this_year',     labelKey: 'visitHistory.filterThisYear' },
];

function getDateFilterStart(filter: DateFilter): Date | null {
  const now = new Date();
  switch (filter) {
    case 'this_month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'last_3_months':
      return new Date(now.getFullYear(), now.getMonth() - 3, 1);
    case 'last_6_months':
      return new Date(now.getFullYear(), now.getMonth() - 6, 1);
    case 'this_year':
      return new Date(now.getFullYear(), 0, 1);
    default:
      return null;
  }
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; labelKey: string }> = {
  scheduled: { color: '#2D7DD2', bg: '#EAF3FC', icon: Calendar,    labelKey: 'visitHistory.statusScheduled' },
  completed:  { color: '#15C2B0', bg: '#E4F8F4', icon: CheckCircle, labelKey: 'visitHistory.statusCompleted' },
  cancelled:  { color: '#FF6F61', bg: '#FFEDEB', icon: XCircle,     labelKey: 'visitHistory.statusCancelled' },
  pending:    { color: '#D97706', bg: '#FEF3C7', icon: AlertCircle, labelKey: 'visitHistory.statusPending'   },
};

function getStatusConfig(status: string): { color: string; bg: string; icon: any; labelKey: string; rawLabel?: string } {
  return STATUS_CONFIG[status?.toLowerCase()] ?? {
    color: '#6B7280', bg: '#F3F4F6', icon: Calendar,
    labelKey: 'visitHistory.statusUnknown', rawLabel: status || undefined,
  };
}

function formatDateFull(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(timeStr: string) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

function initials(name: string) {
  return name.replace('Dr. ', '').split(' ').map(n => n[0] || '').join('').slice(0, 2).toUpperCase();
}

function DetailRow({ icon: Icon, label, value, color, colors }: {
  icon: any; label: string; value: string; color?: string; colors: any;
}) {
  if (!value) return null;
  return (
    <View style={detailStyles.row}>
      <View style={[detailStyles.iconWrap, { backgroundColor: colors.backgroundSecondary }]}>
        <Icon size={13} color={color || colors.textSecondary} strokeWidth={2} />
      </View>
      <View style={detailStyles.labelValue}>
        <Text style={[detailStyles.label, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[detailStyles.value, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  iconWrap: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  labelValue: { flex: 1 },
  label: { fontSize: 11, fontWeight: '500', marginBottom: 1, textTransform: 'uppercase', letterSpacing: 0.3 },
  value: { fontSize: 14, fontWeight: '500' },
});

function AppointmentItem({ appt, isLast, colors, isDark }: {
  appt: Appointment; isLast: boolean; colors: any; isDark: boolean;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const sc = getStatusConfig(appt.status);
  const StatusIcon = sc.icon;
  const statusLabel = sc.rawLabel ?? t(sc.labelKey);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(v => !v);
  };

  const endTime = appt.end_time;
  const duration = appt.duration && appt.duration.toLowerCase() !== 'custom' ? appt.duration : null;
  const service = appt.services;
  const room = appt.rooms;
  const company = appt.companies;
  const clinic = appt.clinics;

  const hasExtra = !!(endTime || duration || service?.name || room?.room_number || appt.notes || company?.name || appt.created_at);

  return (
    <View style={[styles.apptItem, { borderBottomColor: colors.border }, !isLast && styles.apptItemBorder]}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.75} style={styles.apptSummaryRow}>
        <View style={[styles.apptAccent, { backgroundColor: sc.color }]} />

        <View style={styles.apptSummaryContent}>
          <View style={styles.apptTopRow}>
            <View style={styles.apptDateWrap}>
              <Calendar size={13} color={colors.textSecondary} strokeWidth={2} />
              <Text style={[styles.apptDate, { color: colors.text }]}>{formatDateFull(appt.appointment_date)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
              <StatusIcon size={11} color={sc.color} strokeWidth={2.5} />
              <Text style={[styles.statusText, { color: sc.color }]}>{statusLabel}</Text>
            </View>
          </View>

          <View style={styles.apptMetaRow}>
            {appt.appointment_time ? (
              <View style={styles.metaItem}>
                <Clock size={12} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{formatTime(appt.appointment_time)}</Text>
              </View>
            ) : null}
            {clinic?.name ? (
              <View style={styles.metaItem}>
                <Building2 size={12} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>{clinic.name}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {hasExtra && (
          expanded
            ? <ChevronUp size={16} color={colors.textSecondary} strokeWidth={2} />
            : <ChevronDown size={16} color={colors.textSecondary} strokeWidth={2} />
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.apptDetails, { backgroundColor: isDark ? colors.backgroundSecondary : '#EAF3FC', borderTopColor: colors.border }]}>

          {(endTime || duration) && (
            <View style={styles.detailSection}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('visitHistory.sectionTiming')}</Text>
              <DetailRow icon={Clock} label={t('visitHistory.labelStartTime')} value={formatTime(appt.appointment_time)} colors={colors} />
              {endTime ? <DetailRow icon={Clock} label={t('visitHistory.labelEndTime')} value={formatTime(endTime)} colors={colors} /> : null}
              {duration ? <DetailRow icon={Timer} label={t('visitHistory.labelDuration')} value={duration} colors={colors} /> : null}
            </View>
          )}

          {service?.name ? (
            <View style={styles.detailSection}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('visitHistory.sectionService')}</Text>
              <DetailRow icon={Stethoscope} label={t('visitHistory.labelService')} value={service.name} color="#2D7DD2" colors={colors} />
              {service.description ? <DetailRow icon={FileText} label={t('visitHistory.labelDescription')} value={service.description} colors={colors} /> : null}
              {service.price != null ? <DetailRow icon={BadgeDollarSign} label={t('visitHistory.labelPrice')} value={`$${service.price}`} color="#15C2B0" colors={colors} /> : null}
              {service.duration != null ? <DetailRow icon={Timer} label={t('visitHistory.labelEstDuration')} value={t('visitHistory.estDurationValue', { minutes: service.duration })} colors={colors} /> : null}
            </View>
          ) : null}

          {room?.room_number ? (
            <View style={styles.detailSection}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('visitHistory.sectionRoom')}</Text>
              <DetailRow icon={DoorOpen} label={t('visitHistory.labelRoomNumber')} value={room.room_number} colors={colors} />
              {room.room_type ? <DetailRow icon={Layers} label={t('visitHistory.labelRoomType')} value={room.room_type} colors={colors} /> : null}
              {room.floor != null ? <DetailRow icon={Hash} label={t('visitHistory.labelFloor')} value={`${room.floor}`} colors={colors} /> : null}
            </View>
          ) : null}

          {(clinic?.address || company?.name) ? (
            <View style={styles.detailSection}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('visitHistory.sectionLocation')}</Text>
              {clinic?.address ? <DetailRow icon={Building2} label={t('visitHistory.labelAddress')} value={clinic.address} colors={colors} /> : null}
              {company?.name ? <DetailRow icon={Building2} label={t('visitHistory.labelCompany')} value={company.name} colors={colors} /> : null}
            </View>
          ) : null}

          {appt.notes ? (
            <View style={styles.detailSection}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('visitHistory.sectionNotes')}</Text>
              <View style={[styles.notesBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <FileText size={13} color={colors.textSecondary} strokeWidth={2} style={{ marginTop: 1 }} />
                <Text style={[styles.notesText, { color: colors.text }]}>{appt.notes}</Text>
              </View>
            </View>
          ) : null}

          {appt.created_at ? (
            <Text style={[styles.createdAt, { color: colors.textTertiary }]}>
              {t('visitHistory.bookedOn', { date: new Date(appt.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) })}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

export default function VisitHistoryScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [doctorGroups, setDoctorGroups] = useState<DoctorGroup[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const applyFilter = useCallback((appts: Appointment[], filter: DateFilter) => {
    const start = getDateFilterStart(filter);
    const filtered = start
      ? appts.filter(a => new Date(a.appointment_date) >= start)
      : appts;

    const map = new Map<string, DoctorGroup>();
    filtered.forEach(appt => {
      const doctorId = appt.doctors?.id || 'unknown';
      const doctorName = appt.doctors
        ? t('visitHistory.doctorName', { name: `${appt.doctors.first_name} ${appt.doctors.last_name}` })
        : t('visitHistory.unknownDoctor');

      if (!map.has(doctorId)) {
        map.set(doctorId, { doctorId, doctorName, appointments: [], expanded: false });
      }
      map.get(doctorId)!.appointments.push(appt);
    });

    setDoctorGroups(Array.from(map.values()));
    setTotalCount(filtered.length);
  }, [t]);

  const fetchVisits = useCallback(async () => {
    try {
      const session = await getSession();
      if (!session?.patient?.id) return;

      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-patient-appointments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: session.patient.id }),
        }
      );

      const result = await response.json();
      if (!result.success || !result.appointments) return;

      const appts: Appointment[] = result.appointments;
      appts.sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());
      setAllAppointments(appts);
      applyFilter(appts, dateFilter);
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateFilter, applyFilter]);

  useFocusEffect(
    useCallback(() => {
      fetchVisits();
    }, [fetchVisits])
  );

  const selectFilter = (filter: DateFilter, closeSheet = true) => {
    setDateFilter(filter);
    applyFilter(allAppointments, filter);
    if (closeSheet) setShowFilterSheet(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchVisits();
  };

  const toggleGroup = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDoctorGroups(prev => prev.map(g =>
      g.doctorId === id ? { ...g, expanded: !g.expanded } : g
    ));
  };

  const activeFilterLabelKey = DATE_FILTER_OPTIONS.find(o => o.key === dateFilter)?.labelKey ?? 'visitHistory.filterAllTime';
  const activeFilterLabel = t(activeFilterLabelKey);
  const isFiltered = dateFilter !== 'all';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <BackButton color={colors.text} />
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('visitHistory.title')}</Text>
          {!loading && (
            <View style={[styles.headerBadge, { backgroundColor: isDark ? '#1E3A5F' : '#EAF3FC' }]}>
              <Text style={styles.headerBadgeText}>{totalCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            {
              backgroundColor: isFiltered ? '#2D7DD2' : colors.backgroundSecondary,
              borderColor: isFiltered ? '#2D7DD2' : colors.border,
            },
          ]}
          onPress={() => setShowFilterSheet(true)}
          activeOpacity={0.75}
        >
          <Filter size={14} color={isFiltered ? '#FFFFFF' : colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.filterBtnText, { color: isFiltered ? '#FFFFFF' : colors.textSecondary }]}>
            {activeFilterLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#2D7DD2" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('visitHistory.loadingVisits')}</Text>
        </View>
      ) : doctorGroups.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Calendar size={56} color={colors.textTertiary} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('visitHistory.emptyTitle')}</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {isFiltered
              ? t('visitHistory.emptyFiltered', { filter: activeFilterLabel })
              : t('visitHistory.emptyDefault')}
          </Text>
          {isFiltered && (
            <TouchableOpacity
              style={[styles.clearFilterBtn, { backgroundColor: '#EAF3FC' }]}
              onPress={() => selectFilter('all')}
              activeOpacity={0.75}
            >
              <Text style={styles.clearFilterText}>{t('visitHistory.clearFilter')}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D7DD2" />}
        >
          <View style={styles.summaryRow}>
            <View style={[styles.summaryChip, { backgroundColor: isDark ? '#1E3A5F' : '#EAF3FC' }]}>
              <Calendar size={13} color="#2D7DD2" strokeWidth={2} />
              <Text style={styles.summaryChipText}>{t('visitHistory.visitCount', { count: totalCount })}</Text>
            </View>
            <View style={[styles.summaryChip, { backgroundColor: isDark ? '#1A3A2F' : '#E4F8F4' }]}>
              <Stethoscope size={13} color="#15C2B0" strokeWidth={2} />
              <Text style={[styles.summaryChipText, { color: '#15C2B0' }]}>{t('visitHistory.doctorCount', { count: doctorGroups.length })}</Text>
            </View>
          </View>

          {doctorGroups.map(group => (
            <View key={group.doctorId} style={[styles.doctorBlock, { backgroundColor: colors.card }]}>
              <TouchableOpacity
                style={[styles.doctorRow, { borderBottomColor: colors.border, borderBottomWidth: group.expanded ? 1 : 0 }]}
                onPress={() => toggleGroup(group.doctorId)}
                activeOpacity={0.75}
              >
                <View style={styles.doctorAvatar}>
                  <Text style={styles.doctorAvatarText}>{initials(group.doctorName)}</Text>
                </View>
                <View style={styles.doctorInfo}>
                  <Text style={[styles.doctorName, { color: colors.text }]}>{group.doctorName}</Text>
                  <Text style={[styles.doctorCount, { color: colors.textSecondary }]}>
                    {t('visitHistory.visitCount', { count: group.appointments.length })}
                  </Text>
                </View>
                {group.expanded
                  ? <ChevronUp size={18} color={colors.textSecondary} strokeWidth={2} />
                  : <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2} />
                }
              </TouchableOpacity>

              {group.expanded && group.appointments.map((appt, idx) => (
                <AppointmentItem
                  key={appt.id}
                  appt={appt}
                  isLast={idx === group.appointments.length - 1}
                  colors={colors}
                  isDark={isDark}
                />
              ))}
            </View>
          ))}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* Filter modal */}
      <Modal
        visible={showFilterSheet}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowFilterSheet(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterSheet(false)}
        >
          <TouchableOpacity
            style={[styles.sheetContainer, { backgroundColor: colors.card }]}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{t('visitHistory.filterByDate')}</Text>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity
                  onPress={() => selectFilter('all', false)}
                  style={styles.clearButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearButtonText}>{t('visitHistory.clearAll')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowFilterSheet(false)}
                  style={[styles.modalCloseButton, { backgroundColor: colors.backgroundSecondary }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <X size={20} color={colors.textSecondary} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {DATE_FILTER_OPTIONS.map(option => {
                const selected = dateFilter === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sheetOption,
                      { borderBottomColor: colors.border },
                      selected && { backgroundColor: isDark ? '#1E3A5F' : '#EAF3FC' },
                    ]}
                    onPress={() => selectFilter(option.key, false)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.sheetOptionText, { color: selected ? '#2D7DD2' : colors.text }]}>
                      {t(option.labelKey)}
                    </Text>
                    {selected && (
                      <View style={styles.selectedDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilterSheet(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.applyButtonText}>{t('visitHistory.applyFilter')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  headerBadgeText: { fontSize: 13, fontWeight: '700', color: '#2D7DD2' },

  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterBtnText: { fontSize: 13, fontWeight: '600' },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginTop: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  clearFilterBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  clearFilterText: { fontSize: 14, fontWeight: '600', color: '#2D7DD2' },

  scroll: { flex: 1 },
  summaryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  summaryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  summaryChipText: { fontSize: 12, fontWeight: '600', color: '#2D7DD2' },

  doctorBlock: {
    marginHorizontal: 16, marginBottom: 12, borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  doctorRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, gap: 12,
  },
  doctorAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#2D7DD2',
    justifyContent: 'center', alignItems: 'center',
  },
  doctorAvatarText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 15, fontWeight: '600' },
  doctorCount: { fontSize: 12, marginTop: 2 },

  apptItem: { overflow: 'hidden' },
  apptItemBorder: { borderBottomWidth: 1 },
  apptSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 14,
    paddingVertical: 12,
    gap: 10,
  },
  apptAccent: { width: 3, alignSelf: 'stretch', borderRadius: 2, marginLeft: 14 },
  apptSummaryContent: { flex: 1 },
  apptTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  apptDateWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  apptDate: { fontSize: 14, fontWeight: '600' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  apptMetaRow: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12 },

  apptDetails: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    borderTopWidth: 1,
  },
  detailSection: { marginBottom: 14 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 8,
  },
  notesBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: 10, borderRadius: 8, borderWidth: 1,
  },
  notesText: { fontSize: 13, flex: 1, lineHeight: 19 },
  createdAt: { fontSize: 11, textAlign: 'right', marginTop: 4, marginBottom: 8 },

  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    borderRadius: 24,
    paddingTop: 20,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, marginBottom: 20,
  },
  sheetTitle: { fontSize: 20, fontWeight: '700' },
  modalHeaderActions: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  modalCloseButton: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  clearButton: {
    paddingHorizontal: 12, paddingVertical: 6,
  },
  clearButtonText: { fontSize: 14, fontWeight: '600', color: '#2D7DD2' },
  modalScroll: { flexShrink: 1 },
  modalScrollContent: { paddingHorizontal: 24, paddingBottom: 8 },
  modalFooter: {
    paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24,
    borderTopWidth: 1,
  },
  applyButton: {
    backgroundColor: '#2D7DD2',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  applyButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  sheetOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, borderBottomWidth: 1,
  },
  sheetOptionText: { fontSize: 15, fontWeight: '500' },
  selectedDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#2D7DD2',
  },
});
