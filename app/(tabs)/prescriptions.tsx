import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, RefreshControl, KeyboardAvoidingView, Platform, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { SUPABASE_URL } from '@/utils/supabase';
import { useRouter } from 'expo-router';

import { ArrowLeft, FileText, Filter, ChevronDown, ChevronUp, Pill, Search, X, Bell, BellOff, Pencil, Play, Pause, Plus, Trash2 } from 'lucide-react-native';
import { config } from '@/utils/config';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getBrandPalette } from '@/constants/brand';
import { getSession } from '@/utils/auth';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

type RemindersStatus = 'active' | 'paused' | 'off';

interface ParsedSchedule {
  timesPerDay: number;
  reminderTimes: string[];
  durationDays: number;
  patientMessage: string;
  startDate?: string | null;
  endDate?: string | null;
  remindersStatus?: RemindersStatus;
}

interface PrescriptionItem {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string | null;
  parsed_schedule?: ParsedSchedule | null;
  prescription_definitions?: {
    description: string;
  } | null;
}

interface Prescription {
  id: string;
  prescription_date: string;
  notes: string | null;
  doctor_id: string;
  doctors: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  items: PrescriptionItem[];
}

interface GroupedPrescriptions {
  [doctorId: string]: {
    doctor: Doctor;
    prescriptions: Prescription[];
  };
}

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';

