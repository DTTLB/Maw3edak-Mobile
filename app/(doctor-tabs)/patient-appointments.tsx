import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { getDoctorPalette, DoctorPalette } from '@/utils/doctorPalette';
import { useAuth } from '@/contexts/AuthContext';
import { config } from '@/utils/config';
import {
  ArrowLeft,
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
  Phone,
  Hash,
} from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  medicalId: string;
  doctorName: string;
  doctorId: string;
  clinicName: string;
  clinicId: string;
  companyName: string;
  companyId: string;
  status: string;
  date: string;
  time: string;
  endDate: string;
  endTime: string;
  duration: string;
  notes: string;
  isCustom: boolean;
  createdAt: string;
  serviceName: string;
  serviceDescription: string;
  servicePrice: number | null;
  serviceDuration: number | null;
  roomNumber: string;
  roomType: string;
  roomFloor: number | null;
}

interface DoctorGroup {
  doctorId: string;
  doctorName: string;
  appointments: Appointment[];
  expanded: boolean;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; labelKey: string }> = {
  scheduled: { color: '#2D7DD2', bg: '#EAF3FC', icon: Calendar,    labelKey: 'statusScheduled' },
  completed:  { color: '#15C2B0', bg: '#E4F8F4', icon: CheckCircle, labelKey: 'statusCompleted' },
  cancelled:  { color: '#FF6F61', bg: '#FFEDEB', icon: XCircle,     labelKey: 'statusCancelled' },
  pending:    { color: '#F59E0B', bg: '#FEF3C7', icon: AlertCircle, labelKey: 'statusPending'   },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status?.toLowerCase()] ?? {
    color: '#6B7280', bg: '#F3F4F6', icon: Calendar, labelKey: '',
  };
}

