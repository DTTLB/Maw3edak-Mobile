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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Check,
  CalendarDays,
  User,
  Stethoscope,
  ChevronDown,
  Search,
  X,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  getDoctors,
  getPatients,
  listMyAppointments,
  type ReceptionDoctor,
  type ReceptionPatient,
  type ReceptionAppointment,
} from '@/utils/receptionApi';
import DoctorCalendarView from '@/components/reception/DoctorCalendarView';

// Receptionist "Patient Calendar": pick a patient and/or one or more doctors,
// then view the matching appointments on a Day / Week / Month calendar. The
// patient + doctor filters live in the center of the screen (above the
// calendar), not in a footer. Reuses the existing booking endpoints
// (getPatients + getDoctors + listMyAppointments) — no new backend needed.
export default function ReceptionPatientCalendarScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { session } = useAuth();
  const router = useRouter();

  const userId = session?.user?.realUserId || session?.user?.global_id || '';
  const companyId = session?.user?.company_id || null;

  const [patients, setPatients] = useState<ReceptionPatient[]>([]);
  const [doctors, setDoctors] = useState<ReceptionDoctor[]>([]);
  const [appointments, setAppointments] = useState<ReceptionAppointment[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<ReceptionPatient | null>(null);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Which picker modal is open (null = none).
  const [openPicker, setOpenPicker] = useState<'patient' | 'doctor' | null>(null);
  const [patientSearch, setPatientSearch] = useState('');

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const [pats, docs, appts] = await Promise.all([
        getPatients(userId, companyId),
        getDoctors(userId, companyId),
        listMyAppointments(userId, companyId),
      ]);
      setPatients(pats);
      setDoctors(docs);
      setAppointments(appts);
    } catch (e) {
      console.error('Failed to load patient calendar:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, companyId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const toggleDoctor = (id: string) => {
    setSelectedDoctors((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const clearFilters = () => {
    setSelectedPatient(null);
    setSelectedDoctors([]);
  };

  const hasFilter = !!selectedPatient || selectedDoctors.length > 0;

  // Appointments matching the chosen patient (by medical id) AND the chosen
  // doctors. An empty selection on either dimension means "no constraint" there.
  const filtered = useMemo(() => {
    if (!hasFilter) return [];
    const docSet = new Set(selectedDoctors);
    return appointments.filter((a) => {
      if (selectedPatient && a.medicalId !== selectedPatient.medical_id) return false;
      if (docSet.size > 0 && !docSet.has(a.doctorId)) return false;
      return true;
    });
  }, [appointments, hasFilter, selectedPatient, selectedDoctors]);

  // Patients narrowed by the search box inside the patient picker.
  const patientResults = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(q) ||
        p.medical_id?.toLowerCase().includes(q) ||
        (p.phone || '').toLowerCase().includes(q)
    );
  }, [patients, patientSearch]);

  const doctorLabel = useMemo(() => {
    if (selectedDoctors.length === 0) return t('reception.pcAllDoctors');
    if (selectedDoctors.length === 1) {
      const d = doctors.find((x) => x.id === selectedDoctors[0]);
      return d ? `${d.first_name} ${d.last_name}`.trim() : t('reception.pcDoctorsCount', { count: 1 });
    }
    return t('reception.pcDoctorsCount', { count: selectedDoctors.length });
  }, [selectedDoctors, doctors, t]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('reception.patientCalendarTitle')}</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {/* Filters — centered above the calendar */}
          <View style={[styles.filterCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.filterHead}>
              <Text style={[styles.filterTitle, { color: colors.text }]}>{t('reception.pcFiltersTitle')}</Text>
              {hasFilter ? (
                <TouchableOpacity onPress={clearFilters} hitSlop={8}>
                  <Text style={[styles.clearText, { color: colors.primary }]}>{t('reception.clearFilters')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Patient select */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('reception.pcPatientLabel')}</Text>
            <TouchableOpacity
              style={[styles.selectField, { borderColor: selectedPatient ? colors.primary : colors.border, backgroundColor: colors.backgroundSecondary }]}
              onPress={() => { setPatientSearch(''); setOpenPicker('patient'); }}
              activeOpacity={0.8}
            >
              <User size={18} color={selectedPatient ? colors.primary : colors.textSecondary} strokeWidth={2} />
              <Text
                style={[styles.selectValue, { color: selectedPatient ? colors.text : colors.textTertiary }]}
                numberOfLines={1}
              >
                {selectedPatient ? selectedPatient.full_name : t('reception.pcSelectPatient')}
              </Text>
              <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>

            {/* Doctor select */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 12 }]}>{t('reception.pcDoctorLabel')}</Text>
            <TouchableOpacity
              style={[styles.selectField, { borderColor: selectedDoctors.length > 0 ? colors.primary : colors.border, backgroundColor: colors.backgroundSecondary }]}
              onPress={() => setOpenPicker('doctor')}
              activeOpacity={0.8}
            >
              <Stethoscope size={18} color={selectedDoctors.length > 0 ? colors.primary : colors.textSecondary} strokeWidth={2} />
              <Text
                style={[styles.selectValue, { color: selectedDoctors.length > 0 ? colors.text : colors.textTertiary }]}
                numberOfLines={1}
              >
                {doctorLabel}
              </Text>
              <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Calendar / prompt */}
          {!hasFilter ? (
            <View style={[styles.prompt, { backgroundColor: colors.card }]}>
              <CalendarDays size={44} color={colors.textTertiary} strokeWidth={1.5} />
              <Text style={[styles.promptText, { color: colors.textSecondary }]}>
                {t('reception.pcFilterPrompt')}
              </Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={[styles.prompt, { backgroundColor: colors.card }]}>
              <CalendarDays size={44} color={colors.textTertiary} strokeWidth={1.5} />
              <Text style={[styles.promptText, { color: colors.textSecondary }]}>
                {t('reception.calNoAppointments')}
              </Text>
            </View>
          ) : (
            <View style={styles.calWrap}>
              <DoctorCalendarView appointments={filtered} showDoctor />
            </View>
          )}
        </ScrollView>
      )}

      {/* Patient picker modal (searchable, single-select) */}
      <Modal
        visible={openPicker === 'patient'}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenPicker(null)}
      >
        <TouchableOpacity style={styles.modalScrim} activeOpacity={1} onPress={() => setOpenPicker(null)}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHead, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('reception.pcSelectPatient')}</Text>
              <TouchableOpacity onPress={() => setOpenPicker(null)} hitSlop={10}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchWrap, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <Search size={18} color={colors.textSecondary} strokeWidth={2} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={t('reception.searchPatients')}
                placeholderTextColor={colors.textTertiary}
                value={patientSearch}
                onChangeText={setPatientSearch}
                autoCorrect={false}
              />
              {patientSearch ? (
                <TouchableOpacity onPress={() => setPatientSearch('')} hitSlop={8}>
                  <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* "All patients" clears the patient filter. */}
              <TouchableOpacity
                style={styles.optRow}
                onPress={() => { setSelectedPatient(null); setOpenPicker(null); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.optLabel, { color: colors.text }]}>{t('reception.pcAllPatients')}</Text>
                {!selectedPatient ? <Check size={18} color={colors.primary} strokeWidth={2.5} /> : null}
              </TouchableOpacity>

              {patientResults.map((p) => {
                const isSel = selectedPatient?.patient_id === p.patient_id;
                return (
                  <TouchableOpacity
                    key={p.patient_id}
                    style={styles.optRow}
                    onPress={() => { setSelectedPatient(p); setOpenPicker(null); }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optText}>
                      <Text style={[styles.optLabel, { color: colors.text }]} numberOfLines={1}>{p.full_name}</Text>
                      {p.medical_id ? (
                        <Text style={[styles.optSub, { color: colors.textTertiary }]} numberOfLines={1}>{p.medical_id}</Text>
                      ) : null}
                    </View>
                    {isSel ? <Check size={18} color={colors.primary} strokeWidth={2.5} /> : null}
                  </TouchableOpacity>
                );
              })}

              {patientResults.length === 0 ? (
                <Text style={[styles.modalEmpty, { color: colors.textSecondary }]}>{t('reception.noPatients')}</Text>
              ) : null}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Doctor picker modal (multi-select) */}
      <Modal
        visible={openPicker === 'doctor'}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenPicker(null)}
      >
        <TouchableOpacity style={styles.modalScrim} activeOpacity={1} onPress={() => setOpenPicker(null)}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHead, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('reception.pcDoctorLabel')}</Text>
              <TouchableOpacity onPress={() => setOpenPicker(null)} hitSlop={10}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {/* "All doctors" clears the doctor filter. */}
              <TouchableOpacity
                style={styles.optRow}
                onPress={() => setSelectedDoctors([])}
                activeOpacity={0.7}
              >
                <Text style={[styles.optLabel, { color: colors.text }]}>{t('reception.pcAllDoctors')}</Text>
                {selectedDoctors.length === 0 ? <Check size={18} color={colors.primary} strokeWidth={2.5} /> : null}
              </TouchableOpacity>

              {doctors.map((d) => {
                const isSel = selectedDoctors.includes(d.id);
                return (
                  <TouchableOpacity
                    key={d.id}
                    style={styles.optRow}
                    onPress={() => toggleDoctor(d.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optText}>
                      <Text style={[styles.optLabel, { color: colors.text }]} numberOfLines={1}>
                        {`${d.first_name} ${d.last_name}`.trim()}
                      </Text>
                      {d.specialization ? (
                        <Text style={[styles.optSub, { color: colors.textTertiary }]} numberOfLines={1}>{d.specialization}</Text>
                      ) : null}
                    </View>
                    {isSel ? (
                      <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                        <Check size={14} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    ) : (
                      <View style={[styles.checkEmpty, { borderColor: colors.border }]} />
                    )}
                  </TouchableOpacity>
                );
              })}

              {doctors.length === 0 ? (
                <Text style={[styles.modalEmpty, { color: colors.textSecondary }]}>{t('reception.noDoctors')}</Text>
              ) : null}
            </ScrollView>

            {/* Done button so multi-select feels deliberate. */}
            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={() => setOpenPicker(null)}
              activeOpacity={0.85}
            >
              <Text style={styles.doneText}>{t('reception.continue')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },

    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 32 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40, minHeight: 280 },

    filterCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 18 },
    filterHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    filterTitle: { fontSize: 16, fontWeight: '800' },
    clearText: { fontSize: 13.5, fontWeight: '700' },

    fieldLabel: { fontSize: 12.5, fontWeight: '700', marginBottom: 6 },
    selectField: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      height: 50,
      borderRadius: 14,
      borderWidth: 1.5,
    },
    selectValue: { flex: 1, fontSize: 15, fontWeight: '600' },

    prompt: { borderRadius: 18, padding: 40, alignItems: 'center', gap: 12 },
    promptText: { fontSize: 14.5, fontWeight: '600', textAlign: 'center' },
    calWrap: { marginTop: 2 },

    // Modals
    modalScrim: { flex: 1, backgroundColor: 'rgba(2,6,23,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    modalCard: { width: '100%', maxWidth: 440, borderRadius: 22, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 16, maxHeight: '76%' },
    modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1 },
    modalTitle: { fontSize: 17, fontWeight: '800' },
    modalList: { paddingTop: 4 },
    modalEmpty: { fontSize: 14, textAlign: 'center', paddingVertical: 20 },

    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      height: 46,
      borderRadius: 12,
      borderWidth: 1.5,
      marginTop: 12,
    },
    searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },

    optRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, gap: 12 },
    optText: { flex: 1 },
    optLabel: { fontSize: 15, fontWeight: '600' },
    optSub: { fontSize: 12, marginTop: 1 },
    checkBadge: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    checkEmpty: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5 },

    doneBtn: { marginTop: 10, paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
    doneText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  });