export default function PrescriptionsScreen() {
  const router = useRouter();
  const { colors: themeColors, isDark } = useTheme();
  const bp = getBrandPalette(isDark);
  // Brand-aligned color set: keep theme neutrals, inject brand identity.
  const colors = {
    ...themeColors,
    primary: bp.primary,
    primaryLight: bp.lightBlue,
    turquoise: bp.turquoise,
    turquoiseSoft: bp.turquoiseSoft,
    blue: bp.blue,
    blueSoft: bp.blueSoft,
    coral: bp.coral,
    coralSoft: bp.coralSoft,
  };
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [allPrescriptions, setAllPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [medicalId, setMedicalId] = useState<string>('');

  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'doctor' | 'date' | null>(null);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [collapsedPrescriptions, setCollapsedPrescriptions] = useState<Set<string>>(new Set());

  // Reminder editing
  type TimeRow = { h: string; m: string; ap: 'AM' | 'PM' };
  const [editItem, setEditItem] = useState<{ id: string; name: string } | null>(null);
  const [editTimes, setEditTimes] = useState<TimeRow[]>([]);
  const [editStart, setEditStart] = useState<string>('');
  const [editEnd, setEditEnd] = useState<string>('');
  const [reminderBusy, setReminderBusy] = useState<string | null>(null);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const todayISO = () => {
    const n = new Date();
    return `${n.getFullYear()}-${pad2(n.getMonth() + 1)}-${pad2(n.getDate())}`;
  };
  const addDaysISO = (iso: string, days: number) => {
    const d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  };
  // 24h "HH:MM" -> {h(1-12), m, AM/PM}
  const from24h = (hhmm: string): TimeRow => {
    const [H, M] = hhmm.split(':').map(Number);
    const ap: 'AM' | 'PM' = H >= 12 ? 'PM' : 'AM';
    const h12 = H % 12 === 0 ? 12 : H % 12;
    return { h: String(h12), m: pad2(M || 0), ap };
  };
  // {h,m,ap} -> 24h "HH:MM" (returns null if invalid)
  const to24h = (r: TimeRow): string | null => {
    const h = parseInt(r.h, 10);
    const m = parseInt(r.m, 10);
    if (isNaN(h) || h < 1 || h > 12 || isNaN(m) || m < 0 || m > 59) return null;
    let H = h % 12;
    if (r.ap === 'PM') H += 12;
    return `${pad2(H)}:${pad2(m)}`;
  };

  // Patch one item's parsed_schedule into the in-memory list (no full refetch).
  const patchItemSchedule = (itemId: string, schedule: ParsedSchedule) => {
    setAllPrescriptions(prev =>
      prev.map(p => ({
        ...p,
        items: p.items.map(it => (it.id === itemId ? { ...it, parsed_schedule: schedule } : it)),
      }))
    );
  };

  const callReminderUpdate = async (
    itemId: string,
    action: 'edit' | 'pause' | 'resume' | 'enable' | 'delete',
    reminderTimes?: string[],
    startDate?: string,
    endDate?: string
  ) => {
    try {
      setReminderBusy(itemId);
      const res = await fetch(`${SUPABASE_URL}/functions/v1/mobile-update-medication-reminder`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ medicalId, itemId, action, reminderTimes, startDate, endDate, timezone: tz }),
      });
      const json = await res.json();
      if (json.success && json.parsed_schedule) {
        patchItemSchedule(itemId, json.parsed_schedule);
      } else {
        Alert.alert('Reminder', json.error || 'Could not update the reminder.');
      }
    } catch {
      Alert.alert('Reminder', 'Network error. Please try again.');
    } finally {
      setReminderBusy(null);
    }
  };

  const openEditTimes = (item: PrescriptionItem) => {
    const sched = item.parsed_schedule;
    const times = sched?.reminderTimes ?? [];
    setEditTimes(times.length ? times.map(from24h) : [{ h: '9', m: '00', ap: 'AM' }]);
    const start = sched?.startDate || todayISO();
    setEditStart(start);
    setEditEnd(sched?.endDate || addDaysISO(start, 6));
    setEditItem({ id: item.id, name: item.medicine_name });
  };

  const saveEditTimes = async () => {
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRe.test(editStart) || isNaN(new Date(editStart + 'T00:00:00').getTime())) {
      Alert.alert('Invalid date', 'Start date must be YYYY-MM-DD.');
      return;
    }
    if (!dateRe.test(editEnd) || isNaN(new Date(editEnd + 'T00:00:00').getTime())) {
      Alert.alert('Invalid date', 'End date must be YYYY-MM-DD.');
      return;
    }
    if (new Date(editEnd) < new Date(editStart)) {
      Alert.alert('Invalid range', 'End date must be on or after the start date.');
      return;
    }
    const converted = editTimes.map(to24h);
    if (converted.some(t => t === null)) {
      Alert.alert('Invalid time', 'Enter a valid hour (1–12) and minute (00–59).');
      return;
    }
    const cleaned = Array.from(new Set(converted as string[])).sort();
    const id = editItem!.id;
    setEditItem(null);
    await callReminderUpdate(id, 'edit', cleaned, editStart, editEnd);
  };

  const togglePrescriptionCollapse = (prescriptionId: string) => {
    setCollapsedPrescriptions(prev => {
      const next = new Set(prev);
      if (next.has(prescriptionId)) {
        next.delete(prescriptionId);
      } else {
        next.add(prescriptionId);
      }
      return next;
    });
  };

  const collapseAllPrescriptions = useCallback((prescriptions: Prescription[]) => {
    setCollapsedPrescriptions(new Set(prescriptions.map(p => p.id)));
  }, []);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const session = await getSession();
      console.log('Session data:', session);

      if (session) {
        console.log('Parsed session:', session);

        if (session.patient?.medical_id) {
          console.log('Medical ID found:', session.patient.medical_id);
          setMedicalId(session.patient.medical_id);
        } else {
          console.error('No medical_id in session');
        }
      } else {
        console.error('No session found');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchAllData = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      console.log('Fetching prescriptions for medical_id:', medicalId);


      const doctorsResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/mobile-get-patient-doctors`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ medicalId }),
        }
      );

      const doctorsData = await doctorsResponse.json();
      console.log('Doctors response:', doctorsData);

      if (doctorsData.success) {
        const formattedDoctors = doctorsData.doctors.map((doc: any) => ({
          id: doc.id,
          name: `${doc.first_name} ${doc.last_name}`,
          specialization: doc.specialization || 'N/A',
        }));
        setDoctors(formattedDoctors);
      }

      const prescriptionsResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/mobile-get-patient-prescriptions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            medicalId,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        }
      );

      const prescriptionsData = await prescriptionsResponse.json();
      console.log('Prescriptions response:', prescriptionsData);

      if (prescriptionsData.success) {
        setAllPrescriptions(prescriptionsData.prescriptions);
        collapseAllPrescriptions(prescriptionsData.prescriptions);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [medicalId, collapseAllPrescriptions]);

  const onRefresh = () => {
    if (medicalId) {
      fetchAllData(true);
    }
  };

  const applyFilters = useCallback(() => {
    setFilterLoading(true);

    setTimeout(() => {
      let filtered = [...allPrescriptions];

      if (selectedDoctorFilter !== 'all') {
        filtered = filtered.filter(prescription => prescription.doctor_id === selectedDoctorFilter);
      }

      if (selectedDateFilter !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        filtered = filtered.filter(prescription => {
          const prescriptionDate = new Date(prescription.prescription_date);

          switch (selectedDateFilter) {
            case 'today':
              return prescriptionDate >= today;
            case 'week':
              const weekAgo = new Date(today);
              weekAgo.setDate(weekAgo.getDate() - 7);
              return prescriptionDate >= weekAgo;
            case 'month':
              const monthAgo = new Date(today);
              monthAgo.setMonth(monthAgo.getMonth() - 1);
              return prescriptionDate >= monthAgo;
            case 'year':
              const yearAgo = new Date(today);
              yearAgo.setFullYear(yearAgo.getFullYear() - 1);
              return prescriptionDate >= yearAgo;
            default:
              return true;
          }
        });
      }

      setFilteredPrescriptions(filtered);
      setFilterLoading(false);
    }, 300);
  }, [allPrescriptions, selectedDoctorFilter, selectedDateFilter]);

  useEffect(() => {
    if (medicalId) {
      fetchAllData();
    }
  }, [medicalId, fetchAllData]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const groupPrescriptionsByDoctor = (): GroupedPrescriptions => {
    const grouped: GroupedPrescriptions = {};

    filteredPrescriptions.forEach(prescription => {
      if (!grouped[prescription.doctor_id]) {
        // First try to find doctor in the doctors list
        let doctor = doctors.find(d => d.id === prescription.doctor_id);

        // If not found, use the doctor data from the prescription itself
        if (!doctor && prescription.doctors) {
          doctor = {
            id: prescription.doctors.id,
            name: `${prescription.doctors.first_name} ${prescription.doctors.last_name}`,
            specialization: 'N/A',
          };
        }

        if (doctor) {
          grouped[prescription.doctor_id] = {
            doctor,
            prescriptions: []
          };
        }
      }
      if (grouped[prescription.doctor_id]) {
        grouped[prescription.doctor_id].prescriptions.push(prescription);
      }
    });

    return grouped;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Course status from the parsed schedule's endDate (local midnight comparison).
  const getCourseStatus = (
    schedule?: ParsedSchedule | null
  ): { label: string; tone: 'done' | 'active' | 'none' } => {
    if (!schedule?.endDate) return { label: '', tone: 'none' };
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(schedule.endDate + 'T00:00:00');
    if (end < today) return { label: t('prescriptions.statusCompleted'), tone: 'done' };
    const daysLeft = Math.round((end.getTime() - today.getTime()) / 86400000);
    return {
      label: daysLeft === 0
        ? t('prescriptions.statusLastDay')
        : daysLeft === 1
          ? t('prescriptions.statusOneDayLeft')
          : t('prescriptions.statusDaysLeft', { count: daysLeft }),
      tone: 'active',
    };
  };

  const formatTime12 = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr}:${String(m).padStart(2, '0')} ${period}`;
  };

  const getDoctorFilterLabel = () => {
    if (selectedDoctorFilter === 'all') return t('prescriptions.allDoctors');
    const doctor = doctors.find(d => d.id === selectedDoctorFilter);
    return doctor ? t('prescriptions.doctorName', { name: doctor.name }) : t('prescriptions.allDoctors');
  };

  const getDateFilterLabel = () => {
    switch (selectedDateFilter) {
      case 'today': return t('prescriptions.dateToday');
      case 'week': return t('prescriptions.dateWeek');
      case 'month': return t('prescriptions.dateMonth');
      case 'year': return t('prescriptions.dateYear');
      default: return t('prescriptions.dateAll');
    }
  };

  const groupedPrescriptions = groupPrescriptionsByDoctor();

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('prescriptions.title')}</Text>
        <TouchableOpacity
          style={styles.filterIconButton}
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.7}
        >
          <Filter size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('prescriptions.loadingPrescriptions')}</Text>
        </View>
      ) : filterLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : doctors.length === 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <FileText size={64} color={colors.border} />
          <Text style={styles.emptyTitle}>{t('prescriptions.noDoctorsTitle')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('prescriptions.noDoctorsSubtitle')}
          </Text>
        </ScrollView>
      ) : filteredPrescriptions.length === 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <FileText size={64} color={colors.border} />
          <Text style={styles.emptyTitle}>{t('prescriptions.noPrescriptionsTitle')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('prescriptions.noPrescriptionsSubtitle')}
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {Object.entries(groupedPrescriptions).map(([doctorId, group]) => (
            <View key={doctorId} style={styles.doctorGroup}>
              <View style={styles.doctorGroupHeader}>
                <View>
                  <Text style={styles.doctorGroupName}>{t('prescriptions.doctorName', { name: group.doctor.name })}</Text>
                  <Text style={styles.doctorGroupSpecialization}>
                    {group.doctor.specialization}
                  </Text>
                </View>
                <View style={styles.prescriptionCountBadge}>
                  <Text style={styles.prescriptionCountText}>{group.prescriptions.length}</Text>
                </View>
              </View>

              {group.prescriptions.map((prescription) => {
                const isCollapsed = collapsedPrescriptions.has(prescription.id);
                return (
                <View key={prescription.id} style={styles.prescriptionCard}>
                  <TouchableOpacity
                    style={styles.prescriptionHeader}
                    onPress={() => togglePrescriptionCollapse(prescription.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.prescriptionHeaderLeft}>
                      <View style={styles.prescriptionDocTile}>
                        <FileText size={18} color={colors.blue} />
                      </View>
                      <Text style={styles.prescriptionDate}>{formatDate(prescription.prescription_date)}</Text>
                    </View>
                    <View style={styles.prescriptionHeaderRight}>
                      <View style={styles.medicineCountBadge}>
                        <Pill size={12} color={colors.primary} />
                        <Text style={styles.medicineCountText}>{prescription.items.length}</Text>
                      </View>
                      {isCollapsed
                        ? <ChevronDown size={18} color={colors.textSecondary} />
                        : <ChevronUp size={18} color={colors.textSecondary} />
                      }
                    </View>
                  </TouchableOpacity>

                  {!isCollapsed && (
                    <>
                      {prescription.notes && (
                        <View style={styles.notesBox}>
                          <Text style={styles.notesLabel}>{t('prescriptions.notesLabel')}</Text>
                          <Text style={styles.notesText}>{prescription.notes}</Text>
                        </View>
                      )}

                      <View style={styles.medicinesSection}>
                        <Text style={styles.medicinesSectionTitle}>{t('prescriptions.medicinesLabel')}</Text>
                        {prescription.items.map((item) => {
                          const status = getCourseStatus(item.parsed_schedule);
                          const sched = item.parsed_schedule;
                          const rStatus: RemindersStatus = sched?.remindersStatus ?? 'active';
                          const rTimes = sched?.reminderTimes ?? [];
                          const courseEnded = status.tone === 'done';
                          const busy = reminderBusy === item.id;
                          return (
                          <View key={item.id} style={styles.medicineCard}>
                            <View style={styles.medicineHeader}>
                              <Pill size={18} color={colors.primary} />
                              <Text style={styles.medicineName}>{item.medicine_name}</Text>
                              {status.tone !== 'none' && (
                                <View
                                  style={[
                                    styles.statusBadge,
                                    status.tone === 'done' ? styles.statusBadgeDone : styles.statusBadgeActive,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.statusBadgeText,
                                      status.tone === 'done' ? styles.statusBadgeTextDone : styles.statusBadgeTextActive,
                                    ]}
                                  >
                                    {status.label}
                                  </Text>
                                </View>
                              )}
                            </View>

                            {item.parsed_schedule?.patientMessage ? (
                              <Text style={styles.instructionText}>
                                {item.parsed_schedule.patientMessage}
                              </Text>
                            ) : null}

                            {/* Reminder controls */}
                            <View style={styles.reminderBox}>
                              <View style={styles.reminderHeaderRow}>
                                <View style={styles.reminderHeaderLeft}>
                                  {rStatus === 'active' ? (
                                    <Bell size={15} color={colors.turquoise} />
                                  ) : (
                                    <BellOff size={15} color={colors.textSecondary} />
                                  )}
                                  <Text style={styles.reminderTitle}>
                                    {rStatus === 'off'
                                      ? 'Reminders off'
                                      : rStatus === 'paused'
                                      ? 'Reminders paused'
                                      : 'Reminders'}
                                  </Text>
                                </View>
                                {busy && <ActivityIndicator size="small" color={colors.primary} />}
                              </View>

                              {rStatus === 'active' && rTimes.length > 0 && (
                                <View style={styles.timeChips}>
                                  {rTimes.map((t) => (
                                    <View key={t} style={styles.timeChip}>
                                      <Text style={styles.timeChipText}>{formatTime12(t)}</Text>
                                    </View>
                                  ))}
                                </View>
                              )}
                              {rStatus === 'active' && rTimes.length === 0 && (
                                <Text style={styles.reminderHint}>
                                  No times set. Tap Edit to add reminder times.
                                </Text>
                              )}

                              {courseEnded ? (
                                <Text style={styles.reminderHint}>Course finished — no reminders.</Text>
                              ) : (
                                <View style={styles.reminderActions}>
                                  <TouchableOpacity
                                    style={styles.reminderBtn}
                                    onPress={() => openEditTimes(item)}
                                    disabled={busy}
                                    activeOpacity={0.7}
                                  >
                                    <Pencil size={14} color={colors.primary} />
                                    <Text style={styles.reminderBtnText}>Edit</Text>
                                  </TouchableOpacity>

                                  {rStatus === 'active' && (
                                    <TouchableOpacity
                                      style={styles.reminderBtn}
                                      onPress={() => callReminderUpdate(item.id, 'pause')}
                                      disabled={busy}
                                      activeOpacity={0.7}
                                    >
                                      <Pause size={14} color={colors.textSecondary} />
                                      <Text style={styles.reminderBtnTextMuted}>Pause</Text>
                                    </TouchableOpacity>
                                  )}
                                  {(rStatus === 'paused' || rStatus === 'off') && (
                                    <TouchableOpacity
                                      style={styles.reminderBtn}
                                      onPress={() => callReminderUpdate(item.id, rStatus === 'off' ? 'enable' : 'resume')}
                                      disabled={busy}
                                      activeOpacity={0.7}
                                    >
                                      <Play size={14} color={colors.primary} />
                                      <Text style={styles.reminderBtnText}>
                                        {rStatus === 'off' ? 'Turn on' : 'Resume'}
                                      </Text>
                                    </TouchableOpacity>
                                  )}

                                  {rStatus !== 'off' && (
                                    <TouchableOpacity
                                      style={styles.reminderBtn}
                                      onPress={() =>
                                        Alert.alert(
                                          'Turn off reminders?',
                                          `Stop all reminders for ${item.medicine_name}?`,
                                          [
                                            { text: 'Cancel', style: 'cancel' },
                                            { text: 'Turn off', style: 'destructive', onPress: () => callReminderUpdate(item.id, 'delete') },
                                          ]
                                        )
                                      }
                                      disabled={busy}
                                      activeOpacity={0.7}
                                    >
                                      <Trash2 size={14} color={colors.coral} />
                                      <Text style={[styles.reminderBtnText, { color: colors.coral }]}>Off</Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              )}
                            </View>

                            <View style={styles.medicineDetails}>
                              {item.dosage && (
                                <View style={styles.medicineDetail}>
                                  <Text style={styles.medicineDetailLabel}>{t('prescriptions.dosageLabel')}</Text>
                                  <Text style={styles.medicineDetailValue}>{item.dosage}</Text>
                                </View>
                              )}
                              {item.frequency && (
                                <View style={styles.medicineDetail}>
                                  <Text style={styles.medicineDetailLabel}>{t('prescriptions.frequencyLabel')}</Text>
                                  <Text style={styles.medicineDetailValue}>{item.frequency}</Text>
                                </View>
                              )}
                              {item.duration && (
                                <View style={styles.medicineDetail}>
                                  <Text style={styles.medicineDetailLabel}>{t('prescriptions.durationLabel')}</Text>
                                  <Text style={styles.medicineDetailValue}>{item.duration}</Text>
                                </View>
                              )}
                              {item.notes && (
                                <View style={styles.medicineDetail}>
                                  <Text style={styles.medicineDetailLabel}>{t('prescriptions.notesLabel')}</Text>
                                  <Text style={styles.medicineDetailValue}>{item.notes}</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          );
                        })}
                      </View>
                    </>
                  )}
                </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => { setShowFilterModal(false); setOpenDropdown(null); setDoctorSearch(''); }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => { setShowFilterModal(false); setOpenDropdown(null); setDoctorSearch(''); }}
          >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('prescriptions.filtersTitle')}</Text>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDoctorFilter('all');
                    setSelectedDateFilter('all');
                    setOpenDropdown(null);
                    setDoctorSearch('');
                  }}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>{t('prescriptions.clearAll')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setShowFilterModal(false); setOpenDropdown(null); setDoctorSearch(''); }}
                  style={styles.modalCloseButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={20} color={colors.textSecondary} />
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
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>{t('prescriptions.doctorSectionTitle')}</Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, openDropdown === 'doctor' && styles.dropdownTriggerOpen]}
                onPress={() => {
                  if (openDropdown === 'doctor') {
                    setOpenDropdown(null);
                    setDoctorSearch('');
                  } else {
                    setOpenDropdown('doctor');
                    setDoctorSearch('');
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownTriggerText}>{getDoctorFilterLabel()}</Text>
                <ChevronDown
                  size={18}
                  color={colors.textSecondary}
                  style={{ transform: [{ rotate: openDropdown === 'doctor' ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>
              {openDropdown === 'doctor' && (() => {
                const doctorItems = [{ id: 'all', name: t('prescriptions.allDoctors'), specialization: '' }, ...doctors.map(d => ({ id: d.id, name: t('prescriptions.doctorName', { name: d.name }), specialization: d.specialization }))]
                  .filter(item => item.id === 'all' || item.name.toLowerCase().includes(doctorSearch.toLowerCase()) || item.specialization.toLowerCase().includes(doctorSearch.toLowerCase()));
                return (
                  <View style={styles.dropdownList}>
                    <View style={styles.dropdownSearchRow}>
                      <Search size={15} color={colors.textSecondary} />
                      <TextInput
                        style={styles.dropdownSearchInput}
                        placeholder={t('prescriptions.searchDoctors')}
                        placeholderTextColor={colors.textSecondary}
                        value={doctorSearch}
                        onChangeText={setDoctorSearch}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      {doctorSearch.length > 0 && (
                        <TouchableOpacity onPress={() => setDoctorSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <X size={14} color={colors.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <ScrollView
                      style={styles.dropdownFlatList}
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled
                    >
                      {doctorItems.map((item, index) => (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.dropdownItem,
                            selectedDoctorFilter === item.id && styles.dropdownItemSelected,
                            index === doctorItems.length - 1 && styles.dropdownItemLast,
                          ]}
                          onPress={() => {
                            setSelectedDoctorFilter(item.id);
                            setOpenDropdown(null);
                            setDoctorSearch('');
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.dropdownItemContent}>
                            <Text style={[styles.dropdownItemText, selectedDoctorFilter === item.id && styles.dropdownItemTextSelected]}>
                              {item.name}
                            </Text>
                            {item.specialization ? (
                              <Text style={styles.dropdownItemSubtext}>{item.specialization}</Text>
                            ) : null}
                          </View>
                          {selectedDoctorFilter === item.id && (
                            <View style={styles.dropdownItemCheck} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                );
              })()}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>{t('prescriptions.dateRangeSectionTitle')}</Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, openDropdown === 'date' && styles.dropdownTriggerOpen]}
                onPress={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownTriggerText}>{getDateFilterLabel()}</Text>
                <ChevronDown
                  size={18}
                  color={colors.textSecondary}
                  style={{ transform: [{ rotate: openDropdown === 'date' ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>
              {openDropdown === 'date' && (
                <View style={styles.dropdownList}>
                  {[
                    { value: 'all', label: t('prescriptions.dateAll') },
                    { value: 'today', label: t('prescriptions.dateToday') },
                    { value: 'week', label: t('prescriptions.dateWeek') },
                    { value: 'month', label: t('prescriptions.dateMonth') },
                    { value: 'year', label: t('prescriptions.dateYear') },
                  ].map((option, idx, arr) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.dropdownItem,
                        selectedDateFilter === option.value && styles.dropdownItemSelected,
                        idx === arr.length - 1 && styles.dropdownItemLast,
                      ]}
                      onPress={() => {
                        setSelectedDateFilter(option.value as DateFilter);
                        setOpenDropdown(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.dropdownItemText, selectedDateFilter === option.value && styles.dropdownItemTextSelected]}>
                        {option.label}
                      </Text>
                      {selectedDateFilter === option.value && (
                        <View style={styles.dropdownItemCheck} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  setOpenDropdown(null);
                  setShowFilterModal(false);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#56C6C8', '#69C7F0']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                <Text style={styles.applyButtonText}>{t('prescriptions.applyFilters')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit reminder times modal */}
      <Modal
        visible={!!editItem}
        transparent
        animationType="slide"
        onRequestClose={() => setEditItem(null)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={styles.editModalOverlay} activeOpacity={1} onPress={() => setEditItem(null)}>
            <TouchableOpacity activeOpacity={1} style={styles.editModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1}>{editItem?.name}</Text>
              </View>
              <ScrollView style={{ maxHeight: 400 }} keyboardShouldPersistTaps="handled">
                {/* Date range */}
                <Text style={styles.editSectionLabel}>Date range</Text>
                <View style={styles.dateRangeRow}>
                  <View style={styles.dateField}>
                    <Text style={styles.dateFieldLabel}>From</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={editStart}
                      onChangeText={setEditStart}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textSecondary}
                      autoCapitalize="none"
                      maxLength={10}
                    />
                  </View>
                  <View style={styles.dateField}>
                    <Text style={styles.dateFieldLabel}>To</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={editEnd}
                      onChangeText={setEditEnd}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textSecondary}
                      autoCapitalize="none"
                      maxLength={10}
                    />
                  </View>
                </View>

                {/* Times */}
                <Text style={[styles.editSectionLabel, { marginTop: 18 }]}>Times</Text>
                {editTimes.map((t, idx) => (
                  <View key={idx} style={styles.timeRow}>
                    <TextInput
                      style={styles.hmInput}
                      value={t.h}
                      onChangeText={(v) => setEditTimes(prev => prev.map((x, i) => (i === idx ? { ...x, h: v.replace(/[^0-9]/g, '').slice(0, 2) } : x)))}
                      placeholder="9"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={styles.colon}>:</Text>
                    <TextInput
                      style={styles.hmInput}
                      value={t.m}
                      onChangeText={(v) => setEditTimes(prev => prev.map((x, i) => (i === idx ? { ...x, m: v.replace(/[^0-9]/g, '').slice(0, 2) } : x)))}
                      placeholder="00"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <View style={styles.ampmGroup}>
                      {(['AM', 'PM'] as const).map((ap) => (
                        <TouchableOpacity
                          key={ap}
                          style={[styles.ampmBtn, t.ap === ap && styles.ampmBtnActive]}
                          onPress={() => setEditTimes(prev => prev.map((x, i) => (i === idx ? { ...x, ap } : x)))}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.ampmText, t.ap === ap && styles.ampmTextActive]}>{ap}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={styles.timeRemove}
                      onPress={() => setEditTimes(prev => prev.filter((_, i) => i !== idx))}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addTimeBtn}
                  onPress={() => setEditTimes(prev => [...prev, { h: '12', m: '00', ap: 'PM' }])}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color={colors.primary} />
                  <Text style={styles.addTimeText}>Add time</Text>
                </TouchableOpacity>
              </ScrollView>

              <TouchableOpacity style={styles.applyButton} onPress={saveEditTimes} activeOpacity={0.9}>
                <LinearGradient colors={['#2D7DD2', '#15C2B0', '#FF6F61']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                <Text style={styles.applyButtonText}>Save reminders</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background ?? '#F8FAFC',
  },
  header: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blueSoft,
    borderRadius: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    minHeight: '100%',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  doctorGroup: {
    marginBottom: 28,
  },
  doctorGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  doctorGroupName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 3,
  },
  doctorGroupSpecialization: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  prescriptionCountBadge: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prescriptionCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  prescriptionCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prescriptionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  prescriptionDocTile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prescriptionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  medicineCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.blueSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  medicineCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.blue,
  },
  prescriptionDate: {
    fontSize: 14.5,
    color: colors.text,
    fontWeight: '700',
  },
  notesBox: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  notesLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  medicinesSection: {
    marginTop: 16,
  },
  medicinesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  medicineCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  medicineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeActive: {
    backgroundColor: colors.turquoiseSoft,
  },
  statusBadgeDone: {
    backgroundColor: colors.backgroundTertiary,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeTextActive: {
    color: colors.turquoise,
  },
  statusBadgeTextDone: {
    color: colors.textSecondary,
  },
  instructionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
    fontWeight: '500',
  },
  reminderBox: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
    marginBottom: 12,
  },
  reminderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reminderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  timeChip: {
    backgroundColor: colors.turquoiseSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.turquoise,
  },
  reminderHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  reminderActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.backgroundSecondary,
  },
  reminderBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  reminderBtnTextMuted: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  editHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.backgroundSecondary,
  },
  timeRemove: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: 8,
  },
  addTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  editSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  dateRangeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  dateFieldLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  dateInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.backgroundSecondary,
  },
  hmInput: {
    width: 54,
    textAlign: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.backgroundSecondary,
  },
  colon: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: 2,
  },
  ampmGroup: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 6,
  },
  ampmBtn: {
    paddingVertical: 11,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundSecondary,
  },
  ampmBtnActive: {
    backgroundColor: colors.primary,
  },
  ampmText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  ampmTextActive: {
    color: '#FFFFFF',
  },
  medicineDetails: {
    gap: 8,
  },
  medicineDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  medicineDetailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    width: 90,
  },
  medicineDetailValue: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    borderRadius: 24,
    paddingTop: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  editModalContent: {
    backgroundColor: colors.card,
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    borderRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  modalScroll: {
    flexShrink: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  dropdownTriggerOpen: {
    borderColor: colors.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  dropdownTriggerText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  dropdownList: {
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: colors.primary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  dropdownFlatList: {
    maxHeight: 200,
  },
  dropdownSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dropdownItemLast: {},
  dropdownItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '400',
  },
  dropdownItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  dropdownItemSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dropdownItemCheck: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 10,
  },
  applyButton: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