function formatDateFull(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function initials(name: string) {
  return name.replace('Dr. ', '').split(' ').map(n => n[0] || '').join('').slice(0, 2).toUpperCase();
}

function DetailRow({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: string; color?: string;
}) {
  const { colors } = useTheme();
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
  const P = useMemo(() => getDoctorPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(P), [P]);
  const [expanded, setExpanded] = useState(false);
  const sc = getStatusConfig(appt.status);
  const StatusIcon = sc.icon;
  const statusLabel = sc.labelKey ? t(`doctorPatientAppointments.${sc.labelKey}`) : (appt.status || t('doctorPatientAppointments.statusUnknown'));

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(v => !v);
  };

  const hasExtra = !!(
    appt.endTime || appt.duration || appt.serviceName || appt.roomNumber ||
    appt.notes || appt.companyName || appt.patientPhone || appt.createdAt
  );

  return (
    <View style={[
      styles.apptItem,
      { borderBottomColor: colors.border },
      !isLast && styles.apptItemBorder,
    ]}>
      {/* Collapsed row — always visible, tap to toggle */}
      <TouchableOpacity onPress={toggle} activeOpacity={0.75} style={styles.apptSummaryRow}>
        {/* Coloured left accent */}
        <View style={[styles.apptAccent, { backgroundColor: sc.color }]} />

        <View style={styles.apptSummaryContent}>
          {/* Date + status */}
          <View style={styles.apptTopRow}>
            <View style={styles.apptDateWrap}>
              <Calendar size={13} color={colors.textSecondary} strokeWidth={2} />
              <Text style={[styles.apptDate, { color: colors.text }]}>{formatDateFull(appt.date)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
              <StatusIcon size={11} color={sc.color} strokeWidth={2.5} />
              <Text style={[styles.statusText, { color: sc.color }]}>{statusLabel}</Text>
            </View>
          </View>

          {/* Time + clinic quick line */}
          <View style={styles.apptMetaRow}>
            {appt.time ? (
              <View style={styles.metaItem}>
                <Clock size={12} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{appt.time}</Text>
              </View>
            ) : null}
            {appt.clinicName ? (
              <View style={styles.metaItem}>
                <Building2 size={12} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>{appt.clinicName}</Text>
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

      {/* Expanded details */}
      {expanded && (
        <View style={[styles.apptDetails, { backgroundColor: isDark ? colors.backgroundSecondary : '#F8FAFC', borderTopColor: colors.border }]}>

          {/* Timing section */}
          {(appt.endTime || appt.duration) && (
            <View style={styles.detailSection}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('doctorPatientAppointments.sectionTiming')}</Text>
              <DetailRow icon={Clock} label={t('doctorPatientAppointments.startTime')} value={appt.time} />
              {appt.endTime ? <DetailRow icon={Clock} label={t('doctorPatientAppointments.endTime')} value={appt.endTime} /> : null}
              {appt.duration ? <DetailRow icon={Timer} label={t('doctorPatientAppointments.duration')} value={appt.duration} /> : null}
            </View>
          )}

          {/* Service section */}
          {appt.serviceName ? (
            <View style={styles.detailSection}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('doctorPatientAppointments.sectionService')}</Text>
              <DetailRow icon={Stethoscope} label={t('doctorPatientAppointments.service')} value={appt.serviceName} color="#2D7DD2" />
              {appt.serviceDescription ? <DetailRow icon={FileText} label={t('doctorPatientAppointments.description')} value={appt.serviceDescription} /> : null}
              {appt.servicePrice != null ? <DetailRow icon={BadgeDollarSign} label={t('doctorPatientAppointments.price')} value={`$${appt.servicePrice}`} color="#15C2B0" /> : null}
              {appt.serviceDuration != null ? <DetailRow icon={Timer} label={t('doctorPatientAppointments.estDuration')} value={t('doctorPatientAppointments.minutesValue', { minutes: appt.serviceDuration })} /> : null}
            </View>
          ) : null}

          {/* Room section */}
          {appt.roomNumber ? (
            <View style={styles.detailSection}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('doctorPatientAppointments.sectionRoom')}</Text>
              <DetailRow icon={DoorOpen} label={t('doctorPatientAppointments.roomNumber')} value={appt.roomNumber} />
              {appt.roomType ? <DetailRow icon={Layers} label={t('doctorPatientAppointments.roomType')} value={appt.roomType} /> : null}
              {appt.roomFloor != null ? <DetailRow icon={Hash} label={t('doctorPatientAppointments.floor')} value={`${appt.roomFloor}`} /> : null}
            </View>
          ) : null}

          {/* Patient & company */}
          {(appt.patientPhone || appt.companyName) ? (
            <View style={styles.detailSection}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('doctorPatientAppointments.sectionPatientInfo')}</Text>
              {appt.patientPhone ? <DetailRow icon={Phone} label={t('doctorPatientAppointments.phone')} value={appt.patientPhone} /> : null}
              {appt.companyName ? <DetailRow icon={Building2} label={t('doctorPatientAppointments.company')} value={appt.companyName} /> : null}
            </View>
          ) : null}

          {/* Notes */}
          {appt.notes ? (
            <View style={styles.detailSection}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('doctorPatientAppointments.sectionNotes')}</Text>
              <View style={[styles.notesBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <FileText size={13} color={colors.textSecondary} strokeWidth={2} style={{ marginTop: 1 }} />
                <Text style={[styles.notesText, { color: colors.text }]}>{appt.notes}</Text>
              </View>
            </View>
          ) : null}

          {/* Created at */}
          {appt.createdAt ? (
            <Text style={[styles.createdAt, { color: colors.textTertiary }]}>
              {t('doctorPatientAppointments.createdOn', { date: new Date(appt.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) })}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

export default function PatientAppointmentsScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const P = useMemo(() => getDoctorPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(P), [P]);
  const { session } = useAuth();
  const router = useRouter();
  const { medical_id, patient_name } = useLocalSearchParams<{ medical_id: string; patient_name: string }>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctorGroups, setDoctorGroups] = useState<DoctorGroup[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAppointments = useCallback(async () => {
    try {
      const globalId = session?.user?.global_id;
      const companyId = session?.user?.company_id;
      if (!globalId || !medical_id) return;

      const params = new URLSearchParams({ global_id: globalId, medical_id });
      if (companyId) params.append('company_id', companyId);

      const res = await fetch(
        `${config.supabaseUrl}/functions/v1/mobile-get-doctor-all-appointments?${params.toString()}`,
        { headers: { Authorization: `Bearer ${config.supabaseAnonKey}`, 'Content-Type': 'application/json' } }
      );
      const data = await res.json();
      const appts: Appointment[] = data.appointments || [];

      appts.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const map = new Map<string, DoctorGroup>();
      appts.forEach(appt => {
        const key = appt.doctorId || 'unknown';
        if (!map.has(key)) {
          map.set(key, { doctorId: key, doctorName: appt.doctorName || t('doctorPatientAppointments.unknownDoctor'), appointments: [], expanded: true });
        }
        map.get(key)!.appointments.push(appt);
      });

      setDoctorGroups(Array.from(map.values()));
      setTotalCount(appts.length);
    } catch (e) {
      console.error('Error fetching patient appointments:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [medical_id, session, t]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const onRefresh = () => { setRefreshing(true); fetchAppointments(); };

  const toggleGroup = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDoctorGroups(prev => prev.map(g => g.doctorId === id ? { ...g, expanded: !g.expanded } : g));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{patient_name || t('doctorPatientAppointments.patient')}</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{medical_id}</Text>
        </View>
        {!loading && (
          <View style={[styles.headerBadge, { backgroundColor: isDark ? '#16324E' : '#EAF3FC' }]}>
            <Text style={styles.headerBadgeText}>{totalCount}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#2D7DD2" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('doctorPatientAppointments.loadingAppointments')}</Text>
        </View>
      ) : doctorGroups.length === 0 ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.emptyWrap}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D7DD2" />}
        >
          <Calendar size={56} color={colors.textTertiary} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('doctorPatientAppointments.noAppointmentsTitle')}</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('doctorPatientAppointments.noAppointmentsText')}</Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D7DD2" />}
        >
          {/* Summary strip */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryChip, { backgroundColor: isDark ? '#16324E' : '#EAF3FC' }]}>
              <Calendar size={13} color="#2D7DD2" strokeWidth={2} />
              <Text style={styles.summaryChipText}>{t('doctorPatientAppointments.appointmentCount', { num:totalCount })}</Text>
            </View>
            <View style={[styles.summaryChip, { backgroundColor: isDark ? '#0E3B37' : '#E4F8F4' }]}>
              <Stethoscope size={13} color="#15C2B0" strokeWidth={2} />
              <Text style={[styles.summaryChipText, { color: '#15C2B0' }]}>{t('doctorPatientAppointments.doctorCount', { num: doctorGroups.length })}</Text>
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
                    {t('doctorPatientAppointments.appointmentCount', { num:group.appointments.length })}
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
    </SafeAreaView>
  );
}

const makeStyles = (P: DoctorPalette) => StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 1 },
  headerBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  headerBadgeText: { fontSize: 13, fontWeight: '700', color: P.primary },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginTop: 8 },
  emptyText: { fontSize: 14, textAlign: 'center' },

  scroll: { flex: 1 },
  summaryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  summaryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  summaryChipText: { fontSize: 12, fontWeight: '600', color: P.primary },

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
    width: 40, height: 40, borderRadius: 20, backgroundColor: P.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  doctorAvatarText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 15, fontWeight: '600' },
  doctorCount: { fontSize: 12, marginTop: 2 },

  // Appointment row
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

  // Expanded details panel
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
});
